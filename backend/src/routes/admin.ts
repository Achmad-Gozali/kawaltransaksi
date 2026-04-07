import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { getSupabaseAdmin } from '../lib/supabase';
import type { Env } from '../types'; // ← ganti dari '../index'

// ... sisa file sama persis

const admin = new Hono<{ Bindings: Env; Variables: { userId: string; userEmail: string } }>();

async function requireAdmin(c: any, next: any) {
  const userId = c.get('userId');
  const supabase = getSupabaseAdmin(c.env);
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
  if (profile?.role !== 'admin') return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  await next();
}

// ── GET /api/admin/users ──────────────────────────────────────────────────────
admin.get('/users', authMiddleware, requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin(c.env);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_banned, created_at, updated_at')
      .order('created_at', { ascending: false });

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const reportCounts: Record<string, number> = {};
    const { data: counts } = await supabase.from('reports').select('reporter_id');
    counts?.forEach((r: { reporter_id: string }) => {
      reportCounts[r.reporter_id] = (reportCounts[r.reporter_id] || 0) + 1;
    });

    const users = profiles?.map((p: any) => {
      const authUser = authUsers?.users?.find((u: any) => u.id === p.id);
      return { ...p, email: authUser?.email ?? '', report_count: reportCounts[p.id] || 0 };
    }) ?? [];

    return c.json({ success: true, data: users });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── GET /api/admin/users/:userId/banned ───────────────────────────────────────
admin.get('/users/:userId/banned', async (c) => {
  try {
    const userId = c.req.param('userId');
    const supabase = getSupabaseAdmin(c.env);
    const { data: profile } = await supabase.from('profiles').select('is_banned').eq('id', userId).single();
    return c.json({ success: true, is_banned: profile?.is_banned ?? false });
  } catch {
    return c.json({ success: false, is_banned: false });
  }
});

// ── PATCH /api/admin/reports/:id/status ──────────────────────────────────────
admin.patch('/reports/:id/status', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();
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
    const { role } = await c.req.json();
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
    const supabase = getSupabaseAdmin(c.env);
    const { error } = await supabase.from('profiles').update({ is_banned: false }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default admin;