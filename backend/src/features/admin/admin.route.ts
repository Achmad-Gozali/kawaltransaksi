import { Hono } from 'hono';
import type { Next } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { getSupabaseAdmin } from '../../core/supabase';
import { sendReportStatusChangedEmail } from '../../core/resend';
import { runScheduler } from '../robot/robot.route';
import { getLatestHealth } from '../robot/health-monitor';
import { getViralNumbers } from '../robot/trend-detector';
import { kv } from '../../core/redis';
import { getEnv } from '../../types';
import sql from '../../core/db';

const admin = new Hono();

const VALID_STATUSES = ['pending', 'verified', 'rejected', 'withdrawn'] as const;
const VALID_ROLES    = ['user', 'admin'] as const;
const UUID_REGEX     = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IP_REGEX       = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]+$/i;

async function requireAdmin(c: any, next: Next) {
  if (c.get('userRole') !== 'admin')
    return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  await next();
}

const validUUID = (id: string) => UUID_REGEX.test(id);

admin.get('/users', authMiddleware, requireAdmin, async (c) => {
  try {
    const [profiles, counts] = await Promise.all([
      sql`SELECT id, full_name, email, role, is_banned, created_at, updated_at FROM profiles ORDER BY created_at DESC`,
      sql`SELECT reporter_id FROM reports LIMIT 10000`,
    ]);

    const reportCounts: Record<string, number> = {};
    counts.forEach((r: any) => {
      reportCounts[r.reporter_id] = (reportCounts[r.reporter_id] || 0) + 1;
    });

    return c.json({
      success: true,
      data: profiles.map((p: any) => ({
        ...p, report_count: reportCounts[p.id] || 0,
      })),
    });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.get('/users/:userId/banned', authMiddleware, requireAdmin, async (c) => {
  try {
    const userId = c.req.param('userId');
    if (!validUUID(userId)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const [data] = await sql`SELECT is_banned FROM profiles WHERE id = ${userId} LIMIT 1`;
    return c.json({ success: true, is_banned: data?.is_banned ?? false });
  } catch {
    return c.json({ success: false, is_banned: false });
  }
});

admin.patch('/users/:id/role', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const { role } = await c.req.json();
    if (!role || !VALID_ROLES.includes(role)) return c.json({ success: false, message: 'Role tidak valid.' }, 400);
    if (c.get('userId') === id) return c.json({ success: false, message: 'Tidak dapat mengubah role diri sendiri.' }, 400);
    await sql`UPDATE profiles SET role = ${role} WHERE id = ${id}`;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.patch('/users/:id/ban-status', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    if (c.get('userId') === id) return c.json({ success: false, message: 'Tidak dapat mengubah status diri sendiri.' }, 400);
    const { is_banned } = await c.req.json();
    if (typeof is_banned !== 'boolean') return c.json({ success: false, message: 'is_banned harus boolean.' }, 400);
    await sql`UPDATE profiles SET is_banned = ${is_banned} WHERE id = ${id}`;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.patch('/reports/:id/status', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);
    const { status } = await c.req.json();
    if (!status || !VALID_STATUSES.includes(status)) return c.json({ success: false, message: 'Status tidak valid.' }, 400);

    const [report] = await sql`SELECT id, target_number, reporter_id FROM reports WHERE id = ${id} LIMIT 1`;
    if (!report) return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);

    await sql`UPDATE reports SET status = ${status} WHERE id = ${id}`;

    (async () => {
      try {
        const env = getEnv();
        const [profile] = await sql`SELECT full_name, email FROM profiles WHERE id = ${report.reporter_id} LIMIT 1`;
        if (profile?.email) {
          await sendReportStatusChangedEmail({
            to:           profile.email,
            fullName:     profile.full_name ?? 'Pengguna',
            targetNumber: report.target_number,
            newStatus:    status,
            reportUrl:    `https://kawaltransaksi.com/check/${report.target_number}`,
            apiKey:       env.RESEND_API_KEY,
          });
        }
      } catch (err) { console.error('[EMAIL] status laporan:', err); }
    })();

    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.get('/blacklist', authMiddleware, requireAdmin, async (c) => {
  try {
    const list  = await kv.list({ prefix: 'blacklist_' });
    const items = await Promise.all(
      list.keys.map(async (key: { name: string }) => {
        const value = await kv.get(key.name);
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
    const { ip, reason } = await c.req.json();
    if (!ip || !IP_REGEX.test(ip.trim())) return c.json({ success: false, message: 'Format IP tidak valid.' }, 400);
    const key = `blacklist_${ip.trim()}`;
    if (await kv.get(key)) return c.json({ success: false, message: 'IP sudah ada di blacklist.' }, 409);
    await kv.put(key, JSON.stringify({
      ip: ip.trim(), reason: reason?.trim() || 'Diblokir manual oleh admin',
      auto: false, admin: c.get('userEmail'), created_at: new Date().toISOString(),
    }));
    return c.json({ success: true, message: 'IP berhasil ditambahkan.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.delete('/blacklist/:ip', authMiddleware, requireAdmin, async (c) => {
  try {
    const ip = c.req.param('ip');
    if (!IP_REGEX.test(ip)) return c.json({ success: false, message: 'Format IP tidak valid.' }, 400);
    const key = `blacklist_${ip}`;
    if (!await kv.get(key)) return c.json({ success: false, message: 'IP tidak ditemukan.' }, 404);
    await kv.delete(key);
    return c.json({ success: true, message: 'IP berhasil dihapus.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.get('/iplogs', authMiddleware, requireAdmin, async (c) => {
  try {
    const list  = await kv.list({ prefix: 'iplog_' });
    const items = await Promise.all(
      list.keys.map(async (key: { name: string }) => {
        const value = await kv.get(key.name);
        if (!value) return null;
        try { return JSON.parse(value); } catch { return null; }
      })
    );
    const logs = items.filter(Boolean).sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return c.json({ success: true, data: logs });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.get('/articles', authMiddleware, requireAdmin, async (c) => {
  try {
    const data = await sql`
      SELECT id, title, slug, summary, content, status, cover_image, published_at,
             total_reports, top_category, created_at
      FROM articles ORDER BY created_at DESC
    `;
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil artikel.' }, 500);
  }
});

admin.post('/articles', authMiddleware, requireAdmin, async (c) => {
  try {
    const { title, content, summary, top_category } = await c.req.json();
    if (!title || !content || !summary)
      return c.json({ success: false, message: 'Title, content, dan summary wajib diisi.' }, 400);
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;
    const now  = new Date().toISOString();
    const [data] = await sql`
      INSERT INTO articles (title, content, summary, slug, top_category, status, published_at, created_at)
      VALUES (${title}, ${content}, ${summary}, ${slug}, ${top_category || null}, 'draft', ${now}, ${now})
      RETURNING id
    `;
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Gagal membuat artikel.' }, 500);
  }
});

admin.post('/articles/generate', authMiddleware, requireAdmin, async (c) => {
  try {
    const { generateWeeklyArticle } = await import('../articles/articles.route');
    await generateWeeklyArticle();
    return c.json({ success: true, message: 'Artikel berhasil di-generate.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal generate artikel.';
    return c.json({ success: false, message }, 500);
  }
});

admin.post('/articles/:id/cover', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);

    const formData = await c.req.formData();
    const entry    = formData.get('file');
    if (!entry || typeof entry === 'string') return c.json({ success: false, message: 'File tidak ditemukan.' }, 400);

    const file         = entry as File;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return c.json({ success: false, message: 'Format gambar harus JPG, PNG, atau WebP.' }, 400);
    if (file.size > 5 * 1024 * 1024) return c.json({ success: false, message: 'Ukuran gambar maksimal 5MB.' }, 400);

    const ext      = file.name.split('.').pop() ?? 'jpg';
    const path     = `articles/${id}-${Date.now()}.${ext}`;
    const supabase = getSupabaseAdmin();

    const { error: uploadError } = await supabase.storage.from('reports').upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true });
    if (uploadError) return c.json({ success: false, message: 'Gagal upload ke storage.' }, 500);

    const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path);
    await sql`UPDATE articles SET cover_image = ${urlData.publicUrl} WHERE id = ${id}`;

    return c.json({ success: true, cover_url: urlData.publicUrl });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

admin.patch('/articles/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const body    = await c.req.json();
    const allowed = ['title', 'content', 'summary', 'status', 'cover_image'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) if (key in body) update[key] = body[key];
    if (!Object.keys(update).length) return c.json({ success: false, message: 'Tidak ada field yang diupdate.' }, 400);
    await sql`UPDATE articles SET ${sql(update)} WHERE id = ${id}`;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal update artikel.' }, 500);
  }
});

admin.delete('/articles/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    await sql`DELETE FROM articles WHERE id = ${id}`;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal menghapus artikel.' }, 500);
  }
});

admin.get('/apikeys', authMiddleware, requireAdmin, async (c) => {
  try {
    const keys = await sql`
      SELECT id, user_id, name, key_prefix, environment, failed_attempts, requests_today,
             requests_total, daily_limit, last_reset_at, last_used_at, expires_at, is_active, created_at
      FROM api_keys ORDER BY created_at DESC
    `;

    const userIds  = [...new Set(keys.map((k: any) => k.user_id).filter(Boolean))];
    const emailMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const profiles = await sql`SELECT id, email FROM profiles WHERE id IN ${sql(userIds)}`;
      profiles.forEach((p: any) => { emailMap[p.id] = p.email; });
    }

    return c.json({ success: true, data: keys.map((k: any) => ({ ...k, user_email: emailMap[k.user_id] ?? null })) });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil API keys.' }, 500);
  }
});

admin.patch('/apikeys/:id/toggle', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const { is_active } = await c.req.json();
    await sql`UPDATE api_keys SET is_active = ${is_active} WHERE id = ${id}`;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal update status.' }, 500);
  }
});

admin.patch('/apikeys/:id/reset', authMiddleware, requireAdmin, async (c) => {
  try {
    const id    = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const today = new Date().toISOString().slice(0, 10);
    await sql`UPDATE api_keys SET requests_today = 0, last_reset_at = ${today} WHERE id = ${id}`;
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
    if (!daily_limit || typeof daily_limit !== 'number' || daily_limit < 1)
      return c.json({ success: false, message: 'daily_limit tidak valid.' }, 400);
    await sql`UPDATE api_keys SET daily_limit = ${daily_limit} WHERE id = ${id}`;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal update limit.' }, 500);
  }
});

admin.patch('/apikeys/:id/reset-failed', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    await sql`UPDATE api_keys SET failed_attempts = 0 WHERE id = ${id}`;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal reset failed attempts.' }, 500);
  }
});

admin.delete('/apikeys/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    if (!validUUID(id)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    await sql`DELETE FROM api_keys WHERE id = ${id}`;
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, message: 'Gagal hapus API key.' }, 500);
  }
});

admin.get('/robot/health', authMiddleware, requireAdmin, async (c) => {
  try {
    const latest = await getLatestHealth();
    return c.json({ success: true, data: latest });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil health data.' }, 500);
  }
});

admin.get('/robot/blacklist-list', authMiddleware, requireAdmin, async (c) => {
  try {
    const data = await sql`SELECT * FROM blacklist ORDER BY unique_reporters DESC LIMIT 50`;
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil blacklist.' }, 500);
  }
});

admin.get('/robot/viral', authMiddleware, requireAdmin, async (c) => {
  try {
    const data = await getViralNumbers();
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil data viral.' }, 500);
  }
});

admin.get('/robot/logs', authMiddleware, requireAdmin, async (c) => {
  try {
    const data = await sql`SELECT * FROM robot_logs ORDER BY created_at DESC LIMIT 50`;
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil logs.' }, 500);
  }
});

admin.post('/robot/run-scheduler', authMiddleware, requireAdmin, async (c) => {
  try {
    const result = await runScheduler();
    return c.json({ success: true, data: result });
  } catch {
    return c.json({ success: false, message: 'Gagal menjalankan scheduler.' }, 500);
  }
});

export default admin;