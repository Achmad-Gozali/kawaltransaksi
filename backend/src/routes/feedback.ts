import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { getSupabaseAdmin } from '../lib/supabase';
import { sendFeedbackReplyEmail } from '../lib/resend';
import type { Env } from '../types';

const feedback = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string };
}>();

// ── Konstanta ─────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['bug', 'feature', 'ui_ux', 'other'] as const;
const VALID_URGENCIES  = ['low', 'medium', 'high', 'critical'] as const;
const VALID_STATUSES   = ['pending', 'in_review', 'fixed', 'closed'] as const;

const LIMITS = {
  TITLE_MAX:       150,
  DESCRIPTION_MAX: 2000,
  PAGE_URL_MAX:    500,
  REPLY_MAX:       2000,
  SCREENSHOTS_MAX: 3,
  PER_DAY:         10,  // maks feedback per user per hari
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_SCREENSHOT_HOSTNAMES = [
  'xcljigqrbwtqkiuraohr.supabase.co',
  'cdn.kawaltransaksi.com',
];

// ── Helper ────────────────────────────────────────────────────────────────────

function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function isValidScreenshotUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_SCREENSHOT_HOSTNAMES.includes(parsed.hostname);
  } catch {
    return false;
  }
}

function isValidPageUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? url.trim() : null;
  } catch {
    return null;
  }
}

// ── POST /api/feedback — submit feedback baru ─────────────────────────────────

