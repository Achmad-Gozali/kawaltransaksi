import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { getSupabaseAdmin } from '../../core/supabase';
import type { Env } from '../../types';

const developer = new Hono<{ Bindings: Env; Variables: { userId: string; userEmail: string; userRole: string } }>();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY_SELECT = 'id, name, key_prefix, environment, requests_today, requests_total, daily_limit, last_used_at, is_active, expires_at, created_at';

// FIX: definisikan valid durations secara eksplisit
// sebelumnya calcExpiresAt menerima string apapun dan silent fail kalau tidak valid
const VALID_DURATIONS = ['7d', '30d', '90d', '1y', 'never'] as const;
type ValidDuration = typeof VALID_DURATIONS[number];

// -- Helpers -------------------------------------------------------------------

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

// FIX: hanya terima ValidDuration, bukan sembarang string
// sebelumnya: calcExpiresAt(duration: string | null) — input '9999d' return null tanpa error
// sekarang:   type-safe, invalid duration di-reject di route handler sebelum sampai sini
function calcExpiresAt(duration: ValidDuration | null): string | null {
  if (!duration || duration === 'never') return null;
  const now  = new Date();
  const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  if (days[duration]) {
    now.setDate(now.getDate() + days[duration]);
    return now.toISOString();
  }
  if (duration === '1y') {
    now.setFullYear(now.getFullYear() + 1);
    return now.toISOString();
  }
  return null;
}

async function validateKeyOwner(id: string, userId: string, supabase: ReturnType<typeof getSupabaseAdmin>) {
  if (!UUID_REGEX.test(id)) return null;
  const { data } = await supabase.from('api_keys').select('id, environment').eq('id', id).eq('user_id', userId).single();
  return data ?? null;
}

// -- GET /api/developer/keys ---------------------------------------------------

developer.get('/keys', authMiddleware, async (c) => {
  try {
    const { data, error } = await getSupabaseAdmin(c.env)
      .from('api_keys')
      .select(`${KEY_SELECT}, last_reset_at`)
      .eq('user_id', c.get('userId'))
      .order('created_at', { ascending: false });
    if (error) throw error;
    return c.json({ success: true, data: data ?? [] });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil API keys.' }, 500);
  }
});

// -- POST /api/developer/keys --------------------------------------------------

developer.post('/keys', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { name, expires_in, environment = 'live' } = await c.req.json();

    if (!name?.trim() || name.trim().length > 50)
      return c.json({ success: false, message: 'Nama key tidak valid (1-50 karakter).' }, 400);

    if (!['live', 'test'].includes(environment))
      return c.json({ success: false, message: 'Environment tidak valid. Gunakan: live atau test.' }, 400);

    // FIX: validasi expires_in secara eksplisit sebelum masuk ke calcExpiresAt
    // sebelumnya input sembarang string diterima dan silent fail (return null = no expiry)
    if (expires_in !== undefined && expires_in !== null && !VALID_DURATIONS.includes(expires_in)) {
      return c.json({
        success: false,
        message: `Durasi tidak valid. Gunakan salah satu: ${VALID_DURATIONS.join(', ')}.`,
      }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);
    const { count } = await supabase.from('api_keys').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if ((count ?? 0) >= 5)
      return c.json({ success: false, message: 'Maksimal 5 API key per akun.' }, 400);

    const plainKey = generateApiKey(environment as 'live' | 'test');
    const today    = new Date().toISOString().slice(0, 10);

const { data, error } = await supabase.from('api_keys').insert({
  user_id:         userId,
  name:            name.trim(),
  key_hash:        await hashKey(plainKey),
  key_prefix:      plainKey.slice(0, 12),
  environment,
  requests_today:  0,
  requests_total:  0,
  daily_limit:     300,
  last_reset_at:   today,
  last_used_at:    null,
  failed_attempts: 0,
  is_active:       true,
  expires_at:      calcExpiresAt((expires_in as ValidDuration) ?? null),
  created_at:      new Date().toISOString(),
}).select(KEY_SELECT).single();

    if (error) throw error;
    return c.json({ success: true, data: { ...data, key: plainKey, show_once: true } });
  } catch {
    return c.json({ success: false, message: 'Gagal membuat API key.' }, 500);
  }
});

// -- PATCH /api/developer/keys/:id/rename -------------------------------------

developer.patch('/keys/:id/rename', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const id     = c.req.param('id');
    const { name } = await c.req.json();

    if (!name?.trim() || name.trim().length > 50)
      return c.json({ success: false, message: 'Nama tidak valid (1-50 karakter).' }, 400);

    const supabase = getSupabaseAdmin(c.env);
    if (!await validateKeyOwner(id, userId, supabase))
      return c.json({ success: false, message: 'API key tidak ditemukan.' }, 404);

    const { error } = await supabase.from('api_keys').update({ name: name.trim() }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal rename API key.' }, 500);
  }
});

// -- POST /api/developer/keys/:id/regenerate -----------------------------------

developer.post('/keys/:id/regenerate', authMiddleware, async (c) => {
  try {
    const userId   = c.get('userId');
    const id       = c.req.param('id');
    const supabase = getSupabaseAdmin(c.env);

    const existing = await validateKeyOwner(id, userId, supabase);
    if (!existing) return c.json({ success: false, message: 'API key tidak ditemukan.' }, 404);

    const plainKey = generateApiKey((existing.environment ?? 'live') as 'live' | 'test');

const { data, error } = await supabase.from('api_keys').update({
  key_hash:        await hashKey(plainKey),
  key_prefix:      plainKey.slice(0, 12),
  requests_today:  0,
  requests_total:  0,
  last_used_at:    null,
  failed_attempts: 0,
}).eq('id', id).select(KEY_SELECT).single();

    if (error) throw error;
    return c.json({ success: true, data: { ...data, key: plainKey, show_once: true } });
  } catch {
    return c.json({ success: false, message: 'Gagal regenerate API key.' }, 500);
  }
});

// -- DELETE /api/developer/keys/:id -------------------------------------------

developer.delete('/keys/:id', authMiddleware, async (c) => {
  try {
    const userId   = c.get('userId');
    const id       = c.req.param('id');
    const supabase = getSupabaseAdmin(c.env);

    if (!await validateKeyOwner(id, userId, supabase))
      return c.json({ success: false, message: 'API key tidak ditemukan.' }, 404);

    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal menghapus API key.' }, 500);
  }
});

export default developer;