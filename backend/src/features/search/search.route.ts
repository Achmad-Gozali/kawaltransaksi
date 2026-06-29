import { Hono } from 'hono';
import { getSupabaseAdmin } from '../../core/supabase';
import { verifyTurnstile } from '../../core/turnstile';
import { kv } from '../../core/redis';

const search = new Hono();

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getOptionalUserId(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  try {
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch { return null; }
}

search.use('*', async (c, next) => {
  const ip     = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'anonymous';
  const userId = await getOptionalUserId(c.req.header('Authorization'));
  const isAuth = !!userId;
  const max    = isAuth ? 15 : 5;

  try {
    if (isAuth) {
      const [userHits, ipHits] = await Promise.all([
        kv.get(`search_user_${userId}`).then(v => parseInt(v ?? '0')),
        kv.get(`search_auth_ip_${ip}`).then(v => parseInt(v ?? '0')),
      ]);
      if (userHits >= max) return c.json({ success: false, message: 'Batas pencarian tercapai (15/menit).' }, 429);
      if (ipHits >= max) return c.json({ success: false, message: 'Terlalu banyak permintaan.' }, 429);
      await Promise.all([
        kv.put(`search_user_${userId}`, (userHits + 1).toString(), { expirationTtl: 60 }),
        kv.put(`search_auth_ip_${ip}`, (ipHits + 1).toString(), { expirationTtl: 60 }),
      ]);
    } else {
      const ipHits = parseInt(await kv.get(`search_anon_ip_${ip}`) ?? '0');
      if (ipHits >= max) return c.json({ success: false, message: 'Batas pencarian tercapai (5/menit).' }, 429);
      await kv.put(`search_anon_ip_${ip}`, (ipHits + 1).toString(), { expirationTtl: 60 });
    }
  } catch (err) {
    console.error('[SEARCH RATE LIMIT] Error:', err);
  }

  return next();
});

search.post('/verify-turnstile', async (c) => {
  try {
    const env   = process.env;
    const { token } = await c.req.json();
    if (!token || typeof token !== 'string' || !token.trim())
      return c.json({ success: false, message: 'Token tidak ditemukan.' }, 400);

    const blacklistKey = `turnstile_used_${await hashToken(token)}`;
    if (await kv.get(blacklistKey))
      return c.json({ success: false, message: 'Token verifikasi sudah digunakan.' }, 400);

    if (!await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY!))
      return c.json({ success: false, message: 'Verifikasi keamanan gagal.' }, 400);

    await kv.put(blacklistKey, '1', { expirationTtl: 300 });
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default search;