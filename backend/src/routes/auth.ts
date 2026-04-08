import { Hono } from 'hono';
import { getSupabaseAdmin, getSupabaseClient } from '../lib/supabase';
import type { Env } from '../types';

const auth = new Hono<{ Bindings: Env }>();

const LOCK_DURATION_MINUTES = 10;
const MAX_ATTEMPTS = 5;

// ── Helper: rate limit per key ────────────────────────────────────────────────
async function checkRateLimit(
  limiter: KVNamespace,
  key: string,
  maxCount: number,
  ttlSeconds: number
): Promise<{ blocked: boolean; count: number }> {
  try {
    const raw = await limiter.get(key);
    const count = raw ? parseInt(raw) : 0;
    if (count >= maxCount) return { blocked: true, count };
    await limiter.put(key, (count + 1).toString(), { expirationTtl: ttlSeconds });
    return { blocked: false, count: count + 1 };
  } catch (err) {
    console.error(`[RATE LIMIT] Error KV key=${key}:`, err);
    return { blocked: false, count: 0 }; // fail open
  }
}

// ── POST /api/auth/verify-recaptcha ──────────────────────────────────────────
auth.post('/verify-recaptcha', async (c) => {
  try {
    const { token, action } = await c.req.json();
    if (!token) return c.json({ success: false, message: 'Token tidak ditemukan.' }, 400);

    const ALLOWED_ACTIONS = ['login', 'register'];
    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      return c.json({ success: false, message: 'Action tidak valid.' }, 400);
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${c.env.RECAPTCHA_SECRET_KEY}&response=${token}`;
    const response = await fetch(verifyUrl, { method: 'POST' });
    const data = await response.json() as { success: boolean; score: number; action?: string };

    if (!data.success) return c.json({ success: false, message: 'Verifikasi reCAPTCHA gagal.' }, 400);

    if (data.action && data.action !== action) {
      return c.json({ success: false, message: 'Token keamanan tidak valid untuk aksi ini.' }, 403);
    }

    const threshold = 0.3;
    if (data.score < threshold) return c.json({ success: false, message: 'Terdeteksi aktivitas mencurigakan.' }, 403);

    return c.json({ success: true, score: data.score });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, message: 'Email dan kata sandi wajib diisi.' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ip = c.req.header('CF-Connecting-IP') || 'anonymous';

    // ── Rate limit per IP+email & per email saja ──────────────────────────────
    if (c.env.LIMITER) {
      const emailSlug = btoa(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
      const comboKey = `rl_login_${ip}_${emailSlug}`;
      const emailOnlyKey = `rl_email_${emailSlug}`;

      // 5 percobaan per IP+email dalam 5 menit
      const comboCheck = await checkRateLimit(c.env.LIMITER, comboKey, 5, 300);
      if (comboCheck.blocked) {
        console.warn(`[LOGIN RL] IP+email diblokir — IP: ${ip}`);
        return c.json({
          success: false,
          message: 'Terlalu banyak percobaan login. Tunggu beberapa menit.',
          retry_after: 300,
        }, 429);
      }

      // 10 percobaan per email dari semua IP dalam 5 menit (cegah distributed attack)
      const emailCheck = await checkRateLimit(c.env.LIMITER, emailOnlyKey, 10, 300);
      if (emailCheck.blocked) {
        console.warn(`[LOGIN RL] Email diblokir dari semua IP — email: ${normalizedEmail}`);
        return c.json({
          success: false,
          message: 'Terlalu banyak percobaan login. Tunggu beberapa menit.',
          retry_after: 300,
        }, 429);
      }
    }

    const supabaseAdmin = getSupabaseAdmin(c.env);
    const supabaseClient = getSupabaseClient(c.env);

    // ── Cari profile by email ─────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, failed_attempts, locked_until, is_banned')
      .eq('email', normalizedEmail)
      .single();

    if (profile && !profileError) {
      if (profile.is_banned) {
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }, 403);
      }

      // ── Cek locked SEBELUM attempt login ─────────────────────────────────
      if (profile.locked_until) {
        const lockedUntil = new Date(profile.locked_until);
        if (lockedUntil > new Date()) {
          const remainingSeconds = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
          return c.json({
            success: false,
            message: 'Akun dikunci sementara karena terlalu banyak percobaan gagal.',
            locked: true,
            locked_until: profile.locked_until,
          }, 429);
        } else {
          // Lock sudah expire, reset
          await supabaseAdmin
            .from('profiles')
            .update({ failed_attempts: 0, locked_until: null })
            .eq('id', profile.id);
        }
      }
    }

    // ── Coba login ────────────────────────────────────────────────────────────
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      // Pesan error SAMA untuk semua kasus gagal — cegah enumerasi akun
      if (!profile || profileError) {
        return c.json({ success: false, message: 'Email atau kata sandi salah.' }, 401);
      }

      const { data: freshProfile } = await supabaseAdmin
        .from('profiles')
        .select('failed_attempts, locked_until, is_banned')
        .eq('id', profile.id)
        .single();

      const currentAttempts = (freshProfile?.failed_attempts ?? 0) + 1;
      const remaining = MAX_ATTEMPTS - currentAttempts;

      // ── Percobaan ke-5: langsung lock ────────────────────────────────────
      if (currentAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        await supabaseAdmin
          .from('profiles')
          .update({
            failed_attempts: currentAttempts,
            locked_until: lockedUntil.toISOString(),
          })
          .eq('id', profile.id);

        return c.json({
          success: false,
          message: 'Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi nanti.',
          locked: true,
          locked_until: lockedUntil.toISOString(),
        }, 429);
      }

      await supabaseAdmin
        .from('profiles')
        .update({ failed_attempts: currentAttempts })
        .eq('id', profile.id);

      // ── Percobaan ke-4: warning ───────────────────────────────────────────
      if (remaining === 1) {
        return c.json({
          success: false,
          message: 'Email atau kata sandi salah. Hati-hati, akun akan dikunci jika terus gagal.',
          locked: false,
          warning: true,
        }, 401);
      }

      // ── Percobaan 1-3: error generik ─────────────────────────────────────
      return c.json({
        success: false,
        message: 'Email atau kata sandi salah.',
        locked: false,
        warning: false,
      }, 401);
    }

    // ── Login berhasil ────────────────────────────────────────────────────────
    if (signInData.user) {
      const { data: freshProfile } = await supabaseAdmin
        .from('profiles')
        .select('is_banned')
        .eq('id', signInData.user.id)
        .single();

      if (freshProfile?.is_banned) {
        await supabaseClient.auth.signOut();
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }, 403);
      }

      // Reset counter login di KV juga saat berhasil
      if (c.env.LIMITER) {
        try {
          const emailSlug = btoa(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
          await c.env.LIMITER.delete(`rl_login_${ip}_${emailSlug}`);
          await c.env.LIMITER.delete(`rl_email_${emailSlug}`);
        } catch (err) {
          console.error('[LOGIN RL] Gagal reset KV counter:', err);
        }
      }

      await supabaseAdmin
        .from('profiles')
        .update({ failed_attempts: 0, locked_until: null })
        .eq('id', signInData.user.id);
    }

    return c.json({
      success: true,
      message: 'Login berhasil.',
      session: signInData.session,
    });

  } catch (err) {
    console.error('Login error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default auth;