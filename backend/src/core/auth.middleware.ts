import { createMiddleware } from 'hono/factory';
import { getSupabaseAdmin } from './supabase';
import { kv } from './redis';

const TOKEN_CACHE_TTL      = 120;
const SUSPICIOUS_THRESHOLD = 5;
const SUSPICIOUS_TTL       = 600;

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const authMiddleware = createMiddleware<{
  Variables: { userId: string; userEmail: string; userRole: string };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer '))
    return c.json({ success: false, message: 'Token tidak ditemukan.' }, 401);

  const token = authHeader.split(' ')[1];
  if (!token || token.length < 20 || token.length > 2048)
    return c.json({ success: false, message: 'Token tidak valid.' }, 401);

  const ip        = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'anonymous';
  const tokenHash = await hashToken(token);
  const cacheKey  = `auth_token_${tokenHash}`;

  const cached = await kv.get(cacheKey);
  if (cached) {
    try {
      const { userId, userEmail, userRole, isBanned } = JSON.parse(cached);
      if (isBanned)
        return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan.' }, 403);
      c.set('userId', userId);
      c.set('userEmail', userEmail);
      c.set('userRole', userRole);
      await next();
      return;
    } catch {}
  }

  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    if (ip !== 'anonymous') {
      try {
        const failKey   = `auth_fail_${ip}`;
        const failCount = parseInt(await kv.get(failKey) ?? '0') + 1;
        await kv.put(failKey, failCount.toString(), { expirationTtl: SUSPICIOUS_TTL });
        if (failCount >= SUSPICIOUS_THRESHOLD) {
          await kv.put(`blacklist_${ip}`, JSON.stringify({
            ip, reason: `${failCount}x token invalid`, auto: true,
            created_at: new Date().toISOString(),
          }), { expirationTtl: 86400 });
        }
      } catch (err) {
        console.error('[AUTH] Error:', err);
      }
    }
    return c.json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa.' }, 401);
  }

  const { data: profile } = await supabase
    .from('profiles').select('is_banned, role').eq('id', user.id).single();

  if (profile?.is_banned)
    return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan.' }, 403);

  const userId    = user.id;
  const userEmail = user.email ?? '';
  const userRole  = profile?.role ?? 'user';

  try {
    await kv.put(cacheKey, JSON.stringify({
      userId, userEmail, userRole, isBanned: false,
    }), { expirationTtl: TOKEN_CACHE_TTL });
  } catch (err) {
    console.error('[AUTH] Cache error:', err);
  }

  c.set('userId', userId);
  c.set('userEmail', userEmail);
  c.set('userRole', userRole);
  await next();
});