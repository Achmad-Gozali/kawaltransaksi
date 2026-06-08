import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { getSupabaseAdmin } from '../../core/supabase';
import { verifyTurnstile } from '../../core/turnstile';
import {
  sendReportCreatedEmail,
  sendNewReportAdminEmail,
  sendReportStatusChangedEmail,
} from '../../core/resend';
import { scoreReport, applyVerdict, reEvaluateByNumber } from '../robot/scoring-engine';
import { isBlocked, recordRejection } from '../robot/auto-blocker';
import type { RobotReport } from '../robot/types';
import type { Env } from '../../types';

const reports = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string };
}>();

// -- Konstanta ----------------------------------------------------------------

const LIMITS = {
  TARGET_NUMBER:       32,
  TARGET_NAME:         100,
  BANK_NAME:           100,
  PLATFORM:            100,
  LINK_URL:            500,
  CATEGORY:            100,
  CHRONOLOGY_MIN:      20,
  CHRONOLOGY_MAX:      5000,
  SOCIAL_ACCOUNT:      100,
  SOCIAL_ACCOUNTS_COUNT: 10,
  LOSS_AMOUNT_MAX:     999_999_999_999,
  STORE_NAME:          150,
};

const ALLOWED_STORAGE_HOSTNAMES = [
  'xcljigqrbwtqkiuraohr.supabase.co',
  'cdn.kawaltransaksi.com',
];

const MAX_EVIDENCE_FILES = 10;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_TARGET_TYPES = ['phone', 'bank_account', 'ewallet'] as const;
const DASHBOARD_LAPORAN_URL = 'https://kawaltransaksi.com/dashboard/laporan';

const VALID_PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau',
  'Jambi', 'Bengkulu', 'Sumatera Selatan', 'Kepulauan Bangka Belitung',
  'Lampung', 'Banten', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah',
  'DI Yogyakarta', 'Jawa Timur', 'Bali', 'Nusa Tenggara Barat',
  'Nusa Tenggara Timur', 'Kalimantan Barat', 'Kalimantan Tengah',
  'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat',
  'Sulawesi Selatan', 'Sulawesi Tenggara', 'Maluku', 'Maluku Utara',
  'Papua Barat', 'Papua Barat Daya', 'Papua', 'Papua Pegunungan',
  'Papua Selatan', 'Papua Tengah',
] as const;

// -- Types --------------------------------------------------------------------

// FIX: ganti any dengan interface yang proper
interface TargetNumberItem {
  number: string;
  type:   string;
  bank:   string | null;
  name:   string | null;
}

// -- Helpers ------------------------------------------------------------------

const sanitizeText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').trim();

const sanitizeChronology = (s: string) =>
  s.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '').trim();

const sanitizeArray = (arr: string[]) => arr.map(sanitizeText).filter(Boolean);

function isValidEvidenceUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const p = new URL(url);
    return p.protocol === 'https:' && ALLOWED_STORAGE_HOSTNAMES.includes(p.hostname);
  } catch { return false; }
}

function sanitizeEvidenceUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.filter(isValidEvidenceUrl).slice(0, MAX_EVIDENCE_FILES) as string[];
}

function isValidHttpUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const p = new URL(url);
    return ['http:', 'https:'].includes(p.protocol) ? url.trim() : null;
  } catch { return null; }
}

async function checkReportRateLimit(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string
): Promise<{ blocked: boolean; reason?: string }> {
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const { data, error } = await supabase
    .from('reports').select('created_at')
    .eq('reporter_id', userId).gte('created_at', oneDayAgo)
    .order('created_at', { ascending: false });

  if (error) return { blocked: false };

  const now      = Date.now();
  const hourCount = (data ?? []).filter(r => new Date(r.created_at).getTime() >= now - 3600000).length;
  const dayCount  = (data ?? []).length;

  if (hourCount >= 3) return { blocked: true, reason: 'Terlalu banyak laporan dalam 1 jam. Coba lagi nanti.' };
  if (dayCount  >= 10) return { blocked: true, reason: 'Batas laporan harian tercapai.' };
  return { blocked: false };
}

async function sendStatusEmail(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  targetNumber: string,
  reportId: string,
  newStatus: 'pending' | 'verified' | 'rejected' | 'withdrawn',
  resendApiKey: string
) {
  try {
    const { data: profile } = await supabase
      .from('profiles').select('full_name, email').eq('id', userId).single();
    if (!profile?.email) return;
    await sendReportStatusChangedEmail({
      to:           profile.email,
      fullName:     profile.full_name ?? 'Pengguna',
      targetNumber,
      newStatus,
      reportUrl:    `${DASHBOARD_LAPORAN_URL}/${reportId}`,
      apiKey:       resendApiKey,
    });
  } catch (err) {
    console.error('[EMAIL] Gagal kirim status email:', err);
  }
}

