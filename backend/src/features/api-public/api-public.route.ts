import { Hono } from 'hono';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sendApiAnomalyEmail } from '../../core/resend';
import type { Env } from '../../types';

const apiPublic = new Hono<{ Bindings: Env }>();

// ── Singleton Supabase client per request context ─────────────────────────────
let _supabase: SupabaseClient | null = null;
let _supabaseEnv: string | null = null;

function getSupabase(env: Env): SupabaseClient {
  if (!_supabase || _supabaseEnv !== env.SUPABASE_URL) {
    _supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    _supabaseEnv = env.SUPABASE_URL;
  }
  return _supabase;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isValidKeyFormat(key: string): boolean {
  return /^kt_(live|test)_[A-Za-z0-9]{40}$/.test(key);
}

// ── Cache hasil check nomor di KV (TTL 5 menit) ───────────────────────────────
async function getCachedCheckResult(
  limiter: KVNamespace,
  number: string,
  type: string
): Promise<any | null> {
  try {
    const cacheKey = `check_cache_${type}_${number}`;
    const cached   = await limiter.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function setCachedCheckResult(
  limiter: KVNamespace,
  number: string,
  type: string,
  result: any
): Promise<void> {
  try {
    const cacheKey = `check_cache_${type}_${number}`;
    await limiter.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 }); // 5 menit
  } catch (err) {
    console.error('[CACHE] Error set cache:', err);
  }
}

// ── Rate limit per IP ─────────────────────────────────────────────────────────
async function checkIpRateLimit(
  limiter: KVNamespace,
  ip: string
): Promise<{ allowed: boolean }> {
  const key     = `rl_api_v1_${ip}`;
  const current = await limiter.get(key);
  const count   = current ? parseInt(current) : 0;
  if (count >= 60) return { allowed: false };
  await limiter.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return { allowed: true };
}

// ── Log failed auth attempt + auto-blacklist ──────────────────────────────────
async function logFailedAttempt(
  limiter: KVNamespace,
  ip: string,
  reason: string
): Promise<void> {
  try {
    const failKey  = `api_fail_${ip}`;
    const current  = await limiter.get(failKey);
    const count    = current ? parseInt(current) : 0;
    const newCount = count + 1;
    await limiter.put(failKey, newCount.toString(), { expirationTtl: 300 });
    if (newCount >= 10) {
      const blacklistKey = `blacklist_${ip}`;
      const existing     = await limiter.get(blacklistKey);
      if (!existing) {
        await limiter.put(blacklistKey, JSON.stringify({
          ip,
          reason: `Auto-blacklist: ${newCount}x failed API auth (${reason})`,
          auto: true,
          created_at: new Date().toISOString(),
        }), { expirationTtl: 86400 });
        console.warn(`[API] Auto-blacklisted IP ${ip} after ${newCount} failed attempts`);
      }
    }
  } catch (err) {
    console.error('[API] Error logging failed attempt:', err);
  }
}

// ── Request deduplication via Idempotency-Key ─────────────────────────────────
async function checkDeduplication(
  limiter: KVNamespace,
  idempotencyKey: string,
  apiKeyId: string
): Promise<{ isDuplicate: boolean; cachedResponse?: any }> {
  try {
    const cacheKey = `idem_${apiKeyId}_${idempotencyKey}`;
    const cached   = await limiter.get(cacheKey);
    if (cached) return { isDuplicate: true, cachedResponse: JSON.parse(cached) };
    return { isDuplicate: false };
  } catch {
    return { isDuplicate: false };
  }
}

async function cacheIdempotentResponse(
  limiter: KVNamespace,
  idempotencyKey: string,
  apiKeyId: string,
  response: any
): Promise<void> {
  try {
    const cacheKey = `idem_${apiKeyId}_${idempotencyKey}`;
    await limiter.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });
  } catch (err) {
    console.error('[IDEM] Error caching response:', err);
  }
}

