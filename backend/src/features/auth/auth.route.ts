import { Hono } from 'hono';
import { auth } from '../../core/auth-better';
import { verifyTurnstile } from '../../core/turnstile';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../core/resend';
import { autoBlacklistIfAbuse } from '../../core/abuse';
import { kv } from '../../core/redis';
import sql from '../../core/db';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const authRoute = new Hono();

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

async function createVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const id = randomBytes(16).toString('hex');
  await sql`
    INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
    VALUES (${id}, ${email}, ${token}, ${expires}, now(), now())
    ON CONFLICT (identifier) DO UPDATE
    SET value = ${token}, "expiresAt" = ${expires}, "updatedAt" = now()
  `;
  return token;
}

async function createResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const id = randomBytes(16).toString('hex');
  await sql`
    INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
    VALUES (${id}, ${'reset:' + email}, ${token}, ${expires}, now(), now())
    ON CONFLICT (identifier) DO UPDATE
    SET value = ${token}, "expiresAt" = ${expires}, "updatedAt" = now()
  `;
  return token;
}

async function tryLazyMigratePassword(userId: string, password: string): Promise<boolean> {
  const [row] = await sql`
    SELECT legacy_bcrypt_hash FROM profiles WHERE id = ${userId} LIMIT 1
  `;
  if (!row?.legacy_bcrypt_hash) return false;

  const valid = await bcrypt.compare(password, row.legacy_bcrypt_hash);
  if (!valid) return false;

  const ctx = await auth.$context;
  const scryptHash = await ctx.password.hash(password);

  const [existingAccount] = await sql`
    SELECT id FROM account WHERE "userId" = ${userId} AND "providerId" = 'credential' LIMIT 1
  `;

  if (existingAccount) {
    await sql`UPDATE account SET password = ${scryptHash}, "updatedAt" = now() WHERE id = ${existingAccount.id}`;
  } else {
    await ctx.internalAdapter.createAccount({
      accountId: userId,
      providerId: 'credential',
      userId,
      password: scryptHash,
    });
  }

  await sql`UPDATE profiles SET legacy_bcrypt_hash = NULL WHERE id = ${userId}`;
  return true;
}

