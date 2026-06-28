import { Hono } from 'hono';
import { getSupabaseAdmin } from '../../core/supabase';
import { verifyTurnstile } from '../../core/turnstile';
import type { Env } from '../../types';

const search = new Hono<{ Bindings: Env }>();

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getOptionalUserId(authHeader: string | undefined, env: Env): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  try {
    const { data: { user }, error } = await getSupabaseAdmin(env).auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch { return null; }
}

// KV tidak atomic — lihat komentar di bawah untuk trade-off
search.use('*', async (c, next) => {
  if (!(c.get('env') as any).LIMITER) {
    console.warn('[SEARCH RATE LIMIT] KV LIMITER tidak tersedia.');
    return next();
  }

  const ip      = c.req.header('CF-Connecting-IP') || 'anonymous';
  const userId  = await getOptionalUserId(c.req.header('Authorization'), c.env);
  const isAuth  = !!userId;
  const max     = isAuth ? 15 : 5;

  try {
    if (isAuth) {
      // Promise.all — dari 2 sequential read jadi paralel
      const [userHits, ipHits] = await Promise.all([
        (c.get('env') as any).LIMITER.get(`search_user_${userId}`).then(v => parseInt(v ?? '0')),
        (c.get('env') as any).LIMITER.get(`search_auth_ip_${ip}`).then(v => parseInt(v ?? '0')),
      ]);

      if (userHits >= max)
        return c.json({ success: false, message: 'Batas pencarian tercapai (15/menit). Tunggu sebentar lalu coba lagi.' }, 429);
      if (ipHits >= max)
        return c.json({ success: false, message: 'Terlalu banyak permintaan dari perangkat ini. Tunggu sebentar lalu coba lagi.' }, 429);

      await Promise.all([
        (c.get('env') as any).LIMITER.put(`search_user_${userId}`, (userHits + 1).toString(), { expirationTtl: 60 }),
        (c.get('env') as any).LIMITER.put(`search_auth_ip_${ip}`,  (ipHits  + 1).toString(), { expirationTtl: 60 }),
      ]);
    } else {
      const ipHits = parseInt(await (c.get('env') as any).LIMITER.get(`search_anon_ip_${ip}`) ?? '0');
      if (ipHits >= max)
        return c.json({ success: false, message: 'Batas pencarian tercapai (5/menit). Login untuk kuota lebih banyak.' }, 429);
      await (c.get('env') as any).LIMITER.put(`search_anon_ip_${ip}`, (ipHits + 1).toString(), { expirationTtl: 60 });
    }
  } catch (err) {
    console.error('[SEARCH RATE LIMIT] Error:', err);
  }

  return next();
});

search.post('/verify-turnstile', async (c) => {
  try {
    const { token } = await c.req.json();
    if (!token || typeof token !== 'string' || !token.trim())
      return c.json({ success: false, message: 'Token tidak ditemukan.' }, 400);

    if ((c.get('env') as any).LIMITER) {
      try {
        const blacklistKey = `turnstile_used_${await hashToken(token)}`;
        if (await (c.get('env') as any).LIMITER.get(blacklistKey))
          return c.json({ success: false, message: 'Token verifikasi sudah digunakan. Muat ulang halaman.' }, 400);
      } catch (err) { console.error('[TURNSTILE] Error cek KV:', err); }
    }

    if (!await verifyTurnstile(token, (c.get('env') as any).TURNSTILE_SECRET_KEY))
      return c.json({ success: false, message: 'Verifikasi keamanan gagal.' }, 400);

    if ((c.get('env') as any).LIMITER) {
      try {
        await (c.get('env') as any).LIMITER.put(`turnstile_used_${await hashToken(token)}`, '1', { expirationTtl: 300 });
      } catch (err) { console.error('[TURNSTILE] Error set KV:', err); }
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('[SEARCH ERROR]:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default search;