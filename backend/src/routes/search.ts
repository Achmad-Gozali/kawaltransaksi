import { Hono } from 'hono';
import { getSupabaseAdmin } from '../lib/supabase';
import { verifyTurnstile } from '../lib/turnstile';
import { validatePhone } from '../lib/abstract';
import type { Env } from '../types';

const search = new Hono<{ Bindings: Env }>();

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getOptionalUserId(
  authHeader: string | undefined,
  env: Env,
): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  try {
    const supabase = getSupabaseAdmin(env);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

search.use('*', async (c, next) => {
  if (!c.env.LIMITER) {
    console.warn('[SEARCH RATE LIMIT] KV LIMITER tidak tersedia. Rate limiting dinonaktifkan.');
    return next();
  }

  const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
  const userId = await getOptionalUserId(c.req.header('Authorization'), c.env);
  const isLoggedIn = !!userId;
  const maxRequests = isLoggedIn ? 15 : 5;

  try {
    if (isLoggedIn) {
      const userKey = `search_user_${userId}`;
      const userCount = await c.env.LIMITER.get(userKey);
      const userHits = userCount ? parseInt(userCount) : 0;

      if (userHits >= maxRequests) {
        return c.json({
          success: false,
          message: 'Batas pencarian tercapai (15/menit). Tunggu sebentar lalu coba lagi.',
        }, 429);
      }

      const ipKey = `search_auth_ip_${ip}`;
      const ipCount = await c.env.LIMITER.get(ipKey);
      const ipHits = ipCount ? parseInt(ipCount) : 0;

      if (ipHits >= maxRequests) {
        return c.json({
          success: false,
          message: 'Terlalu banyak permintaan dari perangkat ini. Tunggu sebentar lalu coba lagi.',
        }, 429);
      }

      await Promise.all([
        c.env.LIMITER.put(userKey, (userHits + 1).toString(), { expirationTtl: 60 }),
        c.env.LIMITER.put(ipKey, (ipHits + 1).toString(), { expirationTtl: 60 }),
      ]);
    } else {
      const ipKey = `search_anon_ip_${ip}`;
      const ipCount = await c.env.LIMITER.get(ipKey);
      const ipHits = ipCount ? parseInt(ipCount) : 0;

      if (ipHits >= maxRequests) {
        return c.json({
          success: false,
          message: 'Batas pencarian tercapai (5/menit). Login untuk mendapatkan kuota lebih banyak, atau tunggu sebentar.',
        }, 429);
      }

      await c.env.LIMITER.put(ipKey, (ipHits + 1).toString(), { expirationTtl: 60 });
    }
  } catch (err) {
    console.error('[SEARCH RATE LIMIT] Error mengakses KV:', err);
  }

  return next();
});

search.post('/verify-turnstile', async (c) => {
  try {
    const { token } = await c.req.json();

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return c.json({ success: false, message: 'Token tidak ditemukan.' }, 400);
    }

    if (c.env.LIMITER) {
      try {
        const hashed = await hashToken(token);
        const blacklistKey = `turnstile_used_${hashed}`;
        const alreadyUsed = await c.env.LIMITER.get(blacklistKey);
        if (alreadyUsed) {
          return c.json({
            success: false,
            message: 'Token verifikasi sudah digunakan. Muat ulang halaman.',
          }, 400);
        }
      } catch (err) {
        console.error('[TURNSTILE BLACKLIST] Error cek KV:', err);
      }
    }

    const isValid = await verifyTurnstile(token, c.env.TURNSTILE_SECRET_KEY);
    if (!isValid) {
      return c.json({ success: false, message: 'Verifikasi keamanan gagal.' }, 400);
    }

    if (c.env.LIMITER) {
      try {
        const hashed = await hashToken(token);
        const blacklistKey = `turnstile_used_${hashed}`;
        await c.env.LIMITER.put(blacklistKey, '1', { expirationTtl: 300 });
      } catch (err) {
        console.error('[TURNSTILE BLACKLIST] Error set KV:', err);
      }
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('[SEARCH ROUTE ERROR]:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── Phone Info Endpoint (Abstract API + KV Cache) ──────────────────────────
search.post('/phone-info', async (c) => {
  try {
    const { phone } = await c.req.json();

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return c.json({ success: false, message: 'Nomor HP tidak boleh kosong.' }, 400);
    }

    // Bersihkan & format nomor: 08xx → 628xx, +628xx → 628xx
    const cleaned = phone.replace(/\D/g, '');
    const formatted = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned;

    // Cek cache di KV dulu
    const cacheKey = `phone_info_${formatted}`;
    if (c.env.LIMITER) {
      try {
        const cached = await c.env.LIMITER.get(cacheKey);
        if (cached) {
          return c.json({ success: true, data: JSON.parse(cached), fromCache: true });
        }
      } catch (err) {
        console.error('[PHONE INFO] Error baca KV cache:', err);
      }
    }

    // Tidak ada cache → panggil Abstract API
    const result = await validatePhone(formatted, c.env.ABSTRACT_API_KEY);

    if (!result || !result.valid) {
      return c.json({
        success: false,
        message: 'Nomor tidak valid atau tidak dapat diverifikasi.',
      }, 404);
    }

    const data = {
      valid: result.valid,
      carrier: result.carrier || null,
      type: result.type || null,
      location: result.location || null,
      format: result.format?.international || null,
    };

    // Simpan ke KV cache — TTL 30 hari (2_592_000 detik)
    if (c.env.LIMITER) {
      try {
        await c.env.LIMITER.put(cacheKey, JSON.stringify(data), { expirationTtl: 2_592_000 });
      } catch (err) {
        console.error('[PHONE INFO] Error simpan KV cache:', err);
      }
    }

    return c.json({ success: true, data, fromCache: false });
  } catch (err) {
    console.error('[PHONE INFO ERROR]:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default search;