feedback.post('/', authMiddleware, async (c) => {
  try {
    const userId    = c.get('userId');
    const userEmail = c.get('userEmail');
    const body      = await c.req.json();
    const supabase  = getSupabaseAdmin(c.env);

    // ── Validasi kategori & urgensi ───────────────────────────────────────────
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return c.json({ success: false, message: 'Kategori tidak valid.' }, 400);
    }
    if (body.urgency && !VALID_URGENCIES.includes(body.urgency)) {
      return c.json({ success: false, message: 'Tingkat urgensi tidak valid.' }, 400);
    }

    // ── Validasi panjang field ────────────────────────────────────────────────
    const title = String(body.title ?? '').trim();
    const description = String(body.description ?? '').trim();

    if (!title || title.length < 5) {
      return c.json({ success: false, message: 'Judul minimal 5 karakter.' }, 400);
    }
    if (title.length > LIMITS.TITLE_MAX) {
      return c.json({ success: false, message: `Judul maks ${LIMITS.TITLE_MAX} karakter.` }, 400);
    }
    if (!description || description.length < 10) {
      return c.json({ success: false, message: 'Deskripsi minimal 10 karakter.' }, 400);
    }
    if (description.length > LIMITS.DESCRIPTION_MAX) {
      return c.json({ success: false, message: `Deskripsi maks ${LIMITS.DESCRIPTION_MAX} karakter.` }, 400);
    }

    // ── Rate limit: maks 10 feedback per user per hari ────────────────────────
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { count: todayCount } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneDayAgo);

    if ((todayCount ?? 0) >= LIMITS.PER_DAY) {
      return c.json({ success: false, message: 'Batas pengiriman feedback harian tercapai.' }, 429);
    }

    // ── Sanitasi & validasi screenshot URLs ──────────────────────────────────
    const screenshotUrls = Array.isArray(body.screenshot_urls)
      ? (body.screenshot_urls as unknown[])
          .filter(isValidScreenshotUrl)
          .slice(0, LIMITS.SCREENSHOTS_MAX) as string[]
      : [];

    const pageUrl = isValidPageUrl(body.page_url);

    // ── Insert ────────────────────────────────────────────────────────────────
    const { error } = await supabase.from('feedback').insert({
      user_id:         userId,
      user_email:      userEmail ?? null,
      category:        body.category,
      title:           sanitizeText(title),
      description:     sanitizeText(description),
      page_url:        pageUrl,
      urgency:         body.urgency ?? 'low',
      screenshot_urls: screenshotUrls,
      status:          'pending',
    });

    if (error) {
      console.error('[FEEDBACK] Insert error:', error.message);
      return c.json({ success: false, message: 'Gagal menyimpan feedback.' }, 500);
    }

    return c.json({ success: true, message: 'Feedback berhasil dikirim.' }, 201);
  } catch (err) {
    console.error('[FEEDBACK] POST error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── GET /api/feedback — ambil semua feedback (admin only) ─────────────────────

feedback.get('/', authMiddleware, async (c) => {
  try {
    const userId   = c.get('userId');
    const supabase = getSupabaseAdmin(c.env);

    // Cek role admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return c.json({ success: false, message: 'Akses ditolak.' }, 403);
    }

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ success: true, data });
  } catch (err) {
    console.error('[FEEDBACK] GET error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── PATCH /api/feedback/:id/status — update status (admin only) ───────────────

feedback.patch('/:id/status', authMiddleware, async (c) => {
  try {
    const userId     = c.get('userId');
    const feedbackId = c.req.param('id');
    const supabase   = getSupabaseAdmin(c.env);

    if (!UUID_REGEX.test(feedbackId)) {
      return c.json({ success: false, message: 'ID feedback tidak valid.' }, 400);
    }

    // Cek role admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return c.json({ success: false, message: 'Akses ditolak.' }, 403);
    }

    const { status } = await c.req.json();
    if (!status || !VALID_STATUSES.includes(status)) {
      return c.json({ success: false, message: 'Status tidak valid.' }, 400);
    }

    const { error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', feedbackId);

    if (error) throw error;
    return c.json({ success: true, message: 'Status berhasil diperbarui.' });
  } catch (err) {
    console.error('[FEEDBACK] PATCH status error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── PATCH /api/feedback/:id/reply — balas feedback (admin only) ───────────────

feedback.patch('/:id/reply', authMiddleware, async (c) => {
  try {
    const userId     = c.get('userId');
    const feedbackId = c.req.param('id');
    const supabase   = getSupabaseAdmin(c.env);

    if (!UUID_REGEX.test(feedbackId)) {
      return c.json({ success: false, message: 'ID feedback tidak valid.' }, 400);
    }

    // Cek role admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return c.json({ success: false, message: 'Akses ditolak.' }, 403);
    }

    const { reply } = await c.req.json();
    const cleanReply = String(reply ?? '').trim();

    if (!cleanReply) {
      return c.json({ success: false, message: 'Balasan tidak boleh kosong.' }, 400);
    }
    if (cleanReply.length > LIMITS.REPLY_MAX) {
      return c.json({ success: false, message: `Balasan maks ${LIMITS.REPLY_MAX} karakter.` }, 400);
    }

    // Ambil data feedback untuk kirim email
    const { data: fb, error: fetchError } = await supabase
      .from('feedback')
      .select('user_email, title')
      .eq('id', feedbackId)
      .single();

    if (fetchError || !fb) {
      return c.json({ success: false, message: 'Feedback tidak ditemukan.' }, 404);
    }

    // Update reply
    const { error } = await supabase
      .from('feedback')
      .update({
        admin_reply: sanitizeText(cleanReply),
        replied_at:  new Date().toISOString(),
        status:      'in_review',
      })
      .eq('id', feedbackId);

    if (error) throw error;

    // Kirim email notif ke user (fire-and-forget)
    if (fb.user_email && c.env.RESEND_API_KEY) {
      c.executionCtx.waitUntil(
        sendFeedbackReplyEmail({
          to:          fb.user_email,
          title:       fb.title,
          adminReply:  cleanReply,
          apiKey:      c.env.RESEND_API_KEY,
        }).catch(err => console.error('[EMAIL] Feedback reply:', err))
      );
    }

    return c.json({ success: true, message: 'Balasan berhasil dikirim.' });
  } catch (err) {
    console.error('[FEEDBACK] PATCH reply error:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default feedback;