// ── Anomaly detection ─────────────────────────────────────────────────────────
async function checkAnomaly(
  limiter: KVNamespace,
  keyId: string,
  env: Env,
  userEmail: string | null
): Promise<void> {
  try {
    const now      = new Date();
    const hourSlot = now.toISOString().slice(0, 13);
    const countKey = `anomaly_count_${keyId}_${hourSlot}`;

    const current  = await limiter.get(countKey);
    const count    = current ? parseInt(current) : 0;
    const newCount = count + 1;
    await limiter.put(countKey, newCount.toString(), { expirationTtl: 3600 });

    if (newCount % 10 !== 0) return;

    const slots: number[] = [];
    for (let i = 1; i <= 168; i++) {
      const pastHour = new Date(now.getTime() - i * 3600000);
      const slot     = pastHour.toISOString().slice(0, 13);
      const val      = await limiter.get(`anomaly_count_${keyId}_${slot}`);
      if (val) slots.push(parseInt(val));
    }

    if (slots.length < 24) return;

    const avg     = slots.reduce((a, b) => a + b, 0) / slots.length;
    const trigger = avg * 3;

    if (newCount >= trigger && trigger > 0) {
      const alertKey = `anomaly_alerted_${keyId}_${hourSlot}`;
      const alerted  = await limiter.get(alertKey);
      if (alerted) return;

      await limiter.put(alertKey, '1', { expirationTtl: 3600 });
      await limiter.put(`anomaly_flag_${keyId}`, JSON.stringify({
        key_id: keyId, hour: hourSlot, count: newCount,
        avg_per_hour: Math.round(avg), multiplier: Math.round(newCount / avg),
        flagged_at: now.toISOString(),
      }), { expirationTtl: 86400 });

      if (userEmail && env.RESEND_API_KEY) {
        sendApiAnomalyEmail({
          to: userEmail, keyId,
          requestsThisHour: newCount,
          avgPerHour: Math.round(avg),
          multiplier: Math.round(newCount / avg),
          apiKey: env.RESEND_API_KEY,
        }).catch(err => console.error('[ANOMALY EMAIL] Error:', err));
      }
    }
  } catch (err) {
    console.error('[ANOMALY] Error:', err);
  }
}

