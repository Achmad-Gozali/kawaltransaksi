import { Hono } from 'hono';
import { getSupabaseAdmin, getSupabaseClient } from '../../core/supabase';
import { verifyTurnstile } from '../../core/turnstile';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../core/resend';
import { autoBlacklistIfAbuse } from '../../core/abuse';
import { kv } from '../../core/redis';

const auth = new Hono();

const LOCK_DURATION_MINUTES = 10;
const MAX_ATTEMPTS          = 5;

const FALLBACK_DISPOSABLE = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwaway.email',
  'sharklasers.com', 'yopmail.com', 'trashmail.com', 'maildrop.cc',
  'dispostable.com', 'fakeinbox.com', 'spamgourmet.com', 'trashmail.at',
  'getairmail.com', 'filzmail.com', 'spamfree24.org', 'mailnull.com',
  'temp-mail.org', 'tempinbox.com', 'getnada.com', 'emailondeck.com',
]);

const getIp = (c: any) =>
  c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'anonymous';

async function isDisposableEmail(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  try {
    const cached = await kv.get('disposable_domains');
    if (cached) return new Set(JSON.parse(cached)).has(domain);
    const res = await fetch(
      'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf'
    );
    if (res.ok) {
      const domains = (await res.text()).split('\n').map(d => d.trim()).filter(Boolean);
      await kv.put('disposable_domains', JSON.stringify(domains), { expirationTtl: 86400 });
      return new Set(domains).has(domain);
    }
  } catch {}
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

async function checkTurnstileBlacklist(token: string): Promise<{ blocked: boolean; message?: string }> {
  try {
    const key = `turnstile_used_${await hashToken(token)}`;
    if (await kv.get(key))
      return { blocked: true, message: 'Token verifikasi sudah digunakan. Muat ulang halaman.' };
    await kv.put(key, '1', { expirationTtl: 300 });
    return { blocked: false };
  } catch {
    return { blocked: false };
  }
}

async function checkRateLimit(key: string, maxCount: number, ttlSeconds: number): Promise<{ blocked: boolean; count: number }> {
  try {
    const count = parseInt(await kv.get(key) ?? '0');
    if (count >= maxCount) return { blocked: true, count };
    await kv.put(key, (count + 1).toString(), { expirationTtl: ttlSeconds });
    return { blocked: false, count: count + 1 };
  } catch {
    return { blocked: false, count: 0 };
  }
}

auth.post('/register', async (c) => {
  try {
    const { email, password, fullName, turnstileToken } = await c.req.json();

    if (!email || !password || !fullName)
      return c.json({ success: false, message: 'Semua field wajib diisi.' }, 400);
    if (!turnstileToken?.trim())
      return c.json({ success: false, message: 'Verifikasi keamanan wajib diselesaikan.' }, 400);

    const normalizedEmail   = email.trim().toLowerCase();
    const sanitizedFullName = fullName.trim().replace(/[<>'"]/g, '');

    if (await isDisposableEmail(normalizedEmail))
      return c.json({ success: false, message: 'Email sementara tidak diizinkan.' }, 400);
    if (sanitizedFullName.length < 2)
      return c.json({ success: false, message: 'Nama lengkap minimal 2 karakter.' }, 400);
    if (password.length < 8)
      return c.json({ success: false, message: 'Kata sandi tidak memenuhi persyaratan keamanan.' }, 400);

    const breach = await checkBreachedPassword(password);
    if (breach.breached)
      return c.json({ success: false, message: `Kata sandi ini pernah bocor ${breach.count.toLocaleString()} kali.` }, 400);

    const ip = getIp(c);
    const rl = await checkRateLimit(`rl_register_${ip}`, 3, 600);
    if (rl.blocked) {
      await autoBlacklistIfAbuse(ip, 'Abuse pada endpoint register');
      return c.json({ success: false, message: 'Terlalu banyak percobaan pendaftaran.', retry_after: 600 }, 429);
    }

    const tsCheck = await checkTurnstileBlacklist(turnstileToken);
    if (tsCheck.blocked) return c.json({ success: false, message: tsCheck.message }, 400);

    if (!await verifyTurnstile(turnstileToken, process.env.TURNSTILE_SECRET_KEY!))
      return c.json({ success: false, message: 'Verifikasi keamanan gagal.' }, 400);

    const supabase = getSupabaseAdmin();

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
        return c.json({ success: true, requiresVerification: true, message: 'Akun berhasil dibuat! Cek email kamu.' });
      return c.json({ success: false, message: 'Terjadi kesalahan saat mendaftar.' }, 500);
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo: `${process.env.FRONTEND_URL}/auth/confirm` },
    });

    if (linkError || !linkData)
      return c.json({ success: false, message: 'Gagal mengirim email verifikasi.' }, 500);

    sendVerificationEmail({
      to: normalizedEmail,
      fullName: sanitizedFullName,
      verificationLink: linkData.properties.action_link,
      apiKey: process.env.RESEND_API_KEY!,
    }).catch(console.error);

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

auth.post('/login', async (c) => {
  try {
    const { email, password, turnstileToken } = await c.req.json();

    if (!email || !password)
      return c.json({ success: false, message: 'Email dan kata sandi wajib diisi.' }, 400);
    if (!turnstileToken?.trim())
      return c.json({ success: false, message: 'Verifikasi keamanan wajib diselesaikan.' }, 400);

    const tsCheck = await checkTurnstileBlacklist(turnstileToken);
    if (tsCheck.blocked) return c.json({ success: false, message: tsCheck.message }, 400);

    if (!await verifyTurnstile(turnstileToken, process.env.TURNSTILE_SECRET_KEY!))
      return c.json({ success: false, message: 'Verifikasi keamanan gagal.' }, 400);

    const normalizedEmail = email.trim().toLowerCase();
    const ip              = getIp(c);
    const emailSlug       = btoa(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);

    const comboCheck = await checkRateLimit(`rl_login_${ip}_${emailSlug}`, 5, 300);
    if (comboCheck.blocked) {
      await autoBlacklistIfAbuse(ip, 'Abuse pada endpoint login');
      return c.json({ success: false, message: 'Terlalu banyak percobaan login.', retry_after: 300 }, 429);
    }
    const emailCheck = await checkRateLimit(`rl_email_${emailSlug}`, 10, 300);
    if (emailCheck.blocked)
      return c.json({ success: false, message: 'Terlalu banyak percobaan login.', retry_after: 300 }, 429);

    const supabase       = getSupabaseAdmin();
    const supabaseClient = getSupabaseClient();

    const { data: profile } = await supabase
      .from('profiles').select('id, failed_attempts, locked_until, is_banned')
      .eq('email', normalizedEmail).single();

    if (profile) {
      if (profile.is_banned)
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan.' }, 403);
      if (profile.locked_until) {
        const lockedUntil = new Date(profile.locked_until);
        if (lockedUntil > new Date())
          return c.json({ success: false, message: 'Akun dikunci sementara.', locked: true, locked_until: profile.locked_until }, 429);
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
        await autoBlacklistIfAbuse(ip, 'Berulang kali gagal login');
        return c.json({ success: false, message: 'Akun dikunci sementara.', locked: true, locked_until: lockedUntil.toISOString() }, 429);
      }
      await supabase.from('profiles').update({ failed_attempts: currentAttempts }).eq('id', profile.id);
      return c.json({
        success: false,
        message: remaining === 1 ? 'Email atau kata sandi salah. Hati-hati, akun akan dikunci.' : 'Email atau kata sandi salah.',
        locked: false,
        warning: remaining === 1,
      }, 401);
    }

    if (signInData.user) {
      const { data: fresh } = await supabase.from('profiles').select('is_banned').eq('id', signInData.user.id).single();
      if (fresh?.is_banned) {
        await supabaseClient.auth.signOut();
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan.' }, 403);
      }
      await Promise.allSettled([
        kv.delete(`rl_login_${ip}_${emailSlug}`),
        kv.delete(`rl_email_${emailSlug}`),
      ]);
      await supabase.from('profiles').update({ failed_attempts: 0, locked_until: null }).eq('id', signInData.user.id);
    }

    return c.json({ success: true, message: 'Login berhasil.', session: signInData.session });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

auth.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email || typeof email !== 'string' || !email.includes('@'))
      return c.json({ success: false, message: 'Email tidak valid.' }, 400);

    const normalizedEmail = email.trim().toLowerCase();
    const ip              = getIp(c);

    const check = await checkRateLimit(`rl_forgot_${ip}`, 3, 600);
    if (check.blocked)
      return c.json({ success: false, message: 'Terlalu banyak percobaan.' }, 429);

    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from('profiles').select('id, full_name, is_banned')
      .eq('email', normalizedEmail).single();

    if (!profile || profile.is_banned)
      return c.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim.' });

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: { redirectTo: `${process.env.FRONTEND_URL}/reset-kata-sandi` },
    });

    if (linkError || !linkData)
      return c.json({ success: false, message: 'Gagal mengirim email.' }, 500);

    sendPasswordResetEmail({
      to: normalizedEmail,
      fullName: profile.full_name || 'Pengguna',
      resetLink: linkData.properties.action_link,
      apiKey: process.env.RESEND_API_KEY!,
    }).catch(console.error);

    return c.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default auth;