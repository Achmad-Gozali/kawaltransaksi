import { Hono } from 'hono';
import { getSupabaseAdmin, getSupabaseClient } from '../../core/supabase';
import { verifyTurnstile } from '../../core/turnstile';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../core/resend';
import { autoBlacklistIfAbuse } from '../../core/abuse';
import type { Env } from '../../types';

const auth = new Hono<{ Bindings: Env }>();

const LOCK_DURATION_MINUTES = 10;
const MAX_ATTEMPTS          = 5;

// Fallback kalau fetch gagal
const FALLBACK_DISPOSABLE = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwaway.email',
  'sharklasers.com', 'yopmail.com', 'trashmail.com', 'maildrop.cc',
  'dispostable.com', 'fakeinbox.com', 'spamgourmet.com', 'trashmail.at',
  'getairmail.com', 'filzmail.com', 'spamfree24.org', 'mailnull.com',
  'temp-mail.org', 'tempinbox.com', 'getnada.com', 'emailondeck.com',
]);

// -- Helpers -------------------------------------------------------------------

async function isDisposableEmail(email: string, env: Env): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  try {
    // Cek cache KV dulu
    if (env.LIMITER) {
      const cached = await env.LIMITER.get('disposable_domains');
      if (cached) return new Set(JSON.parse(cached)).has(domain);
    }

    // Fetch dari GitHub (3000+ domain, update rutin)
    const res = await fetch(
      'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf',
      { cf: { cacheTtl: 86400 } } as RequestInit
    );

    if (res.ok) {
      const domains = (await res.text()).split('\n').map(d => d.trim()).filter(Boolean);
      // Cache 24 jam di KV
      if (env.LIMITER)
        await env.LIMITER.put('disposable_domains', JSON.stringify(domains), { expirationTtl: 86400 });
      return new Set(domains).has(domain);
    }
  } catch {
    // Kalau fetch/KV gagal, fallback ke daftar manual
  }

  return FALLBACK_DISPOSABLE.has(domain);
}

