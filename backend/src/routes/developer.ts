import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { getSupabaseAdmin } from '../lib/supabase';
import type { Env } from '../types';

const developer = new Hono<{ Bindings: Env; Variables: { userId: string; userEmail: string } }>();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomChars(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// Format: kt_live_<40chars> atau kt_test_<40chars>
function generateApiKey(environment: 'live' | 'test'): string {
  return `kt_${environment}_${randomChars(40)}`;
}

// SHA-256 via Web Crypto API (native di Cloudflare Workers)
async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validasi format key sebelum query DB
function isValidKeyFormat(key: string): boolean {
  return /^kt_(live|test)_[A-Za-z0-9]{40}$/.test(key);
}

function calcExpiresAt(duration: string | null): string | null {
  if (!duration || duration === 'never') return null;
  const now = new Date();
  switch (duration) {
    case '7d':  now.setDate(now.getDate() + 7);        break;
    case '30d': now.setDate(now.getDate() + 30);       break;
    case '90d': now.setDate(now.getDate() + 90);       break;
    case '1y':  now.setFullYear(now.getFullYear() + 1); break;
    default:    return null;
  }
  return now.toISOString();
}

// ── GET /api/developer/keys ───────────────────────────────────────────────────
developer.get('/keys', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const supabase = getSupabaseAdmin(c.env);

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, environment, requests_today, requests_total, daily_limit, last_reset_at, last_used_at, is_active, expires_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ success: true, data: data ?? [] });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil API keys.' }, 500);
  }
});

// ── POST /api/developer/keys ──────────────────────────────────────────────────
developer.post('/keys', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { name, expires_in, environment = 'live' } = await c.req.json();

    if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50) {
      return c.json({ success: false, message: 'Nama key tidak valid (1-50 karakter).' }, 400);
    }

    if (!['live', 'test'].includes(environment)) {
      return c.json({ success: false, message: 'Environment tidak valid. Gunakan: live atau test.' }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);

    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((count ?? 0) >= 5) {
      return c.json({ success: false, message: 'Maksimal 5 API key per akun.' }, 400);
    }

    const plainKey  = generateApiKey(environment as 'live' | 'test');
    const keyHash   = await hashKey(plainKey);
    const keyPrefix = plainKey.slice(0, 12); // "kt_live_XXXX"
    const today     = new Date().toISOString().slice(0, 10);
    const expiresAt = calcExpiresAt(expires_in ?? null);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: name.trim(),
        key: plainKey,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        environment,
        requests_today: 0,
        requests_total: 0,
        daily_limit: 300,
        last_reset_at: today,
        last_used_at: null,
        failed_attempts: 0,
        is_active: true,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      })
      .select('id, name, key_prefix, environment, requests_today, requests_total, daily_limit, is_active, expires_at, created_at')
      .single();

    if (error) throw error;
    // ✅ Plain key hanya dikembalikan sekali saat generate
    return c.json({ success: true, data: { ...data, key: plainKey, show_once: true } });
  } catch {
    return c.json({ success: false, message: 'Gagal membuat API key.' }, 500);
  }
});

// ── PATCH /api/developer/keys/:id/rename ─────────────────────────────────────
developer.patch('/keys/:id/rename', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');

    if (!UUID_REGEX.test(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);

    const { name } = await c.req.json();
    if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50) {
      return c.json({ success: false, message: 'Nama tidak valid (1-50 karakter).' }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);
    const { data: existing } = await supabase
      .from('api_keys').select('id').eq('id', id).eq('user_id', userId).single();

    if (!existing) return c.json({ success: false, message: 'API key tidak ditemukan.' }, 404);

    const { error } = await supabase.from('api_keys').update({ name: name.trim() }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal rename API key.' }, 500);
  }
});

// ── POST /api/developer/keys/:id/regenerate ───────────────────────────────────
developer.post('/keys/:id/regenerate', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');

    if (!UUID_REGEX.test(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);

    const supabase = getSupabaseAdmin(c.env);
    const { data: existing } = await supabase
      .from('api_keys').select('id, environment').eq('id', id).eq('user_id', userId).single();

    if (!existing) return c.json({ success: false, message: 'API key tidak ditemukan.' }, 404);

    const env       = (existing.environment ?? 'live') as 'live' | 'test';
    const plainKey  = generateApiKey(env);
    const keyHash   = await hashKey(plainKey);
    const keyPrefix = plainKey.slice(0, 12);

    const { data, error } = await supabase
      .from('api_keys')
      .update({ key: plainKey, key_hash: keyHash, key_prefix: keyPrefix, requests_today: 0, requests_total: 0, last_used_at: null, failed_attempts: 0 })
      .eq('id', id)
      .select('id, name, key_prefix, environment, requests_today, requests_total, daily_limit, is_active, expires_at, created_at')
      .single();

    if (error) throw error;
    // ✅ Plain key baru dikembalikan sekali saat regenerate
    return c.json({ success: true, data: { ...data, key: plainKey, show_once: true } });
  } catch {
    return c.json({ success: false, message: 'Gagal regenerate API key.' }, 500);
  }
});

// ── DELETE /api/developer/keys/:id ───────────────────────────────────────────
developer.delete('/keys/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');

    if (!UUID_REGEX.test(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);

    const supabase = getSupabaseAdmin(c.env);
    const { data: existing } = await supabase
      .from('api_keys').select('id').eq('id', id).eq('user_id', userId).single();

    if (!existing) return c.json({ success: false, message: 'API key tidak ditemukan.' }, 404);

    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal menghapus API key.' }, 500);
  }
});

export default developer;