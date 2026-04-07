import { Hono } from 'hono';
import { getSupabaseAdmin, getSupabaseClient } from '../lib/supabase';
import type { Env } from '../types';

const auth = new Hono<{ Bindings: Env }>();

const LOCK_DURATION_MINUTES = 15;
const MAX_ATTEMPTS = 3;

// ── POST /api/auth/verify-recaptcha ──────────────────────────────────────────
auth.post('/verify-recaptcha', async (c) => {
  try {
    const { token } = await c.req.json();
    if (!token) return c.json({ success: false, message: 'Token tidak ditemukan.' }, 400);

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${c.env.RECAPTCHA_SECRET_KEY}&response=${token}`;
    const response = await fetch(verifyUrl, { method: 'POST' });
    const data = await response.json() as { success: boolean; score: number };

    if (!data.success) return c.json({ success: false, message: 'Verifikasi reCAPTCHA gagal.' }, 400);

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
    const supabaseAdmin = getSupabaseAdmin(c.env);
    const supabaseClient = getSupabaseClient(c.env);

    // ── Cari user by email dulu ───────────────────────────────────────────────
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const authUser = users?.find((u: { email?: string }) => u.email?.toLowerCase() === normalizedEmail);

    if (authUser) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('failed_attempts, locked_until, is_banned')
        .eq('id', authUser.id)
        .single();

      if (profile?.is_banned) {
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }, 403);
      }

      // ── Cek locked SEBELUM attempt login ─────────────────────────────────
      if (profile?.locked_until) {
        const lockedUntil = new Date(profile.locked_until);
        if (lockedUntil > new Date()) {
          const remainingMs = lockedUntil.getTime() - Date.now();
          const lockedUntilTime = lockedUntil.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          return c.json({
            success: false,
            message: `Akun dikunci. Coba lagi pukul ${lockedUntilTime}.`,
            locked: true,
            locked_until: profile.locked_until,
            remaining_ms: remainingMs,
          }, 429);
        } else {
          await supabaseAdmin.from('profiles').update({ failed_attempts: 0, locked_until: null }).eq('id', authUser.id);
        }
      }
    }

    // ── Coba login ────────────────────────────────────────────────────────────
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      if (!authUser) {
        return c.json({ success: false, message: 'Email atau kata sandi salah.' }, 401);
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('failed_attempts, locked_until, is_banned')
        .eq('id', authUser.id)
        .single();

      const currentAttempts = (profile?.failed_attempts ?? 0) + 1;
      const remaining = MAX_ATTEMPTS - currentAttempts;

      if (currentAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        await supabaseAdmin.from('profiles').update({
          failed_attempts: currentAttempts,
          locked_until: lockedUntil.toISOString(),
        }).eq('id', authUser.id);

        const lockedUntilTime = lockedUntil.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return c.json({
          success: false,
          message: `Akun dikunci selama ${LOCK_DURATION_MINUTES} menit. Coba lagi pukul ${lockedUntilTime}.`,
          locked: true,
          locked_until: lockedUntil.toISOString(),
          remaining_ms: LOCK_DURATION_MINUTES * 60 * 1000,
        }, 429);
      }

      await supabaseAdmin.from('profiles').update({ failed_attempts: currentAttempts }).eq('id', authUser.id);
      return c.json({
        success: false,
        message: remaining === 1
          ? 'Kata sandi salah. Tersisa 1 percobaan sebelum akun dikunci.'
          : `Kata sandi salah. Tersisa ${remaining} percobaan lagi.`,
        locked: false,
        remaining_attempts: remaining,
      }, 401);
    }

    // ── Login berhasil ────────────────────────────────────────────────────────
    if (signInData.user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_banned')
        .eq('id', signInData.user.id)
        .single();

      if (profile?.is_banned) {
        await supabaseClient.auth.signOut();
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }, 403);
      }

      await supabaseAdmin.from('profiles')
        .update({ failed_attempts: 0, locked_until: null })
        .eq('id', signInData.user.id);
    }

    return c.json({
      success: true,
      message: 'Login berhasil.',
      session: signInData.session,
      user: signInData.user,
    });

  } catch (err) {
    console.error('Login error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default auth;