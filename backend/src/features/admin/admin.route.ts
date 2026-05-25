import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { getSupabaseAdmin } from '../../core/supabase';
import { sendReportStatusChangedEmail } from '../../core/resend';
import { runScheduler } from '../robot/robot.route';
import { getLatestHealth } from '../robot/health-monitor';
import { getViralNumbers } from '../robot/trend-detector';
import type { Env } from '../../types';

const admin = new Hono<{ Bindings: Env; Variables: { userId: string; userEmail: string } }>();

const VALID_STATUSES  = ['pending', 'verified', 'rejected', 'withdrawn'] as const;
const VALID_ROLES     = ['user', 'admin'] as const;
const UUID_REGEX      = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IP_REGEX        = /^(\d{1,3}\.){3}\d{1,3}$/;
const BLACKLIST_TTL   = 86400;

// -- Middleware ----------------------------------------------------------------

async function requireAdmin(c: { get: (k: string) => string; env: Env; json: (d: unknown, s?: number) => Response }, next: () => Promise<void>) {
  const supabase = getSupabaseAdmin(c.env);
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', c.get('userId')).single();
  if (profile?.role !== 'admin') return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  await next();
}

function validUUID(id: string) {
  return UUID_REGEX.test(id);
}

// -- Users ---------------------------------------------------------------------

admin.get('/users', authMiddleware, requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin(c.env);

    const [{ data: profiles }, { data: counts }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, role, is_banned, created_at, updated_at').order('created_at', { ascending: false }),
      supabase.from('reports').select('reporter_id').limit(10000),
    ]);

    const reportCounts: Record<string, number> = {};
    counts?.forEach((r: { reporter_id: string }) => {
      reportCounts[r.reporter_id] = (reportCounts[r.reporter_id] || 0) + 1;
    });

    return c.json({
      success: true,
      data: (profiles ?? []).map((p: Record<string, unknown>) => ({ ...p, report_count: reportCounts[p.id as string] || 0 })),
    });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.get('/users/:userId/banned', authMiddleware, requireAdmin, async (c) => {
  try {
    const userId = c.req.param('userId');
    if (!validUUID(userId)) return c.json({ success: false, message: 'ID pengguna tidak valid.' }, 400);
    const supabase = getSupabaseAdmin(c.env);
    const { data } = await supabase.from('profiles').select('is_banned').eq('id', userId).single();
    return c.json({ success: true, is_banned: data?.is_banned ?? false });
  } catch {
    return c.json({ success: false, is_banned: false });
  }
});

