import { Hono } from 'hono';
import { sendApiAnomalyEmail } from '../../core/resend';
import { kv } from '../../core/redis';
import { getEnv } from '../../types';
import sql from '../../core/db';

const apiPublic = new Hono();

const getIp = (c: any) =>
  c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'anonymous';

async function hashKey(key: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const isValidKeyFormat = (key: string) => /^kt_(live|test)_[A-Za-z0-9]{40}$/.test(key);

interface ApiKeyData {
  id: string;
  user_id: string;
  name: string;
  environment: string;
  requests_today: number;
  requests_total: number;
  daily_limit: number;
  last_reset_at: string;
  is_active: boolean;
  expires_at: string | null;
  failed_attempts: number;
  userEmail: string | null;
}

type ValidateResult =
  | { valid: false; message: string; statusCode: number; keyData?: undefined }
  | { valid: true; keyData: ApiKeyData; message?: undefined; statusCode?: undefined };

async function checkIpRateLimit(ip: string): Promise<boolean> {
  const key   = `rl_api_v1_${ip}`;
  const count = parseInt(await kv.get(key) ?? '0');
  if (count >= 60) return false;
  await kv.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return true;
}

async function logFailedAttempt(ip: string, reason: string): Promise<void> {
  try {
    const key      = `api_fail_${ip}`;
    const newCount = parseInt(await kv.get(key) ?? '0') + 1;
    await kv.put(key, newCount.toString(), { expirationTtl: 300 });
    if (newCount >= 10 && !await kv.get(`blacklist_${ip}`)) {
      await kv.put(`blacklist_${ip}`, JSON.stringify({
        ip, reason: `Auto-blacklist: ${newCount}x failed API auth (${reason})`,
        auto: true, created_at: new Date().toISOString(),
      }), { expirationTtl: 86400 });
    }
  } catch (err) { console.error('[API] logFailedAttempt:', err); }
}

async function validateApiKey(key: string, ip: string): Promise<ValidateResult> {
  if (!key?.trim()) return { valid: false, message: 'API key tidak ditemukan.', statusCode: 401 };
  if (!isValidKeyFormat(key)) {
    await logFailedAttempt(ip, 'invalid_format');
    return { valid: false, message: 'API key tidak valid.', statusCode: 401 };
  }

  const keyHash   = await hashKey(key.trim());
  const negCached = await kv.get(`neg_cache_${keyHash}`);
  if (negCached) {
    await logFailedAttempt(ip, `neg_cached:${negCached}`);
    return { valid: false, message: 'API key tidak valid.', statusCode: 401 };
  }

  const [data] = await sql`
    SELECT id, user_id, name, environment, requests_today, requests_total,
           daily_limit, last_reset_at, is_active, expires_at, failed_attempts
    FROM api_keys WHERE key_hash = ${keyHash} LIMIT 1
  `;

  if (!data) {
    await Promise.all([
      kv.put(`neg_cache_${keyHash}`, 'not_found', { expirationTtl: 600 }),
      logFailedAttempt(ip, 'key_not_found'),
    ]);
    return { valid: false, message: 'API key tidak valid.', statusCode: 401 };
  }

  if (!data.is_active) {
    await Promise.all([
      kv.put(`neg_cache_${keyHash}`, 'inactive', { expirationTtl: 300 }),
      logFailedAttempt(ip, 'key_inactive'),
    ]);
    return { valid: false, message: 'API key tidak aktif.', statusCode: 401 };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date())
    return { valid: false, message: 'API key sudah kadaluarsa.', statusCode: 401 };

  const today = new Date().toISOString().slice(0, 10);
  if (String(data.last_reset_at).slice(0, 10) !== today) {
    await sql`UPDATE api_keys SET requests_today = 0, last_reset_at = ${today} WHERE id = ${data.id}`;
    data.requests_today = 0;
  }

  if (data.requests_today >= data.daily_limit)
    return { valid: false, message: `Batas harian tercapai (${data.daily_limit} request/hari).`, statusCode: 429 };

  const [profile] = await sql`SELECT email FROM profiles WHERE id = ${data.user_id} LIMIT 1`;
  return { valid: true, keyData: { ...data, userEmail: profile?.email ?? null } as ApiKeyData };
}

async function checkAnomaly(keyId: string, userEmail: string | null): Promise<void> {
  try {
    const env      = getEnv();
    const now      = new Date();
    const hourSlot = now.toISOString().slice(0, 13);
    const countKey = `anomaly_count_${keyId}_${hourSlot}`;
    const newCount = parseInt(await kv.get(countKey) ?? '0') + 1;
    await kv.put(countKey, newCount.toString(), { expirationTtl: 3600 });
    if (newCount % 10 !== 0) return;

    const dailySums: number[] = [];
    for (let i = 1; i <= 7; i++) {
      const day = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
      const val = await kv.get(`anomaly_daily_${keyId}_${day}`);
      if (val) dailySums.push(parseInt(val));
    }
    if (dailySums.length < 3) return;

    const avgDaily  = dailySums.reduce((a, b) => a + b, 0) / dailySums.length;
    const avgHourly = avgDaily / 24;
    const trigger   = avgHourly * 3;
    if (newCount < trigger || trigger <= 0) return;

    const alertKey = `anomaly_alerted_${keyId}_${hourSlot}`;
    if (await kv.get(alertKey)) return;
    await kv.put(alertKey, '1', { expirationTtl: 3600 });

    if (userEmail && env.RESEND_API_KEY) {
      sendApiAnomalyEmail({
        to:               userEmail,
        keyId,
        requestsThisHour: newCount,
        avgPerHour:       Math.round(avgHourly),
        multiplier:       Math.round(newCount / avgHourly),
        apiKey:           env.RESEND_API_KEY,
      }).catch(console.error);
    }
  } catch (err) { console.error('[ANOMALY]:', err); }
}

apiPublic.get('/check', async (c) => {
  try {
    const ip             = getIp(c);
    const apiKey         = (c.req.header('X-API-Key') || '').trim();
    const idempotencyKey = c.req.header('Idempotency-Key') || null;

    if (ip !== 'anonymous' && !await checkIpRateLimit(ip))
      return c.json({ success: false, message: 'Terlalu banyak request dari IP Anda.' }, 429);

    const { valid, keyData, message, statusCode } = await validateApiKey(apiKey, ip);
    if (!valid) return c.json({ success: false, message }, (statusCode ?? 401) as 401 | 429);

    if (idempotencyKey) {
      const cached = await kv.get(`idem_${keyData.id}_${idempotencyKey}`);
      if (cached) return c.json({ ...JSON.parse(cached), meta: { idempotent: true } });
    }

    const number = c.req.query('number')?.replace(/\D/g, '') || '';
    const type   = c.req.query('type') || 'phone';
    const bank   = c.req.query('bank') || null;

    if (!number || number.length < 5 || number.length > 32)
      return c.json({ success: false, message: 'Parameter number tidak valid.' }, 400);
    if (!['phone', 'bank_account', 'ewallet'].includes(type))
      return c.json({ success: false, message: 'Parameter type tidak valid.' }, 400);

    const cacheKey = `check_cache_${type}_${number}`;
    let checkData: Record<string, unknown> | null = null;

    try {
      const cached = await kv.get(cacheKey);
      if (cached) checkData = JSON.parse(cached);
    } catch {}

    if (!checkData) {
      const reportsData = await sql`
        SELECT status, loss_amount, category, created_at, bank_name, target_type
        FROM reports
        WHERE target_number = ${number} AND status != 'withdrawn'
        ORDER BY created_at DESC
      `;

      const all      = reportsData;
      const verified = all.filter((r: any) => r.status === 'verified');
      const pending  = all.filter((r: any) => r.status === 'pending');

      checkData = {
        number, type, bank,
        status:           verified.length > 0 ? 'danger' : pending.length > 0 ? 'warning' : 'safe',
        verified_reports: verified.length,
        pending_reports:  pending.length,
        total_reports:    all.length,
        total_loss:       all.reduce((sum: number, r: any) => sum + (Number(r.loss_amount) || 0), 0),
        last_reported:    all[0]?.created_at ?? null,
        check_url:        `https://kawaltransaksi.com/check/${number}`,
      };

      kv.put(cacheKey, JSON.stringify(checkData), { expirationTtl: 300 }).catch(console.error);
    }

    const responseBody = {
      success: true, data: checkData,
      meta: {
        environment:        keyData.environment ?? 'live',
        requests_today:     keyData.requests_today + 1,
        daily_limit:        keyData.daily_limit,
        requests_remaining: keyData.daily_limit - keyData.requests_today - 1,
        expires_at:         keyData.expires_at ?? null,
      },
    };

    Promise.all([
      sql`SELECT increment_api_usage(${keyData.id})`.catch(console.error),
      checkAnomaly(keyData.id, keyData.userEmail),
      idempotencyKey
        ? kv.put(`idem_${keyData.id}_${idempotencyKey}`, JSON.stringify(responseBody), { expirationTtl: 300 })
        : Promise.resolve(),
    ]).catch(console.error);

    return c.json(responseBody);
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default apiPublic;