// -- Validation ---------------------------------------------------------------

function validateReportBody(body: Record<string, unknown>): string | null {
  const fieldChecks: [unknown, number, string][] = [
    [body.target_number, LIMITS.TARGET_NUMBER, 'Nomor'],
    [body.target_name,   LIMITS.TARGET_NAME,   'Nama pemilik'],
    [body.bank_name,     LIMITS.BANK_NAME,     'Nama bank'],
    [body.platform,      LIMITS.PLATFORM,      'Nama platform'],
    [body.link_url,      LIMITS.LINK_URL,      'URL'],
    [body.store_name,    LIMITS.STORE_NAME,    'Nama toko'],
  ];
  for (const [val, max, label] of fieldChecks)
    if (val && String(val).length > max)
      return `${label} terlalu panjang. Maks ${max} karakter.`;

  const categoryRaw = String(body.category ?? '').trim();
  if (!categoryRaw)                              return 'Kategori wajib diisi.';
  if (categoryRaw.length > LIMITS.CATEGORY)      return `Kategori terlalu panjang. Maks ${LIMITS.CATEGORY} karakter.`;

  const chronologyRaw = String(body.chronology ?? '');
  if (chronologyRaw.trim().length < LIMITS.CHRONOLOGY_MIN) return `Kronologi minimal ${LIMITS.CHRONOLOGY_MIN} karakter.`;
  if (chronologyRaw.length > LIMITS.CHRONOLOGY_MAX)        return `Kronologi terlalu panjang. Maks ${LIMITS.CHRONOLOGY_MAX} karakter.`;

  if (body.loss_amount && Number(body.loss_amount) > LIMITS.LOSS_AMOUNT_MAX)
    return 'Nominal kerugian tidak valid.';

  if (body.suspect_city && !VALID_PROVINCES.includes(body.suspect_city as never))
    return 'Provinsi tidak valid.';

  if (Array.isArray(body.social_media_accounts)) {
    if (body.social_media_accounts.length > LIMITS.SOCIAL_ACCOUNTS_COUNT)
      return `Maksimal ${LIMITS.SOCIAL_ACCOUNTS_COUNT} akun media sosial.`;
    if (body.social_media_accounts.some((s: unknown) => typeof s === 'string' && s.length > LIMITS.SOCIAL_ACCOUNT))
      return `Akun media sosial terlalu panjang. Maks ${LIMITS.SOCIAL_ACCOUNT} karakter.`;
  }

  return null;
}

// -- POST /api/reports --------------------------------------------------------