admin.patch('/users/:id/role', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID pengguna tidak valid.' }, 400);
    const { role } = await c.req.json();
    if (!role || !VALID_ROLES.includes(role)) return c.json({ success: false, message: `Role tidak valid.` }, 400);
    if (c.get('userId') === id) return c.json({ success: false, message: 'Tidak dapat mengubah role diri sendiri.' }, 400);
    const supabase = getSupabaseAdmin(c.env);
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.patch('/users/:id/ban', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID pengguna tidak valid.' }, 400);
    if (c.get('userId') === id) return c.json({ success: false, message: 'Tidak dapat memban diri sendiri.' }, 400);
    const { error } = await getSupabaseAdmin(c.env).from('profiles').update({ is_banned: true }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.patch('/users/:id/unban', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID pengguna tidak valid.' }, 400);
    const { error } = await getSupabaseAdmin(c.env).from('profiles').update({ is_banned: false }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// -- Reports -------------------------------------------------------------------

admin.patch('/reports/:id/status', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);
    const { status } = await c.req.json();
    if (!status || !VALID_STATUSES.includes(status)) return c.json({ success: false, message: `Status tidak valid.` }, 400);

    const supabase = getSupabaseAdmin(c.env);
    const { data: report, error: fetchError } = await supabase.from('reports').select('id, target_number, reporter_id').eq('id', id).single();
    if (fetchError || !report) return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);

    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) throw error;

    // Kirim email notifikasi (fire-and-forget)
    supabase.from('profiles').select('full_name, email').eq('id', report.reporter_id).single()
      .then(({ data: profile }) => {
        if (profile?.email) {
          sendReportStatusChangedEmail({
            to: profile.email,
            fullName: profile.full_name ?? 'Pengguna',
            targetNumber: report.target_number,
            newStatus: status,
            reportUrl: `https://kawaltransaksi.com/check/${report.target_number}`,
            apiKey: c.env.RESEND_API_KEY,
          }).catch(err => console.error('[EMAIL] Gagal kirim email status laporan:', err));
        }
      });

    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// -- Blacklist -----------------------------------------------------------------

admin.get('/blacklist', authMiddleware, requireAdmin, async (c) => {
  try {
    if (!c.env.LIMITER) return c.json({ success: false, message: 'KV tidak tersedia.' }, 500);
    const list  = await c.env.LIMITER.list({ prefix: 'blacklist_' });
    const items = await Promise.all(
      list.keys.map(async (key: { name: string }) => {
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

admin.post('/blacklist', authMiddleware, requireAdmin, async (c) => {
  try {
    if (!c.env.LIMITER) return c.json({ success: false, message: 'KV tidak tersedia.' }, 500);
    const { ip, reason } = await c.req.json();
    if (!ip || !IP_REGEX.test(ip.trim())) return c.json({ success: false, message: 'Format IP tidak valid.' }, 400);
    const key = `blacklist_${ip.trim()}`;
    if (await c.env.LIMITER.get(key)) return c.json({ success: false, message: 'IP sudah ada di blacklist.' }, 409);
    await c.env.LIMITER.put(key, JSON.stringify({
      ip: ip.trim(),
      reason: reason?.trim() || 'Diblokir manual oleh admin',
      auto: false,
      admin: c.get('userEmail'),
      created_at: new Date().toISOString(),
    }), { expirationTtl: BLACKLIST_TTL });
    return c.json({ success: true, message: 'IP berhasil ditambahkan ke blacklist.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.delete('/blacklist/:ip', authMiddleware, requireAdmin, async (c) => {
  try {
    if (!c.env.LIMITER) return c.json({ success: false, message: 'KV tidak tersedia.' }, 500);
    const ip = c.req.param('ip');
    if (!IP_REGEX.test(ip)) return c.json({ success: false, message: 'Format IP tidak valid.' }, 400);
    const key = `blacklist_${ip}`;
    if (!await c.env.LIMITER.get(key)) return c.json({ success: false, message: 'IP tidak ditemukan.' }, 404);
    await c.env.LIMITER.delete(key);
    return c.json({ success: true, message: 'IP berhasil dihapus dari blacklist.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.get('/iplogs', authMiddleware, requireAdmin, async (c) => {
  try {
    if (!c.env.LIMITER) return c.json({ success: false, message: 'KV tidak tersedia.' }, 500);
    const list  = await c.env.LIMITER.list({ prefix: 'iplog_' });
    const items = await Promise.all(
      list.keys.map(async (key: { name: string }) => {
        const value = await c.env.LIMITER.get(key.name);
        if (!value) return null;
        try { return JSON.parse(value); } catch { return null; }
      })
    );
    const logs = items.filter(Boolean).sort((a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return c.json({ success: true, data: logs });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// -- Articles ------------------------------------------------------------------

admin.get('/articles', authMiddleware, requireAdmin, async (c) => {
  try {
    const { data, error } = await getSupabaseAdmin(c.env)
      .from('articles')
      .select('id, title, slug, summary, content, status, cover_image, published_at, total_reports, top_category, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil artikel.' }, 500);
  }
});

admin.patch('/articles/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const body    = await c.req.json();
    const allowed = ['title', 'content', 'summary', 'status', 'cover_image'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) { if (key in body) update[key] = body[key]; }
    if (!Object.keys(update).length) return c.json({ success: false, message: 'Tidak ada field yang diupdate.' }, 400);
    const { error } = await getSupabaseAdmin(c.env).from('articles').update(update).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal update artikel.' }, 500);
  }
});

admin.post('/articles/generate', authMiddleware, requireAdmin, async (c) => {
  try {
    const { generateWeeklyArticle } = await import('../articles/articles.route');
    await generateWeeklyArticle(c.env);
    return c.json({ success: true, message: 'Artikel berhasil di-generate.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal generate artikel.';
    return c.json({ success: false, message }, 500);
  }
});

admin.post('/articles', authMiddleware, requireAdmin, async (c) => {
  try {
    const { title, content, summary, top_category } = await c.req.json();
    if (!title || !content || !summary) return c.json({ success: false, message: 'Title, content, dan summary wajib diisi.' }, 400);
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;
    const supabase = getSupabaseAdmin(c.env);
    const { data, error } = await supabase.from('articles').insert({
      title, content, summary, slug,
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

admin.delete('/articles/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const { error } = await getSupabaseAdmin(c.env).from('articles').delete().eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal menghapus artikel.' }, 500);
  }
});

// -- API Keys ------------------------------------------------------------------

admin.get('/apikeys', authMiddleware, requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin(c.env);
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, user_id, name, key_prefix, environment, failed_attempts, requests_today, requests_total, daily_limit, last_reset_at, last_used_at, expires_at, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const userIds = [...new Set((keys ?? []).map((k: { user_id: string }) => k.user_id).filter(Boolean))];
    const emailMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds);
      profiles?.forEach((p: { id: string; email: string }) => { emailMap[p.id] = p.email; });
    }

    return c.json({
      success: true,
      data: (keys ?? []).map((k: Record<string, unknown>) => ({ ...k, user_email: emailMap[k.user_id as string] ?? null })),
    });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil API keys.' }, 500);
  }
});

admin.patch('/apikeys/:id/toggle', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const { is_active } = await c.req.json();
    const { error } = await getSupabaseAdmin(c.env).from('api_keys').update({ is_active }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal update status.' }, 500);
  }
});

admin.patch('/apikeys/:id/reset', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await getSupabaseAdmin(c.env).from('api_keys').update({ requests_today: 0, last_reset_at: today }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal reset usage.' }, 500);
  }
});

admin.patch('/apikeys/:id/limit', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const { daily_limit } = await c.req.json();
    if (!daily_limit || typeof daily_limit !== 'number' || daily_limit < 1) return c.json({ success: false, message: 'daily_limit tidak valid.' }, 400);
    const { error } = await getSupabaseAdmin(c.env).from('api_keys').update({ daily_limit }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal update limit.' }, 500);
  }
});

admin.patch('/apikeys/:id/reset-failed', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const { error } = await getSupabaseAdmin(c.env).from('api_keys').update({ failed_attempts: 0 }).eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal reset failed attempts.' }, 500);
  }
});

admin.delete('/apikeys/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const { error } = await getSupabaseAdmin(c.env).from('api_keys').delete().eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal hapus API key.' }, 500);
  }
});

// -- Robot ---------------------------------------------------------------------

admin.get('/robot/health', authMiddleware, requireAdmin, async (c) => {
  try {
    const latest = await getLatestHealth(getSupabaseAdmin(c.env));
    return c.json({ success: true, data: latest });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil health data.' }, 500);
  }
});

admin.get('/robot/blacklist-list', authMiddleware, requireAdmin, async (c) => {
  try {
    const { data } = await getSupabaseAdmin(c.env)
      .from('blacklist')
      .select('*')
      .order('unique_reporters', { ascending: false })
      .limit(50);
    return c.json({ success: true, data: data ?? [] });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil blacklist.' }, 500);
  }
});

admin.get('/robot/viral', authMiddleware, requireAdmin, async (c) => {
  try {
    const data = await getViralNumbers(getSupabaseAdmin(c.env));
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil data viral.' }, 500);
  }
});

admin.get('/robot/logs', authMiddleware, requireAdmin, async (c) => {
  try {
    const { data } = await getSupabaseAdmin(c.env)
      .from('robot_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    return c.json({ success: true, data: data ?? [] });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil logs.' }, 500);
  }
});

admin.post('/robot/run-scheduler', authMiddleware, requireAdmin, async (c) => {
  try {
    const result = await runScheduler(getSupabaseAdmin(c.env));
    return c.json({ success: true, data: result });
  } catch {
    return c.json({ success: false, message: 'Gagal menjalankan scheduler.' }, 500);
  }
});

export default admin;