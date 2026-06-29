import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { kv } from '../../core/redis';
import sql from '../../core/db';

const developer = new Hono();

const UUID_REGEX      = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY_SELECT_COLS = `id, name, key_prefix, environment, requests_today, requests_total,
                         daily_limit, last_used_at, is_active, expires_at, created_at`;
const VALID_DURATIONS = ['7d', '30d', '90d', '1y', 'never'] as const;
type ValidDuration = typeof VALID_DURATIONS[number];

const getIp = (c: any) =>
  c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'anonymous';

function randomChars(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

const generateApiKey = (env: 'live' | 'test') => `kt_${env}_${randomChars(40)}`;

async function hashKey(key: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function calcExpiresAt(duration: ValidDuration | null): string | null {
  if (!duration || duration === 'never') return null;
  const now  = new Date();
  const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  if (days[duration]) { now.setDate(now.getDate() + days[duration]); return now.toISOString(); }
  if (duration === '1y') { now.setFullYear(now.getFullYear() + 1); return now.toISOString(); }
  return null;
}

async function validateKeyOwner(id: string, userId: string) {
  if (!UUID_REGEX.test(id)) return null;
  const [data] = await sql`
    SELECT id, environment FROM api_keys WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `;
  return data ?? null;
}

developer.get('/keys', authMiddleware, async (c) => {
  try {
    const data = await sql`
      SELECT ${sql.unsafe(KEY_SELECT_COLS)}, last_reset_at
      FROM api_keys WHERE user_id = ${c.get('userId')}
      ORDER BY created_at DESC
    `;
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil API keys.' }, 500);
  }
});

developer.post('/keys', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { name, expires_in, environment = 'live' } = await c.req.json();

    if (!name?.trim() || name.trim().length > 50)
      return c.json({ success: false, message: 'Nama key tidak valid (1-50 karakter).' }, 400);
    if (!['live', 'test'].includes(environment))
      return c.json({ success: false, message: 'Environment tidak valid.' }, 400);
    if (expires_in !== undefined && expires_in !== null && !VALID_DURATIONS.includes(expires_in))
      return c.json({ success: false, message: 'Durasi tidak valid.' }, 400);

    const [{ count }] = await sql`SELECT COUNT(*) as count FROM api_keys WHERE user_id = ${userId}`;
    if (parseInt(count) >= 5) return c.json({ success: false, message: 'Maksimal 5 API key per akun.' }, 400);

    const plainKey = generateApiKey(environment as 'live' | 'test');
    const today    = new Date().toISOString().slice(0, 10);
    const now      = new Date().toISOString();
    const expiresAt = calcExpiresAt((expires_in as ValidDuration) ?? null);

    const [data] = await sql`
      INSERT INTO api_keys (
        user_id, name, key_hash, key_prefix, environment,
        requests_today, requests_total, daily_limit,
        last_reset_at, last_used_at, failed_attempts,
        is_active, expires_at, created_at
      ) VALUES (
        ${userId}, ${name.trim()}, ${await hashKey(plainKey)}, ${plainKey.slice(0, 12)},
        ${environment}, 0, 0, 300, ${today}, null, 0, true, ${expiresAt}, ${now}
      )
      RETURNING ${sql.unsafe(KEY_SELECT_COLS)}
    `;

    return c.json({ success: true, data: { ...data, key: plainKey, show_once: true } });
  } catch {
    return c.json({ success: false, message: 'Gagal membuat API key.' }, 500);
  }
});

developer.patch('/keys/:id/rename', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const id     = c.req.param('id');
    const { name } = await c.req.json();
    if (!name?.trim() || name.trim().length > 50)
      return c.json({ success: false, message: 'Nama tidak valid.' }, 400);
    if (!await validateKeyOwner(id, userId))
      return c.json({ success: false, message: 'API key tidak ditemukan.' }, 404);
    await sql`UPDATE api_keys SET name = ${name.trim()} WHERE id = ${id}`;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal rename API key.' }, 500);
  }
});

developer.post('/keys/:id/regenerate', authMiddleware, async (c) => {
  try {
    const userId   = c.get('userId');
    const id       = c.req.param('id');
    const existing = await validateKeyOwner(id, userId);
    if (!existing) return c.json({ success: false, message: 'API key tidak ditemukan.' }, 404);
    const plainKey = generateApiKey((existing.environment ?? 'live') as 'live' | 'test');
    const [data]   = await sql`
      UPDATE api_keys SET
        key_hash       = ${await hashKey(plainKey)},
        key_prefix     = ${plainKey.slice(0, 12)},
        requests_today = 0,
        requests_total = 0,
        last_used_at   = null,
        failed_attempts = 0
      WHERE id = ${id}
      RETURNING ${sql.unsafe(KEY_SELECT_COLS)}
    `;
    return c.json({ success: true, data: { ...data, key: plainKey, show_once: true } });
  } catch {
    return c.json({ success: false, message: 'Gagal regenerate API key.' }, 500);
  }
});

developer.delete('/keys/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const id     = c.req.param('id');
    if (!await validateKeyOwner(id, userId))
      return c.json({ success: false, message: 'API key tidak ditemukan.' }, 404);
    await sql`DELETE FROM api_keys WHERE id = ${id}`;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal menghapus API key.' }, 500);
  }
});

developer.post('/playground', async (c) => {
  try {
    const ip         = getIp(c);
    const authHeader = c.req.header('Authorization');
    let isLoggedIn   = false;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { getSupabaseAdmin } = await import('../../core/supabase');
        const { data } = await getSupabaseAdmin().auth.getUser(authHeader.slice(7));
        isLoggedIn = !!data.user;
      } catch {}
    }

    if (ip !== 'anonymous') {
      const rlKey   = `playground_${isLoggedIn ? 'auth' : 'guest'}_${ip}`;
      const limit   = isLoggedIn ? 10 : 5;
      const current = parseInt(await kv.get(rlKey) ?? '0');
      if (current >= limit)
        return c.json({ success: false, message: `Batas playground tercapai (${limit}x/jam).` }, 429);
      await kv.put(rlKey, (current + 1).toString(), { expirationTtl: 3600 });
    }

    const { number: rawNumber, type = 'phone', bank = null } = await c.req.json();
    const number = String(rawNumber ?? '').replace(/\D/g, '');

    if (!number || number.length < 5 || number.length > 32)
      return c.json({ success: false, message: 'Nomor tidak valid.' }, 400);
    if (!['phone', 'bank_account', 'ewallet'].includes(type))
      return c.json({ success: false, message: 'Tipe tidak valid.' }, 400);

    const cacheKey = `check_cache_${type}_${number}`;
    let checkData: Record<string, unknown> | null = null;

    try {
      const cached = await kv.get(cacheKey);
      if (cached) checkData = JSON.parse(cached);
    } catch {}

    if (!checkData) {
      const reportsData = await sql`
        SELECT status, loss_amount, created_at FROM reports
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

    return c.json({ success: true, data: checkData, meta: { playground: true, authenticated: isLoggedIn } });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default developer;