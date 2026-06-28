import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { getSupabaseAdmin } from '../../core/supabase';
import { sendFeedbackReplyEmail } from '../../core/resend';
import { getEnv } from '../../types';

const feedback = new Hono();

const VALID_CATEGORIES = ['bug', 'feature', 'ui_ux', 'other'] as const;
const VALID_URGENCIES  = ['low', 'medium', 'high', 'critical'] as const;
const VALID_STATUSES   = ['pending', 'in_review', 'fixed', 'closed'] as const;
const UUID_REGEX       = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIMITS = { TITLE_MAX: 150, DESCRIPTION_MAX: 2000, REPLY_MAX: 2000, SCREENSHOTS_MAX: 3, PER_DAY: 10 };
const ALLOWED_SCREENSHOT_HOSTNAMES = ['xcljigqrbwtqkiuraohr.supabase.co', 'cdn.kawaltransaksi.com'];
const FEEDBACK_FIELDS = 'id, user_id, user_email, category, title, description, page_url, urgency, screenshot_urls, status, admin_reply, replied_at, created_at';

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
    const supabase  = getSupabaseAdmin();

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
    const { count: todayCount } = await supabase.from('feedback').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', oneDayAgo);
    if ((todayCount ?? 0) >= LIMITS.PER_DAY)
      return c.json({ success: false, message: 'Batas pengiriman feedback harian tercapai.' }, 429);

    const screenshotUrls = Array.isArray(body.screenshot_urls)
      ? (body.screenshot_urls as unknown[]).filter(isValidScreenshotUrl).slice(0, LIMITS.SCREENSHOTS_MAX) as string[]
      : [];

    const { error } = await supabase.from('feedback').insert({
      user_id: userId, user_email: userEmail ?? null, category: body.category,
      title: sanitizeText(title), description: sanitizeText(description),
      page_url: isValidPageUrl(body.page_url), urgency: body.urgency ?? 'low',
      screenshot_urls: screenshotUrls, status: 'pending',
    });
    if (error) return c.json({ success: false, message: 'Gagal menyimpan feedback.' }, 500);
    return c.json({ success: true, message: 'Feedback berhasil dikirim.' }, 201);
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

feedback.get('/', authMiddleware, requireAdminRole, async (c) => {
  try {
    const { data, error } = await getSupabaseAdmin().from('feedback').select(FEEDBACK_FIELDS).order('created_at', { ascending: false });
    if (error) throw error;
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
    const { error } = await getSupabaseAdmin().from('feedback').update({ status }).eq('id', feedbackId);
    if (error) throw error;
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

    const supabase = getSupabaseAdmin();
    const { data: fb, error: fetchError } = await supabase.from('feedback').select('user_email, title').eq('id', feedbackId).single();
    if (fetchError || !fb) return c.json({ success: false, message: 'Feedback tidak ditemukan.' }, 404);

    const { error } = await supabase.from('feedback').update({
      admin_reply: sanitizeText(cleanReply), replied_at: new Date().toISOString(), status: 'in_review',
    }).eq('id', feedbackId);
    if (error) throw error;

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