async function checkBreachedPassword(password: string): Promise<{ breached: boolean; count: number }> {
  try {
    const hashHex = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password)))
    ).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const res = await fetch(`https://api.pwnedpasswords.com/range/${hashHex.slice(0, 5)}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return { breached: false, count: 0 };

    for (const line of (await res.text()).split('\n')) {
      const [suffix, countStr] = line.trim().split(':');
      if (suffix === hashHex.slice(5)) {
        const count = parseInt(countStr, 10);
        return { breached: count > 0, count };
      }
    }
    return { breached: false, count: 0 };
  } catch {
    return { breached: false, count: 0 };
  }
}

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkTurnstileBlacklist(
  limiter: KVNamespace | undefined, token: string,
): Promise<{ blocked: boolean; message?: string }> {
  if (!limiter) return { blocked: false };
  try {
    const key = `turnstile_used_${await hashToken(token)}`;
    if (await limiter.get(key))
      return { blocked: true, message: 'Token verifikasi sudah digunakan. Muat ulang halaman.' };
    await limiter.put(key, '1', { expirationTtl: 300 });
    return { blocked: false };
  } catch {
    return { blocked: false };
  }
}

async function checkRateLimit(
  limiter: KVNamespace, key: string, maxCount: number, ttlSeconds: number,
): Promise<{ blocked: boolean; count: number }> {
  try {
    const count = parseInt(await limiter.get(key) ?? '0');
    if (count >= maxCount) return { blocked: true, count };
    await limiter.put(key, (count + 1).toString(), { expirationTtl: ttlSeconds });
    return { blocked: false, count: count + 1 };
  } catch {
    return { blocked: false, count: 0 };
  }
}

// -- POST /api/auth/register ---------------------------------------------------

auth.post('/register', async (c) => {
  try {
    const { email, password, fullName, turnstileToken } = await c.req.json();

    if (!email || !password || !fullName)
      return c.json({ success: false, message: 'Semua field wajib diisi.' }, 400);
    if (!turnstileToken?.trim())
      return c.json({ success: false, message: 'Verifikasi keamanan wajib diselesaikan.' }, 400);

    const normalizedEmail   = email.trim().toLowerCase();
    const sanitizedFullName = fullName.trim().replace(/[<>'"]/g, '');

    if (await isDisposableEmail(normalizedEmail, c.env))
      return c.json({ success: false, message: 'Email sementara tidak diizinkan. Gunakan email asli.' }, 400);

    if (sanitizedFullName.length < 2)
      return c.json({ success: false, message: 'Nama lengkap minimal 2 karakter.' }, 400);
    if (password.length < 8)
      return c.json({ success: false, message: 'Kata sandi tidak memenuhi persyaratan keamanan.' }, 400);

    const breach = await checkBreachedPassword(password);
    if (breach.breached)
      return c.json({ success: false, message: `Kata sandi ini pernah bocor ${breach.count.toLocaleString()} kali. Gunakan kata sandi yang berbeda.` }, 400);

    const ip = c.req.header('CF-Connecting-IP') || 'anonymous';

    if (c.env.LIMITER) {
      const rl = await checkRateLimit(c.env.LIMITER, `rl_register_${ip}`, 3, 600);
      if (rl.blocked) {
        await autoBlacklistIfAbuse(c.env.LIMITER, ip, 'Abuse pada endpoint register');
        return c.json({ success: false, message: 'Terlalu banyak percobaan pendaftaran. Tunggu beberapa menit.', retry_after: 600 }, 429);
      }
    }

    const tsCheck = await checkTurnstileBlacklist(c.env.LIMITER, turnstileToken);
    if (tsCheck.blocked) return c.json({ success: false, message: tsCheck.message }, 400);

    if (!await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY))
      return c.json({ success: false, message: 'Verifikasi keamanan gagal. Muat ulang halaman.' }, 400);

    const supabase = getSupabaseAdmin(c.env);

    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false,
      user_metadata: { full_name: sanitizedFullName },
    });

    if (signUpError) {
      const isAlreadyExists =
        signUpError.message.includes('already registered') ||
        signUpError.message.includes('already exists');
      if (isAlreadyExists)
        return c.json({ success: true, requiresVerification: true, message: 'Akun berhasil dibuat! Cek email kamu untuk verifikasi.' });
      return c.json({ success: false, message: 'Terjadi kesalahan saat mendaftar. Coba lagi.' }, 500);
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo: `${c.env.FRONTEND_URL}/auth/confirm` },
    });

    if (linkError || !linkData)
      return c.json({ success: false, message: 'Gagal mengirim email verifikasi. Coba lagi.' }, 500);

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
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// -- POST /api/auth/login ------------------------------------------------------

auth.post('/login', async (c) => {
  try {
    const { email, password, turnstileToken } = await c.req.json();

    if (!email || !password)
      return c.json({ success: false, message: 'Email dan kata sandi wajib diisi.' }, 400);
    if (!turnstileToken?.trim())
      return c.json({ success: false, message: 'Verifikasi keamanan wajib diselesaikan.' }, 400);

    const tsCheck = await checkTurnstileBlacklist(c.env.LIMITER, turnstileToken);
    if (tsCheck.blocked) return c.json({ success: false, message: tsCheck.message }, 400);

    if (!await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY))
      return c.json({ success: false, message: 'Verifikasi keamanan gagal. Muat ulang halaman.' }, 400);

    const normalizedEmail = email.trim().toLowerCase();
    const ip              = c.req.header('CF-Connecting-IP') || 'anonymous';

    if (c.env.LIMITER) {
      const emailSlug  = btoa(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
      const comboCheck = await checkRateLimit(c.env.LIMITER, `rl_login_${ip}_${emailSlug}`, 5, 300);
      if (comboCheck.blocked) {
        await autoBlacklistIfAbuse(c.env.LIMITER, ip, 'Abuse pada endpoint login');
        return c.json({ success: false, message: 'Terlalu banyak percobaan login. Tunggu beberapa menit.', retry_after: 300 }, 429);
      }
      const emailCheck = await checkRateLimit(c.env.LIMITER, `rl_email_${emailSlug}`, 10, 300);
      if (emailCheck.blocked)
        return c.json({ success: false, message: 'Terlalu banyak percobaan login. Tunggu beberapa menit.', retry_after: 300 }, 429);
    }

    const supabase       = getSupabaseAdmin(c.env);
    const supabaseClient = getSupabaseClient(c.env);

    const { data: profile } = await supabase
      .from('profiles').select('id, failed_attempts, locked_until, is_banned')
      .eq('email', normalizedEmail).single();

    if (profile) {
      if (profile.is_banned)
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }, 403);
      if (profile.locked_until) {
        const lockedUntil = new Date(profile.locked_until);
        if (lockedUntil > new Date())
          return c.json({ success: false, message: 'Akun dikunci sementara karena terlalu banyak percobaan gagal.', locked: true, locked_until: profile.locked_until }, 429);
        await supabase.from('profiles').update({ failed_attempts: 0, locked_until: null }).eq('id', profile.id);
      }
    }

    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail, password,
    });

    if (signInError) {
      if (!profile) return c.json({ success: false, message: 'Email atau kata sandi salah.' }, 401);

      const { data: fresh } = await supabase.from('profiles').select('failed_attempts').eq('id', profile.id).single();
      const currentAttempts = (fresh?.failed_attempts ?? 0) + 1;
      const remaining       = MAX_ATTEMPTS - currentAttempts;

      if (currentAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        await supabase.from('profiles').update({ failed_attempts: currentAttempts, locked_until: lockedUntil.toISOString() }).eq('id', profile.id);
        if (c.env.LIMITER) await autoBlacklistIfAbuse(c.env.LIMITER, ip, 'Berulang kali gagal login hingga lockout');
        return c.json({ success: false, message: 'Akun dikunci sementara. Coba lagi nanti.', locked: true, locked_until: lockedUntil.toISOString() }, 429);
      }

      await supabase.from('profiles').update({ failed_attempts: currentAttempts }).eq('id', profile.id);
      return c.json({
        success: false,
        message: remaining === 1 ? 'Email atau kata sandi salah. Hati-hati, akun akan dikunci jika terus gagal.' : 'Email atau kata sandi salah.',
        locked: false,
        warning: remaining === 1,
      }, 401);
    }

    if (signInData.user) {
      const { data: fresh } = await supabase.from('profiles').select('is_banned').eq('id', signInData.user.id).single();
      if (fresh?.is_banned) {
        await supabaseClient.auth.signOut();
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }, 403);
      }

      if (c.env.LIMITER) {
        const emailSlug = btoa(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
        await Promise.allSettled([
          c.env.LIMITER.delete(`rl_login_${ip}_${emailSlug}`),
          c.env.LIMITER.delete(`rl_email_${emailSlug}`),
        ]);
      }
      await supabase.from('profiles').update({ failed_attempts: 0, locked_until: null }).eq('id', signInData.user.id);
    }

    return c.json({ success: true, message: 'Login berhasil.', session: signInData.session });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// -- POST /api/auth/forgot-password --------------------------------------------

auth.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email || typeof email !== 'string' || !email.includes('@'))
      return c.json({ success: false, message: 'Email tidak valid.' }, 400);

    const normalizedEmail = email.trim().toLowerCase();
    const ip              = c.req.header('CF-Connecting-IP') || 'anonymous';

    if (c.env.LIMITER) {
      const check = await checkRateLimit(c.env.LIMITER, `rl_forgot_${ip}`, 3, 600);
      if (check.blocked)
        return c.json({ success: false, message: 'Terlalu banyak percobaan. Tunggu beberapa menit.' }, 429);
    }

    const supabase = getSupabaseAdmin(c.env);
    const { data: profile } = await supabase
      .from('profiles').select('id, full_name, is_banned')
      .eq('email', normalizedEmail).single();

    if (!profile || profile.is_banned)
      return c.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim.' });

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: { redirectTo: `${c.env.FRONTEND_URL}/reset-kata-sandi` },
    });

    if (linkError || !linkData)
      return c.json({ success: false, message: 'Gagal mengirim email. Coba lagi.' }, 500);

    c.executionCtx.waitUntil(
      sendPasswordResetEmail({
        to: normalizedEmail,
        fullName: profile.full_name || 'Pengguna',
        resetLink: linkData.properties.action_link,
        apiKey: c.env.RESEND_API_KEY,
      })
    );

    return c.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default auth;