authRoute.post('/register', async (c) => {
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

    const [existing] = await sql`SELECT id FROM "user" WHERE email = ${normalizedEmail} LIMIT 1`;
    if (existing)
      return c.json({ success: true, requiresVerification: true, message: 'Akun berhasil dibuat! Cek email kamu.' });

    const result = await auth.api.signUpEmail({
      body: {
        email:    normalizedEmail,
        password: password,
        name:     sanitizedFullName,
      },
    });

    if (!result || !result.user)
      return c.json({ success: false, message: 'Terjadi kesalahan saat mendaftar.' }, 500);

    const userId = result.user.id;

    await sql`
      INSERT INTO profiles (id, email, full_name, role, failed_attempts, is_banned, welcome_sent)
      VALUES (${userId}, ${normalizedEmail}, ${sanitizedFullName}, 'user', 0, false, false)
      ON CONFLICT (id) DO NOTHING
    `.catch(console.error);

    const token = await createVerificationToken(normalizedEmail);
    const verificationLink = `${process.env.FRONTEND_URL}/auth/confirm?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    sendVerificationEmail({
      to:               normalizedEmail,
      fullName:         sanitizedFullName,
      verificationLink: verificationLink,
      apiKey:           process.env.RESEND_API_KEY!,
    }).catch(console.error);

    return c.json({
      success:              true,
      requiresVerification: true,
      message:              'Akun berhasil dibuat! Cek email kamu untuk verifikasi.',
      userId,
    });
  } catch (err) {
    console.error('[AUTH] register error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

authRoute.post('/login', async (c) => {
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

    const [profile] = await sql`
      SELECT id, failed_attempts, locked_until, is_banned
      FROM profiles WHERE email = ${normalizedEmail} LIMIT 1
    `;

    if (profile) {
      if (profile.is_banned)
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan.' }, 403);
      if (profile.locked_until) {
        const lockedUntil = new Date(profile.locked_until);
        if (lockedUntil > new Date())
          return c.json({ success: false, message: 'Akun dikunci sementara.', locked: true, locked_until: profile.locked_until }, 429);
        await sql`UPDATE profiles SET failed_attempts = 0, locked_until = null WHERE id = ${profile.id}`;
      }
    }

    let signInResult: any;
    try {
      signInResult = await auth.api.signInEmail({
        body: { email: normalizedEmail, password },
      });
    } catch {
      signInResult = null;
    }

    if (!signInResult?.user && profile) {
      const migrated = await tryLazyMigratePassword(profile.id, password);
      if (migrated) {
        try {
          signInResult = await auth.api.signInEmail({
            body: { email: normalizedEmail, password },
          });
        } catch {
          signInResult = null;
        }
      }
    }

    if (!signInResult || !signInResult.user) {
      if (!profile) return c.json({ success: false, message: 'Email atau kata sandi salah.' }, 401);
      const [fresh] = await sql`SELECT failed_attempts FROM profiles WHERE id = ${profile.id} LIMIT 1`;
      const currentAttempts = (fresh?.failed_attempts ?? 0) + 1;
      const remaining       = MAX_ATTEMPTS - currentAttempts;
      if (currentAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000).toISOString();
        await sql`UPDATE profiles SET failed_attempts = ${currentAttempts}, locked_until = ${lockedUntil} WHERE id = ${profile.id}`;
        await autoBlacklistIfAbuse(ip, 'Berulang kali gagal login');
        return c.json({ success: false, message: 'Akun dikunci sementara.', locked: true, locked_until: lockedUntil }, 429);
      }
      await sql`UPDATE profiles SET failed_attempts = ${currentAttempts} WHERE id = ${profile.id}`;
      return c.json({
        success: false,
        message: remaining === 1 ? 'Email atau kata sandi salah. Hati-hati, akun akan dikunci.' : 'Email atau kata sandi salah.',
        locked:  false,
        warning: remaining === 1,
      }, 401);
    }

    const [fresh] = await sql`SELECT is_banned FROM profiles WHERE id = ${signInResult.user.id} LIMIT 1`;
    if (fresh?.is_banned)
      return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan.' }, 403);

    await Promise.allSettled([
      kv.delete(`rl_login_${ip}_${emailSlug}`),
      kv.delete(`rl_email_${emailSlug}`),
      sql`UPDATE profiles SET failed_attempts = 0, locked_until = null WHERE id = ${signInResult.user.id}`,
    ]);

    return c.json({
      success: true,
      message: 'Login berhasil.',
      session: signInResult.session,
      user:    signInResult.user,
    });
  } catch (err) {
    console.error('[AUTH] login error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

authRoute.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email || typeof email !== 'string' || !email.includes('@'))
      return c.json({ success: false, message: 'Email tidak valid.' }, 400);

    const normalizedEmail = email.trim().toLowerCase();
    const ip              = getIp(c);

    const check = await checkRateLimit(`rl_forgot_${ip}`, 3, 600);
    if (check.blocked)
      return c.json({ success: false, message: 'Terlalu banyak percobaan.' }, 429);

    const [profile] = await sql`
      SELECT id, full_name, is_banned FROM profiles WHERE email = ${normalizedEmail} LIMIT 1
    `;

    if (!profile || profile.is_banned)
      return c.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim.' });

    const token = await createResetToken(normalizedEmail);
    const resetLink = `${process.env.FRONTEND_URL}/reset-kata-sandi?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    sendPasswordResetEmail({
      to:        normalizedEmail,
      fullName:  profile.full_name || 'Pengguna',
      resetLink: resetLink,
      apiKey:    process.env.RESEND_API_KEY!,
    }).catch(console.error);

    return c.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim.' });
  } catch (err) {
    console.error('[AUTH] forgot-password error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

authRoute.get('/verify-email', async (c) => {
  try {
    const token = c.req.query('token');
    const email = c.req.query('email');

    if (!token || !email)
      return c.json({ success: false, message: 'Token tidak valid.' }, 400);

    const [verification] = await sql`
      SELECT * FROM verification
      WHERE identifier = ${email} AND value = ${token}
      AND "expiresAt" > now()
      LIMIT 1
    `;

    if (!verification)
      return c.json({ success: false, message: 'Token kadaluarsa atau tidak valid.' }, 400);

    await sql`UPDATE "user" SET "emailVerified" = true WHERE email = ${email}`;
    await sql`DELETE FROM verification WHERE identifier = ${email}`;

    return c.json({ success: true, message: 'Email berhasil diverifikasi.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

authRoute.post('/reset-password', async (c) => {
  try {
    const { token, email, password } = await c.req.json();

    if (!token || !email || !password)
      return c.json({ success: false, message: 'Data tidak lengkap.' }, 400);

    const [verification] = await sql`
      SELECT * FROM verification
      WHERE identifier = ${'reset:' + email} AND value = ${token}
      AND "expiresAt" > now()
      LIMIT 1
    `;

    if (!verification)
      return c.json({ success: false, message: 'Token kadaluarsa atau tidak valid.' }, 400);

    if (password.length < 8)
      return c.json({ success: false, message: 'Kata sandi minimal 8 karakter.' }, 400);

    await auth.api.resetPassword({
      body: { newPassword: password, token },
    });

    await sql`DELETE FROM verification WHERE identifier = ${'reset:' + email}`;

    return c.json({ success: true, message: 'Kata sandi berhasil direset.' });
  } catch (err) {
    console.error('[AUTH] reset-password error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── GET /api/auth/get-session ─────────────────────────────────────────────────
// Dipakai middleware Next.js untuk validasi session token dari cookie
authRoute.get('/get-session', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token      = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token.length < 20)
    return c.json({ success: false }, 401);

  try {
    const [row] = await sql`
      SELECT
        s."userId",
        s."expiresAt",
        p.role     AS role,
        p.is_banned AS "isBanned"
      FROM session s
      LEFT JOIN profiles p ON p.id = s."userId"
      WHERE s.token = ${token}
      LIMIT 1
    `;

    if (!row || new Date(row.expiresAt) <= new Date())
      return c.json({ success: false }, 401);

    if (row.isBanned)
      return c.json({ success: false, message: 'banned' }, 403);

    return c.json({
      success: true,
      userId:  row.userId,
      role:    row.role ?? 'user',
    });
  } catch (err) {
    console.error('[AUTH] get-session error:', err);
    return c.json({ success: false }, 500);
  }
});

// ── POST /api/auth/google/callback ───────────────────────────────────────────
// Tukar Google auth code → better-auth session
authRoute.post('/google/callback', async (c) => {
  try {
    const { code, redirectUri } = await c.req.json() as { code?: string; redirectUri?: string };

    if (!code || !redirectUri)
      return c.json({ success: false, message: 'Data tidak lengkap.' }, 400);

    // Tukar code → Google tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json() as {
      id_token?: string; access_token?: string; error?: string;
    };

    if (tokenData.error || !tokenData.id_token)
      return c.json({ success: false, message: 'Google OAuth gagal.' }, 400);

    // Ambil user info dari Google
    const userRes  = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userRes.json() as {
      sub: string; email: string; name: string; picture?: string; email_verified?: boolean;
    };

    if (!userInfo.email)
      return c.json({ success: false, message: 'Gagal mendapatkan info akun Google.' }, 400);

    // Upsert user ke better-auth tables
    const [existingUser] = await sql`
      SELECT id FROM "user" WHERE email = ${userInfo.email} LIMIT 1
    `;

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await sql`
        UPDATE "user" SET
          name        = ${userInfo.name},
          image       = ${userInfo.picture ?? null},
          "updatedAt" = now()
        WHERE id = ${userId}
      `;
    } else {
      userId = randomBytes(16).toString('hex');
      await sql`
        INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
        VALUES (${userId}, ${userInfo.name}, ${userInfo.email}, ${userInfo.email_verified ?? true}, ${userInfo.picture ?? null}, now(), now())
      `;
      await sql`
        INSERT INTO profiles (id, email, full_name, role, failed_attempts, is_banned, welcome_sent)
        VALUES (${userId}, ${userInfo.email}, ${userInfo.name}, 'user', 0, false, false)
        ON CONFLICT (id) DO NOTHING
      `.catch(console.error);
    }

    // Cek ban
    const [profile] = await sql`SELECT is_banned, role FROM profiles WHERE id = ${userId} LIMIT 1`;
    if (profile?.is_banned)
      return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan.' }, 403);

    // Upsert account (Google provider)
    const [existingAccount] = await sql`
      SELECT id FROM account WHERE "userId" = ${userId} AND "providerId" = 'google' LIMIT 1
    `;
    if (existingAccount) {
      await sql`
        UPDATE account SET
          "accessToken"  = ${tokenData.access_token ?? null},
          "idToken"      = ${tokenData.id_token},
          "updatedAt"    = now()
        WHERE id = ${existingAccount.id}
      `;
    } else {
      const accountId = randomBytes(16).toString('hex');
      await sql`
        INSERT INTO account (id, "userId", "accountId", "providerId", "accessToken", "idToken", "createdAt", "updatedAt")
        VALUES (${accountId}, ${userId}, ${userInfo.sub}, 'google', ${tokenData.access_token ?? null}, ${tokenData.id_token}, now(), now())
      `;
    }

    // Buat session better-auth
    const sessionToken   = randomBytes(32).toString('hex');
    const sessionId      = randomBytes(16).toString('hex');
    const expiresAt      = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO session (id, "userId", token, "expiresAt", "createdAt", "updatedAt")
      VALUES (${sessionId}, ${userId}, ${sessionToken}, ${expiresAt.toISOString()}, now(), now())
    `;

    return c.json({
      success: true,
      session: { token: sessionToken, expiresAt: expiresAt.toISOString() },
      user:    { id: userId, email: userInfo.email, name: userInfo.name, role: profile?.role ?? 'user' },
    });
  } catch (err) {
    console.error('[AUTH] google/callback error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── POST /api/auth/resend-verification ───────────────────────────────────────
authRoute.post('/resend-verification', async (c) => {
  try {
    const { email } = await c.req.json() as { email?: string };
    if (!email) return c.json({ success: false }, 400);

    const normalizedEmail = email.trim().toLowerCase();
    const ip              = getIp(c);
    const rl              = await checkRateLimit(`rl_resend_${ip}`, 3, 600);
    if (rl.blocked) return c.json({ success: false, message: 'Terlalu banyak percobaan.' }, 429);

    const [user] = await sql`SELECT id, name FROM "user" WHERE email = ${normalizedEmail} LIMIT 1`;
    if (!user) return c.json({ success: true }); // silent

    const token            = await createVerificationToken(normalizedEmail);
    const verificationLink = `${process.env.FRONTEND_URL}/auth/confirm?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    sendVerificationEmail({
      to:               normalizedEmail,
      fullName:         user.name ?? 'Pengguna',
      verificationLink: verificationLink,
      apiKey:           process.env.RESEND_API_KEY!,
    }).catch(console.error);

    return c.json({ success: true });
  } catch (err) {
    console.error('[AUTH] resend-verification error:', err);
    return c.json({ success: false }, 500);
  }
});

export default authRoute;