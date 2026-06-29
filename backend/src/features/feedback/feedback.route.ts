import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { sendFeedbackReplyEmail } from '../../core/resend';
import { getEnv } from '../../types';
import sql from '../../core/db';

const feedback = new Hono();

const VALID_CATEGORIES = ['bug', 'feature', 'ui_ux', 'other'] as const;
const VALID_URGENCIES  = ['low', 'medium', 'high', 'critical'] as const;
const VALID_STATUSES   = ['pending', 'in_review', 'fixed', 'closed'] as const;
const UUID_REGEX       = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIMITS = { TITLE_MAX: 150, DESCRIPTION_MAX: 2000, REPLY_MAX: 2000, SCREENSHOTS_MAX: 3, PER_DAY: 10 };
const ALLOWED_SCREENSHOT_HOSTNAMES = ['xcljigqrbwtqkiuraohr.supabase.co', 'cdn.kawaltransaksi.com'];

function sanitizeText(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').trim();
}

function isValidScreenshotUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && ALLOWED_SCREENSHOT_HOSTNAMES.includes(hostname);
  } catch { return false; }
}

function isValidPageUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const { protocol } = new URL(url);
    return ['http:', 'https:'].includes(protocol) ? url.trim() : null;
  } catch { return null; }
}

async function requireAdminRole(c: any, next: any) {
  if (c.get('userRole') !== 'admin')
    return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  await next();
}

feedback.post('/', authMiddleware, async (c) => {
  try {
    const userId    = c.get('userId');
    const userEmail = c.get('userEmail');
    const body      = await c.req.json();

    if (!body.category || !VALID_CATEGORIES.includes(body.category))
      return c.json({ success: false, message: 'Kategori tidak valid.' }, 400);
    if (body.urgency && !VALID_URGENCIES.includes(body.urgency))
      return c.json({ success: false, message: 'Tingkat urgensi tidak valid.' }, 400);

    const title       = String(body.title ?? '').trim();
    const description = String(body.description ?? '').trim();

    if (!title || title.length < 5) return c.json({ success: false, message: 'Judul minimal 5 karakter.' }, 400);
    if (title.length > LIMITS.TITLE_MAX) return c.json({ success: false, message: `Judul maks ${LIMITS.TITLE_MAX} karakter.` }, 400);
    if (!description || description.length < 10) return c.json({ success: false, message: 'Deskripsi minimal 10 karakter.' }, 400);
    if (description.length > LIMITS.DESCRIPTION_MAX) return c.json({ success: false, message: `Deskripsi maks ${LIMITS.DESCRIPTION_MAX} karakter.` }, 400);

    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const [{ count: todayCount }] = await sql`
      SELECT COUNT(*) as count FROM feedback
      WHERE user_id = ${userId} AND created_at >= ${oneDayAgo}
    `;
    if (parseInt(todayCount) >= LIMITS.PER_DAY)
      return c.json({ success: false, message: 'Batas pengiriman feedback harian tercapai.' }, 429);

    const screenshotUrls = Array.isArray(body.screenshot_urls)
      ? (body.screenshot_urls as unknown[]).filter(isValidScreenshotUrl).slice(0, LIMITS.SCREENSHOTS_MAX) as string[]
      : [];

    await sql`
      INSERT INTO feedback (user_id, user_email, category, title, description, page_url, urgency, screenshot_urls, status)
      VALUES (
        ${userId}, ${userEmail ?? null}, ${body.category},
        ${sanitizeText(title)}, ${sanitizeText(description)},
        ${isValidPageUrl(body.page_url)}, ${body.urgency ?? 'low'},
        ${screenshotUrls}, 'pending'
      )
    `;
    return c.json({ success: true, message: 'Feedback berhasil dikirim.' }, 201);
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

feedback.get('/', authMiddleware, requireAdminRole, async (c) => {
  try {
    const data = await sql`
      SELECT id, user_id, user_email, category, title, description, page_url,
             urgency, screenshot_urls, status, admin_reply, replied_at, created_at
      FROM feedback ORDER BY created_at DESC
    `;
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

feedback.patch('/:id/status', authMiddleware, requireAdminRole, async (c) => {
  try {
    const feedbackId = c.req.param('id');
    if (!UUID_REGEX.test(feedbackId)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const { status } = await c.req.json();
    if (!status || !VALID_STATUSES.includes(status)) return c.json({ success: false, message: 'Status tidak valid.' }, 400);
    await sql`UPDATE feedback SET status = ${status} WHERE id = ${feedbackId}`;
    return c.json({ success: true, message: 'Status berhasil diperbarui.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

feedback.patch('/:id/reply', authMiddleware, requireAdminRole, async (c) => {
  try {
    const feedbackId = c.req.param('id');
    if (!UUID_REGEX.test(feedbackId)) return c.json({ success: false, message: 'ID tidak valid.' }, 400);
    const cleanReply = String((await c.req.json()).reply ?? '').trim();
    if (!cleanReply) return c.json({ success: false, message: 'Balasan tidak boleh kosong.' }, 400);
    if (cleanReply.length > LIMITS.REPLY_MAX) return c.json({ success: false, message: `Balasan maks ${LIMITS.REPLY_MAX} karakter.` }, 400);

    const [fb] = await sql`SELECT user_email, title FROM feedback WHERE id = ${feedbackId} LIMIT 1`;
    if (!fb) return c.json({ success: false, message: 'Feedback tidak ditemukan.' }, 404);

    await sql`
      UPDATE feedback SET
        admin_reply = ${sanitizeText(cleanReply)},
        replied_at  = ${new Date().toISOString()},
        status      = 'in_review'
      WHERE id = ${feedbackId}
    `;

    if (fb.user_email) {
      const env = getEnv();
      if (env.RESEND_API_KEY) {
        sendFeedbackReplyEmail({ to: fb.user_email, title: fb.title, adminReply: cleanReply, apiKey: env.RESEND_API_KEY })
          .catch(err => console.error('[EMAIL] Feedback reply:', err));
      }
    }
    return c.json({ success: true, message: 'Balasan berhasil dikirim.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default feedback;