import { createMiddleware } from 'hono/factory';
import { getSupabaseAdmin } from './supabase';
import type { Env } from '../types';

// Cache token valid selama 2 menit untuk mengurangi DB round-trip
const TOKEN_CACHE_TTL = 120;
// Setelah 5x token invalid dari IP yang sama dalam 10 menit, log sebagai suspicious
const SUSPICIOUS_THRESHOLD = 5;
const SUSPICIOUS_TTL = 600;

export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Token tidak ditemukan.' }, 401);
  }

  const token = authHeader.split(' ')[1];

  // Validasi panjang token sebelum menyentuh DB
  // JWT Supabase minimal ~100 karakter, maksimal ~500
  if (!token || token.length < 100 || token.length > 2048) {
    return c.json({ success: false, message: 'Token tidak valid.' }, 401);
  }

  const ip = c.req.header('CF-Connecting-IP') || 'anonymous';

  // Cek cache token valid di KV sebelum query Supabase
  if (c.env.LIMITER) {
    // Pakai 16 karakter pertama token sebagai cache key (cukup untuk identifikasi)
    const tokenPrefix = token.slice(0, 16).replace(/[^a-zA-Z0-9]/g, '');
    const cacheKey = `auth_token_${tokenPrefix}`;
    const cached = await c.env.LIMITER.get(cacheKey);

    if (cached) {
      try {
        const { userId, userEmail, userRole, isBanned } = JSON.parse(cached);
        if (isBanned) {
          return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }, 403);
        }
        c.set('userId', userId);
        c.set('userEmail', userEmail);
        c.set('userRole', userRole);
        await next();
        return;
      } catch {
        // Cache corrupt, lanjut ke DB
      }
    }
  }

  const supabase = getSupabaseAdmin(c.env);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    // Catat token invalid dari IP ini untuk deteksi brute force
    if (c.env.LIMITER && ip !== 'anonymous') {
      try {
        const failKey = `auth_fail_${ip}`;
        const failCount = parseInt(await c.env.LIMITER.get(failKey) ?? '0') + 1;
        await c.env.LIMITER.put(failKey, failCount.toString(), { expirationTtl: SUSPICIOUS_TTL });
        if (failCount >= SUSPICIOUS_THRESHOLD) {
          await c.env.LIMITER.put(`suspicious_${ip}`, JSON.stringify({
            ip,
            reason: `${failCount}x token invalid dalam 10 menit`,
            created_at: new Date().toISOString(),
          }), { expirationTtl: SUSPICIOUS_TTL });
        }
      } catch (err) {
        console.error('[AUTH] Error logging fail:', err);
      }
    }
    return c.json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa.' }, 401);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, role')
    .eq('id', user.id)
    .single();

  if (profile?.is_banned) {
    return c.json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }, 403);
  }

  const userId = user.id;
  const userEmail = user.email ?? '';
  const userRole = profile?.role ?? 'user';

  // Cache token valid di KV
  if (c.env.LIMITER) {
    try {
      const tokenPrefix = token.slice(0, 16).replace(/[^a-zA-Z0-9]/g, '');
      await c.env.LIMITER.put(`auth_token_${tokenPrefix}`, JSON.stringify({
        userId,
        userEmail,
        userRole,
        isBanned: false,
      }), { expirationTtl: TOKEN_CACHE_TTL });
    } catch (err) {
      console.error('[AUTH] Error caching token:', err);
    }
  }

  c.set('userId', userId);
  c.set('userEmail', userEmail);
  c.set('userRole', userRole);
  await next();
});