// ── Validasi API key ──────────────────────────────────────────────────────────
async function validateApiKey(
  key: string,
  ip: string,
  env: Env
): Promise<{ valid: boolean; keyData?: any; message?: string; statusCode?: number }> {

  if (!key || typeof key !== 'string' || key.trim() === '') {
    return { valid: false, message: 'API key tidak ditemukan.', statusCode: 401 };
  }

  if (!isValidKeyFormat(key.trim())) {
    if (env.LIMITER) await logFailedAttempt(env.LIMITER, ip, 'invalid_format');
    return { valid: false, message: 'API key tidak valid.', statusCode: 401 };
  }

  const supabase = getSupabase(env);
  const keyHash  = await hashKey(key.trim());

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, name, environment, requests_today, requests_total, daily_limit, last_reset_at, is_active, expires_at, failed_attempts')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) {
    if (env.LIMITER) await logFailedAttempt(env.LIMITER, ip, 'key_not_found');
    return { valid: false, message: 'API key tidak valid.', statusCode: 401 };
  }

  if (!data.is_active) {
    if (env.LIMITER) await logFailedAttempt(env.LIMITER, ip, 'key_inactive');
    return { valid: false, message: 'API key tidak aktif.', statusCode: 401 };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, message: 'API key sudah kadaluarsa.', statusCode: 429 };
  }

  const today     = new Date().toISOString().slice(0, 10);
  const lastReset = data.last_reset_at ? String(data.last_reset_at).slice(0, 10) : null;

  if (lastReset !== today) {
    await supabase.from('api_keys').update({ requests_today: 0, last_reset_at: today }).eq('id', data.id);
    data.requests_today = 0;
  }

  if (data.requests_today >= data.daily_limit) {
    return {
      valid: false,
      message: `Batas harian tercapai (${data.daily_limit} request/hari). Reset besok.`,
      statusCode: 429,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', data.user_id)
    .single();

  return { valid: true, keyData: { ...data, userEmail: profile?.email ?? null } };
}

async function incrementUsage(keyId: string, env: Env): Promise<void> {
  const supabase = getSupabase(env);
  await supabase.rpc('increment_api_usage', { key_id: keyId });
}

// ── GET /api/v1/check ─────────────────────────────────────────────────────────
apiPublic.get('/check', async (c) => {
  try {
    const ip             = c.req.header('CF-Connecting-IP') || 'anonymous';
    const apiKey         = (c.req.header('X-API-Key') || c.req.query('api_key') || '').trim();
    const idempotencyKey = c.req.header('Idempotency-Key') || null;

    // 1. Rate limit per IP
    if (c.env.LIMITER && ip !== 'anonymous') {
      const { allowed } = await checkIpRateLimit(c.env.LIMITER, ip);
      if (!allowed) {
        return c.json({ success: false, message: 'Terlalu banyak request dari IP Anda. Coba lagi dalam 1 menit.' }, 429);
      }
    }

    // 2. Validasi key
    const { valid, keyData, message, statusCode } = await validateApiKey(apiKey, ip, c.env);
    if (!valid) {
      return c.json({ success: false, message }, (statusCode ?? 401) as 400 | 401 | 429 | 500);
    }

    // 3. Deduplication
    if (idempotencyKey && c.env.LIMITER) {
      const { isDuplicate, cachedResponse } = await checkDeduplication(c.env.LIMITER, idempotencyKey, keyData.id);
      if (isDuplicate && cachedResponse) {
        return c.json({ ...cachedResponse, meta: { ...cachedResponse.meta, idempotent: true } });
      }
    }

    // 4. Validasi parameter
    const number = c.req.query('number')?.replace(/\D/g, '') || '';
    const type   = c.req.query('type') || 'phone';
    const bank   = c.req.query('bank') || null;

    if (!number || number.length < 5 || number.length > 32) {
      return c.json({ success: false, message: 'Parameter number tidak valid.' }, 400);
    }

    const validTypes = ['phone', 'bank_account', 'ewallet'];
    if (!validTypes.includes(type)) {
      return c.json({ success: false, message: 'Parameter type tidak valid. Gunakan: phone, bank_account, ewallet.' }, 400);
    }

    // 5. Cek cache dulu sebelum query DB
    let checkData: any = null;
    if (c.env.LIMITER) {
      checkData = await getCachedCheckResult(c.env.LIMITER, number, type);
    }

    if (!checkData) {
      const supabase = getSupabase(c.env);
      const { data: reports } = await supabase
        .from('reports')
        .select('status, loss_amount, category, created_at, bank_name, target_type')
        .eq('target_number', number)
        .neq('status', 'withdrawn')
        .order('created_at', { ascending: false });

      const allReports      = reports ?? [];
      const verifiedReports = allReports.filter(r => r.status === 'verified');
      const pendingReports  = allReports.filter(r => r.status === 'pending');
      const totalLoss       = allReports.reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0);
      const lastReported    = allReports[0]?.created_at ?? null;

      let status: 'safe' | 'warning' | 'danger' = 'safe';
      if (verifiedReports.length > 0) status = 'danger';
      else if (pendingReports.length > 0) status = 'warning';

      checkData = {
        number, type, bank: bank ?? null, status,
        verified_reports:  verifiedReports.length,
        pending_reports:   pendingReports.length,
        total_reports:     allReports.length,
        total_loss:        totalLoss,
        last_reported:     lastReported,
        check_url:         `https://kawaltransaksi.com/check/${number}`,
      };

      if (c.env.LIMITER) {
        c.executionCtx.waitUntil(setCachedCheckResult(c.env.LIMITER, number, type, checkData));
      }
    }

    const responseBody = {
      success: true,
      data: checkData,
      meta: {
        environment:        keyData.environment ?? 'live',
        requests_today:     keyData.requests_today + 1,
        daily_limit:        keyData.daily_limit,
        requests_remaining: keyData.daily_limit - keyData.requests_today - 1,
        expires_at:         keyData.expires_at ?? null,
      },
    };

    // 6. Increment usage + anomaly check + cache idempotency (non-blocking)
    c.executionCtx.waitUntil(Promise.all([
      incrementUsage(keyData.id, c.env),
      c.env.LIMITER
        ? checkAnomaly(c.env.LIMITER, keyData.id, c.env, keyData.userEmail)
        : Promise.resolve(),
      idempotencyKey && c.env.LIMITER
        ? cacheIdempotentResponse(c.env.LIMITER, idempotencyKey, keyData.id, responseBody)
        : Promise.resolve(),
    ]));

    return c.json(responseBody);
  } catch (err) {
    console.error('[API PUBLIC] Error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default apiPublic;