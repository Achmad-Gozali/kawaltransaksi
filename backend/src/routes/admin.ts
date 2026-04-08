import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { getSupabaseAdmin } from '../lib/supabase';
import type { Env } from '../types';

const admin = new Hono<{ Bindings: Env; Variables: { userId: string; userEmail: string } }>();

// ── Whitelist nilai valid ─────────────────────────────────────────────────────
const VALID_STATUSES = ['pending', 'verified', 'rejected', 'withdrawn'] as const;
const VALID_ROLES = ['user', 'admin'] as const;

// FIX: UUID regex untuk validasi semua param :id
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Middleware cek role admin ─────────────────────────────────────────────────
async function requireAdmin(c: any, next: any) {
  const userId = c.get('userId');
  const supabase = getSupabaseAdmin(c.env);
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (profile?.role !== 'admin') {
    return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  }
  await next();
}

// ── GET /api/admin/users ──────────────────────────────────────────────────────
admin.get('/users', authMiddleware, requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin(c.env);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, is_banned, created_at, updated_at')
      .order('created_at', { ascending: false });

    // Hitung jumlah laporan per user
    const reportCounts: Record<string, number> = {};
    const { data: counts } = await supabase.from('reports').select('reporter_id');
    counts?.forEach((r: { reporter_id: string }) => {
      reportCounts[r.reporter_id] = (reportCounts[r.reporter_id] || 0) + 1;
    });

    const users = profiles?.map((p: any) => ({
      ...p,
      report_count: reportCounts[p.id] || 0,
    })) ?? [];

    return c.json({ success: true, data: users });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── GET /api/admin/users/:userId/banned ───────────────────────────────────────
admin.get('/users/:userId/banned', authMiddleware, requireAdmin, async (c) => {
  try {
    const userId = c.req.param('userId');

    // FIX: Validasi UUID
    if (!UUID_REGEX.test(userId)) {
      return c.json({ success: false, message: 'ID pengguna tidak valid.' }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned')
      .eq('id', userId)
      .single();
    return c.json({ success: true, is_banned: profile?.is_banned ?? false });
  } catch {
    return c.json({ success: false, is_banned: false });
  }
});

// ── PATCH /api/admin/reports/:id/status ──────────────────────────────────────
admin.patch('/reports/:id/status', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    // FIX: Validasi UUID
    if (!UUID_REGEX.test(id)) {
      return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);
    }

    const { status } = await c.req.json();

    if (!status || !VALID_STATUSES.includes(status)) {
      return c.json({
        success: false,
        message: `Status tidak valid. Nilai yang diizinkan: ${VALID_STATUSES.join(', ')}.`,
      }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── PATCH /api/admin/users/:id/role ──────────────────────────────────────────
admin.patch('/users/:id/role', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    // FIX: Validasi UUID
    if (!UUID_REGEX.test(id)) {
      return c.json({ success: false, message: 'ID pengguna tidak valid.' }, 400);
    }

    const { role } = await c.req.json();

    if (!role || !VALID_ROLES.includes(role)) {
      return c.json({
        success: false,
        message: `Role tidak valid. Nilai yang diizinkan: ${VALID_ROLES.join(', ')}.`,
      }, 400);
    }

    // Cegah admin hapus role diri sendiri
    const requesterId = c.get('userId');
    if (requesterId === id) {
      return c.json({ success: false, message: 'Tidak dapat mengubah role diri sendiri.' }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── PATCH /api/admin/users/:id/ban ───────────────────────────────────────────
admin.patch('/users/:id/ban', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    // FIX: Validasi UUID
    if (!UUID_REGEX.test(id)) {
      return c.json({ success: false, message: 'ID pengguna tidak valid.' }, 400);
    }

    // Cegah admin ban diri sendiri
    const requesterId = c.get('userId');
    if (requesterId === id) {
      return c.json({ success: false, message: 'Tidak dapat memban diri sendiri.' }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);
    const { error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── PATCH /api/admin/users/:id/unban ─────────────────────────────────────────
admin.patch('/users/:id/unban', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    // FIX: Validasi UUID
    if (!UUID_REGEX.test(id)) {
      return c.json({ success: false, message: 'ID pengguna tidak valid.' }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);
    const { error } = await supabase.from('profiles').update({ is_banned: false }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default admin;