reports.post('/', authMiddleware, async (c) => {
  try {
    const userId   = c.get('userId');
    const ip       = c.req.header('CF-Connecting-IP') || 'anonymous';
    const body     = await c.req.json();
    const supabase = getSupabaseAdmin(c.env);

    if (c.env.LIMITER) {
      const [userBlock, ipBlock] = await Promise.all([
        isBlocked(userId, c.env.LIMITER),
        isBlocked(ip, c.env.LIMITER),
      ]);
      if (userBlock.blocked || ipBlock.blocked)
        return c.json({ success: false, message: 'Akun Anda telah diblokir sementara karena aktivitas mencurigakan.' }, 403);
    }

    if (!body.turnstile_token)
      return c.json({ success: false, message: 'Verifikasi CAPTCHA diperlukan.' }, 400);
    if (!await verifyTurnstile(body.turnstile_token, c.env.TURNSTILE_SECRET_KEY))
      return c.json({ success: false, message: 'Verifikasi CAPTCHA gagal.' }, 400);

    const validationError = validateReportBody(body);
    if (validationError)
      return c.json({ success: false, message: validationError }, 400);

    if (!body.target_type || !VALID_TARGET_TYPES.includes(body.target_type))
      return c.json({ success: false, message: 'Jenis laporan tidak valid.' }, 400);

    const rateLimit = await checkReportRateLimit(supabase, userId);
    if (rateLimit.blocked)
      return c.json({ success: false, message: rateLimit.reason }, 429);

    const cleanNumber = String(body.target_number).replace(/[^0-9]/g, '');
    const { count: dupCount } = await supabase
      .from('reports').select('*', { count: 'exact', head: true })
      .eq('reporter_id', userId).eq('target_number', cleanNumber).neq('status', 'withdrawn');
    if ((dupCount ?? 0) > 0)
      return c.json({ success: false, message: 'Kamu sudah pernah melaporkan nomor ini sebelumnya.' }, 409);

    const chronologyRaw = String(body.chronology ?? '');
    const categoryClean = sanitizeText(String(body.category ?? '').trim());
    const evidenceUrls  = sanitizeEvidenceUrls(
      body.evidence_urls?.length > 0 ? body.evidence_urls : body.evidence_url ? [body.evidence_url] : []
    );

    // FIX: ganti any dengan TargetNumberItem
    const cleanTargetNumbers: TargetNumberItem[] = (Array.isArray(body.target_numbers) ? body.target_numbers : [])
      .map((item: unknown): TargetNumberItem | null => {
        if (typeof item === 'object' && item !== null && 'number' in item) {
          const obj = item as { number: string; type?: string; bank?: string; name?: string };
          const num = String(obj.number).replace(/[^0-9]/g, '');
          if (!num || num.length > LIMITS.TARGET_NUMBER) return null;
          return { number: num, type: obj.type ?? 'phone', bank: obj.bank ?? null, name: obj.name ?? null };
        }
        const num = String(item).replace(/[^0-9]/g, '');
        if (!num || num.length > LIMITS.TARGET_NUMBER) return null;
        return { number: num, type: 'phone', bank: null, name: null };
      })
      .filter((item: TargetNumberItem | null): item is TargetNumberItem => item !== null)
      .slice(0, 5);

    if (!cleanTargetNumbers.some((t: TargetNumberItem) => t.number === cleanNumber)) {
      cleanTargetNumbers.unshift({
        number: cleanNumber,
        type:   body.target_type ?? 'phone',
        bank:   body.bank_name ?? null,
        name:   body.target_name ? sanitizeText(String(body.target_name)) : null,
      });
    }

    const { data: inserted, error } = await supabase
      .from('reports')
      .insert({
        reporter_id:           userId,
        target_number:         cleanNumber,
        target_name:           body.target_name ? sanitizeText(String(body.target_name)) : null,
        target_type:           body.target_type,
        category:              categoryClean,
        chronology:            sanitizeChronology(chronologyRaw),
        evidence_url:          evidenceUrls[0] || null,
        evidence_urls:         evidenceUrls,
        status:                'pending',
        bank_name:             body.bank_name ? sanitizeText(String(body.bank_name)) : null,
        loss_amount:           body.loss_amount || null,
        incident_date:         body.incident_date || null,
        platform:              body.platform ? sanitizeText(String(body.platform)) : null,
        link_url:              isValidHttpUrl(body.link_url),
        social_media_accounts: body.social_media_accounts ? sanitizeArray(body.social_media_accounts) : [],
        has_other_victims:     body.has_other_victims || null,
        reported_to:           body.reported_to ?? [],
        suspect_photo_url:     isValidEvidenceUrl(body.suspect_photo_url) ? body.suspect_photo_url : null,
        target_numbers:        cleanTargetNumbers,
        store_name:            body.store_name ? sanitizeText(String(body.store_name)) : null,
        suspect_city:          body.suspect_city ? sanitizeText(String(body.suspect_city)) : null,
      })
      .select('id')
      .single();

    if (error || !inserted) {
      console.error('[REPORTS] Insert error:', error?.message);
      return c.json({ success: false, message: 'Gagal menyimpan laporan.' }, 500);
    }

    const reportId = inserted.id;

    c.executionCtx.waitUntil((async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles').select('full_name, email').eq('id', userId).single();
        const { data: freshReport } = await supabase
          .from('reports').select('*').eq('id', reportId).single();

        if (freshReport) {
          const result = await scoreReport(freshReport as RobotReport, supabase);
          await applyVerdict(reportId, result, supabase);

          if (result.verdict === 'rejected' && c.env.LIMITER)
            await recordRejection(userId, ip, c.env.LIMITER);

          await reEvaluateByNumber(cleanNumber, supabase);
        }

        await Promise.all([
          profile?.email && sendReportCreatedEmail({
            to:           profile.email,
            fullName:     profile.full_name ?? 'Pengguna',
            targetNumber: cleanNumber,
            category:     categoryClean,
            apiKey:       c.env.RESEND_API_KEY,
          }).catch(err => console.error('[EMAIL] User:', err)),
          c.env.ADMIN_EMAIL && sendNewReportAdminEmail({
            adminEmail:   c.env.ADMIN_EMAIL,
            reporterName: profile?.full_name ?? 'Pengguna',
            targetNumber: cleanNumber,
            category:     categoryClean,
            status:       'pending',
            reportUrl:    'https://kawaltransaksi.com/admin',
            apiKey:       c.env.RESEND_API_KEY,
          }).catch(err => console.error('[EMAIL] Admin:', err)),
        ]);
      } catch (err) {
        console.error('[REPORTS] Background error:', err);
      }
    })());

    return c.json({ success: true, slug: cleanNumber, status: 'pending' }, 201);
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// -- POST /api/reports/withdraw -----------------------------------------------

reports.post('/withdraw', authMiddleware, async (c) => {
  try {
    const userId       = c.get('userId');
    const { reportId } = await c.req.json();

    if (!reportId || !UUID_REGEX.test(reportId))
      return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);

    const supabase = getSupabaseAdmin(c.env);
    const { data: report, error: fetchError } = await supabase
      .from('reports').select('id, status, reporter_id, target_number')
      .eq('id', reportId).eq('reporter_id', userId).single();

    if (fetchError || !report)
      return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);
    if (report.status === 'withdrawn')
      return c.json({ success: false, message: 'Laporan sudah dalam status revisi.' }, 400);

    const { error } = await supabase
      .from('reports').update({ status: 'withdrawn' })
      .eq('id', reportId).eq('reporter_id', userId);
    if (error) throw error;

    c.executionCtx.waitUntil(
      sendStatusEmail(supabase, userId, report.target_number, reportId, 'withdrawn', c.env.RESEND_API_KEY)
    );

    return c.json({ success: true, message: 'Laporan berhasil ditarik.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// -- PUT /api/reports/:reportId -----------------------------------------------

reports.put('/:reportId', authMiddleware, async (c) => {
  try {
    const userId   = c.get('userId');
    const reportId = c.req.param('reportId');

    if (!UUID_REGEX.test(reportId))
      return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);

    const body = await c.req.json();
    const validationError = validateReportBody(body);
    if (validationError)
      return c.json({ success: false, message: validationError }, 400);

    const supabase = getSupabaseAdmin(c.env);
    const { data: report, error: fetchError } = await supabase
      .from('reports').select('id, status, reporter_id, target_number')
      .eq('id', reportId).eq('reporter_id', userId).single();

    if (fetchError || !report)
      return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);
    if (report.status !== 'withdrawn')
      return c.json({ success: false, message: 'Hanya laporan "Sedang Direvisi" yang dapat diedit.' }, 400);

    const editedEvidenceUrls = sanitizeEvidenceUrls(body.evidence_urls);

    const { error } = await supabase
      .from('reports')
      .update({
        target_name:           body.target_name ? sanitizeText(String(body.target_name)) : null,
        category:              sanitizeText(String(body.category ?? '').trim()),
        chronology:            sanitizeChronology(String(body.chronology ?? '')),
        bank_name:             body.bank_name ? sanitizeText(String(body.bank_name)) : null,
        loss_amount:           body.loss_amount || null,
        incident_date:         body.incident_date || null,
        platform:              body.platform ? sanitizeText(String(body.platform)) : null,
        link_url:              isValidHttpUrl(body.link_url),
        social_media_accounts: body.social_media_accounts ? sanitizeArray(body.social_media_accounts) : [],
        has_other_victims:     body.has_other_victims || null,
        reported_to:           body.reported_to ?? [],
        evidence_urls:         editedEvidenceUrls,
        evidence_url:          editedEvidenceUrls[0] || null,
        suspect_photo_url:     isValidEvidenceUrl(body.suspect_photo_url) ? body.suspect_photo_url : null,
        store_name:            body.store_name ? sanitizeText(String(body.store_name)) : null,
        suspect_city:          body.suspect_city ? sanitizeText(String(body.suspect_city)) : null,
        status:                'pending',
        robot_score:           0,
        robot_status:          'pending',
        robot_verdict_at:      null,
        robot_reasons:         [],
      })
      .eq('id', reportId).eq('reporter_id', userId);
    if (error) throw error;

    c.executionCtx.waitUntil((async () => {
      try {
        const { data: freshReport } = await supabase
          .from('reports').select('*').eq('id', reportId).single();
        if (freshReport) {
          const result = await scoreReport(freshReport as RobotReport, supabase);
          await applyVerdict(reportId, result, supabase);
        }
        await sendStatusEmail(supabase, userId, report.target_number, reportId, 'pending', c.env.RESEND_API_KEY);
      } catch (err) {
        console.error('[REPORTS] Background resubmit error:', err);
      }
    })());

    return c.json({ success: true, message: 'Laporan berhasil diperbarui.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// -- GET /api/reports/check-number/:number ------------------------------------

reports.get('/check-number/:number', async (c) => {
  try {
    const number = c.req.param('number').replace(/[^0-9]/g, '');
    if (!number || number.length < 6)
      return c.json({ success: false, message: 'Nomor tidak valid.' }, 400);

    const supabase = getSupabaseAdmin(c.env);
    const { count: totalReports } = await supabase
      .from('reports').select('id', { count: 'exact', head: true })
      .eq('target_number', number).neq('status', 'withdrawn');

    if (!totalReports || totalReports === 0)
      return c.json({ success: true, data: { exists: false, totalReports: 0 } });

    const { data: blacklist } = await supabase
      .from('blacklist').select('level').eq('target_number', number).single();

    return c.json({
      success: true,
      data: { exists: true, totalReports: totalReports ?? 0, level: blacklist?.level ?? null },
    });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan.' }, 500);
  }
});

export default reports;