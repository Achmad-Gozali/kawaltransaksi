import { Hono } from 'hono';
import { getSupabaseAdmin } from '../../core/supabase';
import { sendApiAnomalyEmail } from '../../core/resend';
import type { Env } from '../../types';

const apiPublic = new Hono<{ Bindings: Env }>();

// -- Helpers -------------------------------------------------------------------

async function hashKey(key: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const isValidKeyFormat = (key: string) => /^kt_(live|test)_[A-Za-z0-9]{40}$/.test(key);

async function kvGet<T>(limiter: KVNamespace, key: string): Promise<T | null> {
  try { const v = await limiter.get(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}

async function kvSet(limiter: KVNamespace, key: string, value: unknown, ttl: number): Promise<void> {
  try { await limiter.put(key, JSON.stringify(value), { expirationTtl: ttl }); }
  catch (err) { console.error('[KV] Error set:', err); }
}

// -- Rate limit per IP (60 req/menit) -----------------------------------------

async function checkIpRateLimit(limiter: KVNamespace, ip: string): Promise<boolean> {
  const key   = `rl_api_v1_${ip}`;
  const count = parseInt(await limiter.get(key) ?? '0');
  if (count >= 60) return false;
  await limiter.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return true;
}

// -- Log failed auth + auto-blacklist ------------------------------------------

async function logFailedAttempt(limiter: KVNamespace, ip: string, reason: string): Promise<void> {
  try {
    const key      = `api_fail_${ip}`;
    const newCount = parseInt(await limiter.get(key) ?? '0') + 1;
    await limiter.put(key, newCount.toString(), { expirationTtl: 300 });
    if (newCount >= 10 && !await limiter.get(`blacklist_${ip}`)) {
      await limiter.put(`blacklist_${ip}`, JSON.stringify({
        ip, reason: `Auto-blacklist: ${newCount}x failed API auth (${reason})`,
        auto: true, created_at: new Date().toISOString(),
      }), { expirationTtl: 86400 });
    }
  } catch (err) { console.error('[API] Error logging failed attempt:', err); }
}

// -- Validasi API key ----------------------------------------------------------

async function validateApiKey(
  key: string, ip: string, env: Env
): Promise<{ valid: boolean; keyData?: any; message?: string; statusCode?: number }> {
  if (!key?.trim())           return { valid: false, message: 'API key tidak ditemukan.', statusCode: 401 };
  if (!isValidKeyFormat(key)) {
    if (env.LIMITER) await logFailedAttempt(env.LIMITER, ip, 'invalid_format');
    return { valid: false, message: 'API key tidak valid.', statusCode: 401 };
  }

  const supabase = getSupabaseAdmin(env);
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, name, environment, requests_today, requests_total, daily_limit, last_reset_at, is_active, expires_at, failed_attempts')
    .eq('key_hash', await hashKey(key.trim()))
    .single();

  if (error || !data) {
    if (env.LIMITER) await logFailedAttempt(env.LIMITER, ip, 'key_not_found');
    return { valid: false, message: 'API key tidak valid.', statusCode: 401 };
  }
  if (!data.is_active) {
    if (env.LIMITER) await logFailedAttempt(env.LIMITER, ip, 'key_inactive');
    return { valid: false, message: 'API key tidak aktif.', statusCode: 401 };
  }
  if (data.expires_at && new Date(data.expires_at) < new Date())
    return { valid: false, message: 'API key sudah kadaluarsa.', statusCode: 429 };

  const today = new Date().toISOString().slice(0, 10);
  if (String(data.last_reset_at).slice(0, 10) !== today) {
    await supabase.from('api_keys').update({ requests_today: 0, last_reset_at: today }).eq('id', data.id);
    data.requests_today = 0;
  }

  if (data.requests_today >= data.daily_limit)
    return { valid: false, message: `Batas harian tercapai (${data.daily_limit} request/hari). Reset besok.`, statusCode: 429 };

  const { data: profile } = await supabase.from('profiles').select('email').eq('id', data.user_id).single();
  return { valid: true, keyData: { ...data, userEmail: profile?.email ?? null } };
}

// -- Anomaly detection ---------------------------------------------------------

async function checkAnomaly(limiter: KVNamespace, keyId: string, env: Env, userEmail: string | null): Promise<void> {
  try {
    const now      = new Date();
    const hourSlot = now.toISOString().slice(0, 13);
    const countKey = `anomaly_count_${keyId}_${hourSlot}`;
    const newCount = parseInt(await limiter.get(countKey) ?? '0') + 1;
    await limiter.put(countKey, newCount.toString(), { expirationTtl: 3600 });

    if (newCount % 10 !== 0) return;

    const slots: number[] = [];
    for (let i = 1; i <= 168; i++) {
      const slot = new Date(now.getTime() - i * 3600000).toISOString().slice(0, 13);
      const val  = await limiter.get(`anomaly_count_${keyId}_${slot}`);
      if (val) slots.push(parseInt(val));
    }
    if (slots.length < 24) return;

    const avg     = slots.reduce((a, b) => a + b, 0) / slots.length;
    const trigger = avg * 3;
    if (newCount < trigger || trigger <= 0) return;

    const alertKey = `anomaly_alerted_${keyId}_${hourSlot}`;
    if (await limiter.get(alertKey)) return;

    await limiter.put(alertKey, '1', { expirationTtl: 3600 });
    await kvSet(limiter, `anomaly_flag_${keyId}`, {
      key_id: keyId, hour: hourSlot, count: newCount,
      avg_per_hour: Math.round(avg), multiplier: Math.round(newCount / avg),
      flagged_at: now.toISOString(),
    }, 86400);

    if (userEmail && env.RESEND_API_KEY) {
      sendApiAnomalyEmail({
        to: userEmail, keyId, requestsThisHour: newCount,
        avgPerHour: Math.round(avg), multiplier: Math.round(newCount / avg),
        apiKey: env.RESEND_API_KEY,
      }).catch(err => console.error('[ANOMALY EMAIL]:', err));
    }
  } catch (err) { console.error('[ANOMALY]:', err); }
}

// -- GET /api/v1/check ---------------------------------------------------------

apiPublic.get('/check', async (c) => {
  try {
    const ip             = c.req.header('CF-Connecting-IP') || 'anonymous';
    const apiKey         = (c.req.header('X-API-Key') || c.req.query('api_key') || '').trim();
    const idempotencyKey = c.req.header('Idempotency-Key') || null;

    // 1. Rate limit per IP
    if (c.env.LIMITER && ip !== 'anonymous') {
      if (!await checkIpRateLimit(c.env.LIMITER, ip))
        return c.json({ success: false, message: 'Terlalu banyak request dari IP Anda. Coba lagi dalam 1 menit.' }, 429);
    }

    // 2. Validasi key
    const { valid, keyData, message, statusCode } = await validateApiKey(apiKey, ip, c.env);
    if (!valid) return c.json({ success: false, message }, (statusCode ?? 401) as 401 | 429);

    // 3. Deduplication
    if (idempotencyKey && c.env.LIMITER) {
      const cached = await kvGet<any>(c.env.LIMITER, `idem_${keyData.id}_${idempotencyKey}`);
      if (cached) return c.json({ ...cached, meta: { ...cached.meta, idempotent: true } });
    }

    // 4. Validasi parameter
    const number = c.req.query('number')?.replace(/\D/g, '') || '';
    const type   = c.req.query('type') || 'phone';
    const bank   = c.req.query('bank') || null;

    if (!number || number.length < 5 || number.length > 32)
      return c.json({ success: false, message: 'Parameter number tidak valid.' }, 400);
    if (!['phone', 'bank_account', 'ewallet'].includes(type))
      return c.json({ success: false, message: 'Parameter type tidak valid. Gunakan: phone, bank_account, ewallet.' }, 400);

    // 5. Cek cache
    const cacheKey  = `check_cache_${type}_${number}`;
    let checkData   = c.env.LIMITER ? await kvGet<any>(c.env.LIMITER, cacheKey) : null;

    if (!checkData) {
      const { data: reports } = await getSupabaseAdmin(c.env)
        .from('reports')
        .select('status, loss_amount, category, created_at, bank_name, target_type')
        .eq('target_number', number)
        .neq('status', 'withdrawn')
        .order('created_at', { ascending: false });

      const all      = reports ?? [];
      const verified = all.filter(r => r.status === 'verified');
      const pending  = all.filter(r => r.status === 'pending');

      checkData = {
        number, type, bank,
        status: verified.length > 0 ? 'danger' : pending.length > 0 ? 'warning' : 'safe',
        verified_reports: verified.length,
        pending_reports:  pending.length,
        total_reports:    all.length,
        total_loss:       all.reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0),
        last_reported:    all[0]?.created_at ?? null,
        check_url:        `https://kawaltransaksi.com/check/${number}`,
      };

      if (c.env.LIMITER)
        c.executionCtx.waitUntil(kvSet(c.env.LIMITER, cacheKey, checkData, 300));
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

    // 6. Increment + anomaly + idempotency cache (non-blocking)
    c.executionCtx.waitUntil(Promise.all([
      getSupabaseAdmin(c.env).rpc('increment_api_usage', { key_id: keyData.id }),
      c.env.LIMITER ? checkAnomaly(c.env.LIMITER, keyData.id, c.env, keyData.userEmail) : Promise.resolve(),
      idempotencyKey && c.env.LIMITER
        ? kvSet(c.env.LIMITER, `idem_${keyData.id}_${idempotencyKey}`, responseBody, 300)
        : Promise.resolve(),
    ]));

    return c.json(responseBody);
  } catch (err) {
    console.error('[API PUBLIC]:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default apiPublic;