import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { getSupabaseAdmin } from '../lib/supabase';
import { sendReportStatusChangedEmail } from '../lib/resend';
import type { Env } from '../types';

const admin = new Hono<{ Bindings: Env; Variables: { userId: string; userEmail: string } }>();

const VALID_STATUSES = ['pending', 'verified', 'rejected', 'withdrawn'] as const;
const VALID_ROLES = ['user', 'admin'] as const;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const BLACKLIST_TTL = 86400; // 24 jam

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

    // Ambil data laporan + profil pelapor untuk keperluan email
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, target_number, reporter_id')
      .eq('id', id)
      .single();

    if (fetchError || !report) {
      return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);
    }

    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) throw error;

    // ── Kirim email notifikasi ke pelapor (fire & forget) ────────────────────
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', report.reporter_id)
        .single();

      if (profile?.email) {
        const reportUrl = `https://kawaltransaksi.com/check/${report.target_number}`;
        sendReportStatusChangedEmail({
          to: profile.email,
          fullName: profile.full_name ?? 'Pengguna',
          targetNumber: report.target_number,
          newStatus: status,
          reportUrl,
          apiKey: c.env.RESEND_API_KEY,
        }).catch((err) => console.error('[EMAIL] Gagal kirim email status laporan:', err));
      }
    } catch (emailErr) {
      console.error('[EMAIL] Error saat kirim email status laporan:', emailErr);
    }

    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── PATCH /api/admin/users/:id/role ──────────────────────────────────────────
admin.patch('/users/:id/role', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
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
    if (!UUID_REGEX.test(id)) {
      return c.json({ success: false, message: 'ID pengguna tidak valid.' }, 400);
    }
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

// ── GET /api/admin/blacklist ──────────────────────────────────────────────────
admin.get('/blacklist', authMiddleware, requireAdmin, async (c) => {
  try {
    if (!c.env.LIMITER) {
      return c.json({ success: false, message: 'KV tidak tersedia.' }, 500);
    }
    const list = await c.env.LIMITER.list({ prefix: 'blacklist_' });
    const items = await Promise.all(
      list.keys.map(async (key: any) => {
        const value = await c.env.LIMITER.get(key.name);
        if (!value) return null;
        try { return JSON.parse(value); } catch { return null; }
      })
    );
    return c.json({ success: true, data: items.filter(Boolean) });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── POST /api/admin/blacklist ─────────────────────────────────────────────────
admin.post('/blacklist', authMiddleware, requireAdmin, async (c) => {
  try {
    if (!c.env.LIMITER) {
      return c.json({ success: false, message: 'KV tidak tersedia.' }, 500);
    }
    const { ip, reason } = await c.req.json();
    if (!ip || typeof ip !== 'string' || !IP_REGEX.test(ip.trim())) {
      return c.json({ success: false, message: 'Format IP tidak valid.' }, 400);
    }
    const adminEmail = c.get('userEmail');
    const blacklistKey = `blacklist_${ip.trim()}`;
    const existing = await c.env.LIMITER.get(blacklistKey);
    if (existing) {
      return c.json({ success: false, message: 'IP sudah ada di blacklist.' }, 409);
    }
    await c.env.LIMITER.put(blacklistKey, JSON.stringify({
      ip: ip.trim(),
      reason: reason?.trim() || 'Diblokir manual oleh admin',
      auto: false,
      admin: adminEmail,
      created_at: new Date().toISOString(),
    }), { expirationTtl: BLACKLIST_TTL });
    return c.json({ success: true, message: 'IP berhasil ditambahkan ke blacklist.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── DELETE /api/admin/blacklist/:ip ──────────────────────────────────────────
admin.delete('/blacklist/:ip', authMiddleware, requireAdmin, async (c) => {
  try {
    if (!c.env.LIMITER) {
      return c.json({ success: false, message: 'KV tidak tersedia.' }, 500);
    }
    const ip = c.req.param('ip');
    if (!ip || !IP_REGEX.test(ip)) {
      return c.json({ success: false, message: 'Format IP tidak valid.' }, 400);
    }
    const blacklistKey = `blacklist_${ip}`;
    const existing = await c.env.LIMITER.get(blacklistKey);
    if (!existing) {
      return c.json({ success: false, message: 'IP tidak ditemukan di blacklist.' }, 404);
    }
    await c.env.LIMITER.delete(blacklistKey);
    return c.json({ success: true, message: 'IP berhasil dihapus dari blacklist.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── GET /api/admin/iplogs ─────────────────────────────────────────────────────
admin.get('/iplogs', authMiddleware, requireAdmin, async (c) => {
  try {
    if (!c.env.LIMITER) {
      return c.json({ success: false, message: 'KV tidak tersedia.' }, 500);
    }
    const list = await c.env.LIMITER.list({ prefix: 'iplog_' });
    const items = await Promise.all(
      list.keys.map(async (key: any) => {
        const value = await c.env.LIMITER.get(key.name);
        if (!value) return null;
        try { return JSON.parse(value); } catch { return null; }
      })
    );
    const logs = items
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json({ success: true, data: logs });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── GET /api/admin/articles ───────────────────────────────────────────────────
admin.get('/articles', authMiddleware, requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin(c.env);
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, summary, content, status, cover_image, published_at, total_reports, top_category, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil artikel.' }, 500);
  }
});

// ── PATCH /api/admin/articles/:id ─────────────────────────────────────────────
admin.patch('/articles/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const body = await c.req.json();
    const allowed = ['title', 'content', 'summary', 'status', 'cover_image'];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    if (Object.keys(update).length === 0) return c.json({ success: false, message: 'Tidak ada field yang diupdate.' }, 400);
    const supabase = getSupabaseAdmin(c.env);
    const { error } = await supabase.from('articles').update(update).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal update artikel.' }, 500);
  }
});

// ── POST /api/admin/articles/generate ────────────────────────────────────────
admin.post('/articles/generate', authMiddleware, requireAdmin, async (c) => {
  try {
    const { generateWeeklyArticle } = await import('./articles');
    await generateWeeklyArticle(c.env);
    return c.json({ success: true, message: 'Artikel berhasil di-generate.' });
  } catch (err: any) {
    return c.json({ success: false, message: err?.message || 'Gagal generate artikel.' }, 500);
  }
});

// ── POST /api/admin/articles ──────────────────────────────────────────────────
admin.post('/articles', authMiddleware, requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { title, content, summary, top_category } = body;
    if (!title || !content || !summary) {
      return c.json({ success: false, message: 'Title, content, dan summary wajib diisi.' }, 400);
    }
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;
    const supabase = getSupabaseAdmin(c.env);
    const { data, error } = await supabase.from('articles').insert({
      title,
      content,
      summary,
      slug,
      top_category: top_category || null,
      status: 'draft',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }).select('id').single();
    if (error) throw error;
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Gagal membuat artikel.' }, 500);
  }
});

// ── DELETE /api/admin/articles/:id ───────────────────────────────────────────
admin.delete('/articles/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const supabase = getSupabaseAdmin(c.env);
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal menghapus artikel.' }, 500);
  }
});

export default admin;