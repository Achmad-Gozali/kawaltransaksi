import { Hono } from 'hono';
import { getSupabaseAdmin, getSupabaseClient } from '../lib/supabase';
import { verifyTurnstile } from '../lib/turnstile';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/resend';
import { autoBlacklistIfAbuse } from '../index';
import type { Env } from '../types';

const auth = new Hono<{ Bindings: Env }>();

const LOCK_DURATION_MINUTES = 10;
const MAX_ATTEMPTS = 5;

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkAndBlacklistTurnstile(
  limiter: KVNamespace | undefined,
  token: string
): Promise<{ blocked: boolean; message?: string }> {
  if (!limiter) return { blocked: false };
  try {
    const hashed = await hashToken(token);
    const blacklistKey = `turnstile_used_${hashed}`;
    const alreadyUsed = await limiter.get(blacklistKey);
    if (alreadyUsed) {
      return { blocked: true, message: 'Token verifikasi sudah digunakan. Muat ulang halaman.' };
    }
    await limiter.put(blacklistKey, '1', { expirationTtl: 300 });
    return { blocked: false };
  } catch (err) {
    console.error('[TURNSTILE BLACKLIST] Error KV:', err);
    return { blocked: false };
  }
}

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
    return { blocked: false, count: 0 };
  }
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
auth.post('/register', async (c) => {
  try {
    const { email, password, fullName, turnstileToken } = await c.req.json();

    if (!email || !password || !fullName) {
      return c.json({ success: false, message: 'Semua field wajib diisi.' }, 400);
    }

    if (!turnstileToken || typeof turnstileToken !== 'string' || turnstileToken.trim() === '') {
      return c.json({ success: false, message: 'Verifikasi keamanan wajib diselesaikan.' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const sanitizedFullName = fullName.trim().replace(/[<>'"]/g, '');

    if (sanitizedFullName.length < 2) {
      return c.json({ success: false, message: 'Nama lengkap minimal 2 karakter.' }, 400);
    }

    if (password.length < 8) {
      return c.json({ success: false, message: 'Kata sandi tidak memenuhi persyaratan keamanan.' }, 400);
    }

    const ip = c.req.header('CF-Connecting-IP') || 'anonymous';

    if (c.env.LIMITER) {
      const registerKey = `rl_register_${ip}`;
      const registerCheck = await checkRateLimit(c.env.LIMITER, registerKey, 3, 600);
      if (registerCheck.blocked) {
        console.warn(`[REGISTER RL] IP diblokir — IP: ${ip}`);
        await autoBlacklistIfAbuse(c.env.LIMITER, ip, 'Abuse pada endpoint register');
        return c.json({
          success: false,
          message: 'Terlalu banyak percobaan pendaftaran. Tunggu beberapa menit.',
          retry_after: 600,
        }, 429);
      }
    }

    const blacklistCheck = await checkAndBlacklistTurnstile(c.env.LIMITER, turnstileToken);
    if (blacklistCheck.blocked) {
      return c.json({ success: false, message: blacklistCheck.message }, 400);
    }

    const isValidTurnstile = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY);
    if (!isValidTurnstile) {
      return c.json({ success: false, message: 'Verifikasi keamanan gagal. Muat ulang halaman.' }, 400);
    }

    const supabaseAdmin = getSupabaseAdmin(c.env);

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingProfile) {
      return c.json({
        success: false,
        message: 'Terjadi kesalahan saat mendaftar. Coba gunakan email lain atau masuk jika sudah punya akun.',
      }, 409);
    }

    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false,
      user_metadata: { full_name: sanitizedFullName },
    });

    if (signUpError) {
      console.error('[REGISTER] Supabase error:', signUpError.message);
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        return c.json({
          success: false,
          message: 'Terjadi kesalahan saat mendaftar. Coba gunakan email lain atau masuk jika sudah punya akun.',
        }, 409);
      }
      return c.json({ success: false, message: 'Terjadi kesalahan saat mendaftar. Coba lagi.' }, 500);
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: {
        redirectTo: `${c.env.FRONTEND_URL}/auth/confirm`,
      },
    });

    if (linkError || !linkData) {
      console.error('[REGISTER] Gagal generate link:', linkError?.message);
      return c.json({ success: false, message: 'Gagal mengirim email verifikasi. Coba lagi.' }, 500);
    }

    c.executionCtx.waitUntil(
      sendVerificationEmail({
        to: normalizedEmail,
        fullName: sanitizedFullName,
        verificationLink: linkData.properties.action_link,
        apiKey: c.env.RESEND_API_KEY,
      })
    );

    return c.json({
      success: true,
      requiresVerification: true,
      message: 'Akun berhasil dibuat! Cek email kamu untuk verifikasi.',
      userId: signUpData.user?.id,
    });

  } catch (err) {
    console.error('[REGISTER] Error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
auth.post('/login', async (c) => {
  try {
    const { email, password, turnstileToken } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, message: 'Email dan kata sandi wajib diisi.' }, 400);
    }

    if (!turnstileToken || typeof turnstileToken !== 'string' || turnstileToken.trim() === '') {
      return c.json({ success: false, message: 'Verifikasi keamanan wajib diselesaikan.' }, 400);
    }

    const blacklistCheck = await checkAndBlacklistTurnstile(c.env.LIMITER, turnstileToken);
    if (blacklistCheck.blocked) {
      return c.json({ success: false, message: blacklistCheck.message }, 400);
    }

    const isValidTurnstile = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY);
    if (!isValidTurnstile) {
      return c.json({ success: false, message: 'Verifikasi keamanan gagal. Muat ulang halaman.' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ip = c.req.header('CF-Connecting-IP') || 'anonymous';

    if (c.env.LIMITER) {
      const emailSlug = btoa(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
      const comboKey = `rl_login_${ip}_${emailSlug}`;
      const emailOnlyKey = `rl_email_${emailSlug}`;

      const comboCheck = await checkRateLimit(c.env.LIMITER, comboKey, 5, 300);
      if (comboCheck.blocked) {
        console.warn(`[LOGIN RL] IP+email diblokir — IP: ${ip}`);
        await autoBlacklistIfAbuse(c.env.LIMITER, ip, 'Abuse pada endpoint login');
        return c.json({
          success: false,
          message: 'Terlalu banyak percobaan login. Tunggu beberapa menit.',
          retry_after: 300,
        }, 429);
      }

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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, failed_attempts, locked_until, is_banned')
      .eq('email', normalizedEmail)
      .single();

    if (profile && !profileError) {
      if (profile.is_banned) {
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }, 403);
      }

      if (profile.locked_until) {
        const lockedUntil = new Date(profile.locked_until);
        if (lockedUntil > new Date()) {
          return c.json({
            success: false,
            message: 'Akun dikunci sementara karena terlalu banyak percobaan gagal.',
            locked: true,
            locked_until: profile.locked_until,
          }, 429);
        } else {
          await supabaseAdmin
            .from('profiles')
            .update({ failed_attempts: 0, locked_until: null })
            .eq('id', profile.id);
        }
      }
    }

    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
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

      if (currentAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        await supabaseAdmin
          .from('profiles')
          .update({
            failed_attempts: currentAttempts,
            locked_until: lockedUntil.toISOString(),
          })
          .eq('id', profile.id);

        if (c.env.LIMITER) {
          await autoBlacklistIfAbuse(c.env.LIMITER, ip, 'Berulang kali gagal login hingga lockout');
        }

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

      if (remaining === 1) {
        return c.json({
          success: false,
          message: 'Email atau kata sandi salah. Hati-hati, akun akan dikunci jika terus gagal.',
          locked: false,
          warning: true,
        }, 401);
      }

      return c.json({
        success: false,
        message: 'Email atau kata sandi salah.',
        locked: false,
        warning: false,
      }, 401);
    }

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

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
auth.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return c.json({ success: false, message: 'Email tidak valid.' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ip = c.req.header('CF-Connecting-IP') || 'anonymous';

    // Rate limit: maks 3 request per 10 menit per IP
    if (c.env.LIMITER) {
      const key = `rl_forgot_${ip}`;
      const check = await checkRateLimit(c.env.LIMITER, key, 3, 600);
      if (check.blocked) {
        return c.json({
          success: false,
          message: 'Terlalu banyak percobaan. Tunggu beberapa menit.',
        }, 429);
      }
    }

    const supabaseAdmin = getSupabaseAdmin(c.env);

    // Cek apakah email terdaftar
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, is_banned')
      .eq('email', normalizedEmail)
      .single();

    // Selalu return success meskipun email tidak ada — mencegah email enumeration
    if (!profile || profile.is_banned) {
      return c.json({
        success: true,
        message: 'Jika email terdaftar, link reset akan dikirim.',
      });
    }

    // Generate reset password link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${c.env.FRONTEND_URL}/reset-kata-sandi`,
      },
    });

    if (linkError || !linkData) {
      console.error('[FORGOT PASSWORD] Gagal generate link:', linkError?.message);
      return c.json({ success: false, message: 'Gagal mengirim email. Coba lagi.' }, 500);
    }

    c.executionCtx.waitUntil(
      sendPasswordResetEmail({
        to: normalizedEmail,
        fullName: profile.full_name || 'Pengguna',
        resetLink: linkData.properties.action_link,
        apiKey: c.env.RESEND_API_KEY,
      })
    );

    return c.json({
      success: true,
      message: 'Jika email terdaftar, link reset akan dikirim.',
    });

  } catch (err) {
    console.error('[FORGOT PASSWORD] Error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default auth;