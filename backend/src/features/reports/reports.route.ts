import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { verifyTurnstile } from '../../core/turnstile';
import { sendReportCreatedEmail, sendNewReportAdminEmail } from '../../core/resend';
import { scoreReport, applyVerdict, reEvaluateByNumber } from '../robot/scoring-engine';
import { isBlocked, recordRejection } from '../robot/auto-blocker';
import sql from '../../core/db';
import type { RobotReport } from '../robot/types';

const reports = new Hono<{
  Variables: { userId: string; userEmail: string; userRole: string };
}>();

const LIMITS = {
  TARGET_NUMBER:         32,
  TARGET_NAME:           100,
  BANK_NAME:             100,
  PLATFORM:              100,
  LINK_URL:              500,
  CATEGORY:              100,
  CHRONOLOGY_MIN:        20,
  CHRONOLOGY_MAX:        5000,
  SOCIAL_ACCOUNT:        100,
  SOCIAL_ACCOUNTS_COUNT: 10,
  LOSS_AMOUNT_MAX:       999_999_999_999,
  STORE_NAME:            150,
};

const ALLOWED_STORAGE_HOSTNAMES = [
  'xcljigqrbwtqkiuraohr.supabase.co',
  'cdn.kawaltransaksi.com',
];

const MAX_EVIDENCE_FILES = 10;
const VALID_TARGET_TYPES = ['phone', 'bank_account', 'ewallet'] as const;

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

interface TargetNumberItem {
  number: string;
  type:   string;
  bank:   string | null;
  name:   string | null;
}

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

async function checkReportRateLimit(userId: string): Promise<{ blocked: boolean; reason?: string }> {
  const now        = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
  const oneDayAgo  = new Date(now.getTime() - 86400000).toISOString();

  const [[{ count: hourCount }], [{ count: dayCount }]] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM reports WHERE reporter_id = ${userId} AND created_at >= ${oneHourAgo}`,
    sql`SELECT COUNT(*) as count FROM reports WHERE reporter_id = ${userId} AND created_at >= ${oneDayAgo}`,
  ]);

  if (parseInt(hourCount) >= 3) return { blocked: true, reason: 'Terlalu banyak laporan dalam 1 jam. Coba lagi nanti.' };
  if (parseInt(dayCount) >= 10) return { blocked: true, reason: 'Batas laporan harian tercapai.' };
  return { blocked: false };
}

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
  if (!categoryRaw)                         return 'Kategori wajib diisi.';
  if (categoryRaw.length > LIMITS.CATEGORY) return `Kategori terlalu panjang. Maks ${LIMITS.CATEGORY} karakter.`;

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

function buildTargetNumbers(body: Record<string, unknown>, cleanNumber: string): TargetNumberItem[] {
  const items: TargetNumberItem[] = (Array.isArray(body.target_numbers) ? body.target_numbers : [])
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

  if (!items.some(t => t.number === cleanNumber)) {
    items.unshift({
      number: cleanNumber,
      type:   body.target_type as string ?? 'phone',
      bank:   body.bank_name as string ?? null,
      name:   body.target_name ? sanitizeText(String(body.target_name)) : null,
    });
  }

  return items;
}

reports.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const ip     = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'anonymous';
    const body   = await c.req.json();

    const [userBlock, ipBlock] = await Promise.all([
      isBlocked(userId),
      isBlocked(ip),
    ]);
    if (userBlock.blocked || ipBlock.blocked)
      return c.json({ success: false, message: 'Akun Anda telah diblokir sementara karena aktivitas mencurigakan.' }, 403);

    if (!body.turnstile_token)
      return c.json({ success: false, message: 'Verifikasi CAPTCHA diperlukan.' }, 400);
    if (!await verifyTurnstile(body.turnstile_token, process.env.TURNSTILE_SECRET_KEY!))
      return c.json({ success: false, message: 'Verifikasi CAPTCHA gagal.' }, 400);

    const validationError = validateReportBody(body);
    if (validationError)
      return c.json({ success: false, message: validationError }, 400);

    if (!body.target_type || !VALID_TARGET_TYPES.includes(body.target_type))
      return c.json({ success: false, message: 'Jenis laporan tidak valid.' }, 400);

    const rateLimit = await checkReportRateLimit(userId);
    if (rateLimit.blocked)
      return c.json({ success: false, message: rateLimit.reason }, 429);

    const cleanNumber = String(body.target_number).replace(/[^0-9]/g, '');
    const [{ count: dupCount }] = await sql`
      SELECT COUNT(*) as count FROM reports
      WHERE reporter_id = ${userId} AND target_number = ${cleanNumber} AND status != 'withdrawn'
    `;
    if (parseInt(dupCount) > 0)
      return c.json({ success: false, message: 'Kamu sudah pernah melaporkan nomor ini sebelumnya.' }, 409);

    const categoryClean = sanitizeText(String(body.category ?? '').trim());
    const evidenceUrls  = sanitizeEvidenceUrls(
      body.evidence_urls?.length > 0 ? body.evidence_urls : body.evidence_url ? [body.evidence_url] : []
    );

    const [inserted] = await sql`
      INSERT INTO reports (
        reporter_id, target_number, target_name, target_type, category,
        chronology, evidence_url, evidence_urls, status, bank_name,
        loss_amount, incident_date, platform, link_url, social_media_accounts,
        has_other_victims, reported_to, suspect_photo_url, target_numbers,
        store_name, suspect_city
      ) VALUES (
        ${userId},
        ${cleanNumber},
        ${body.target_name ? sanitizeText(String(body.target_name)) : null},
        ${body.target_type},
        ${categoryClean},
        ${sanitizeChronology(String(body.chronology ?? ''))},
        ${evidenceUrls[0] || null},
        ${evidenceUrls},
        'pending',
        ${body.bank_name ? sanitizeText(String(body.bank_name)) : null},
        ${body.loss_amount || null},
        ${body.incident_date || null},
        ${body.platform ? sanitizeText(String(body.platform)) : null},
        ${isValidHttpUrl(body.link_url)},
        ${body.social_media_accounts ? sanitizeArray(body.social_media_accounts) : []},
        ${body.has_other_victims || null},
        ${body.reported_to ?? []},
        ${isValidEvidenceUrl(body.suspect_photo_url) ? body.suspect_photo_url : null},
        ${JSON.stringify(buildTargetNumbers(body, cleanNumber))},
        ${body.store_name ? sanitizeText(String(body.store_name)) : null},
        ${body.suspect_city ? sanitizeText(String(body.suspect_city)) : null}
      )
      RETURNING id
    `;

    if (!inserted) {
      console.error('[REPORTS] Insert error');
      return c.json({ success: false, message: 'Gagal menyimpan laporan.' }, 500);
    }

    const reportId = inserted.id;

    Promise.resolve().then(() => (async () => {
      try {
        const [[profile], [freshReport]] = await Promise.all([
          sql`SELECT full_name, email FROM profiles WHERE id = ${userId} LIMIT 1`,
          sql`SELECT * FROM reports WHERE id = ${reportId} LIMIT 1`,
        ]);

        if (freshReport) {
          const result = await scoreReport(freshReport as RobotReport);
          await Promise.all([
            applyVerdict(freshReport as RobotReport, result, freshReport.status),
            reEvaluateByNumber(cleanNumber),
          ]);
          if (result.verdict === 'rejected')
            await recordRejection(userId, ip);
        }

        await Promise.all([
          profile?.email
            ? sendReportCreatedEmail({
                to:           profile.email,
                fullName:     profile.full_name ?? 'Pengguna',
                targetNumber: cleanNumber,
                category:     categoryClean,
                apiKey:       process.env.RESEND_API_KEY!,
              }).catch(err => console.error('[EMAIL] User:', err))
            : Promise.resolve(),
          process.env.ADMIN_EMAIL
            ? sendNewReportAdminEmail({
                adminEmail:   process.env.ADMIN_EMAIL,
                reporterName: profile?.full_name ?? 'Pengguna',
                targetNumber: cleanNumber,
                category:     categoryClean,
                status:       'pending',
                reportUrl:    'https://kawaltransaksi.com/admin',
                apiKey:       process.env.RESEND_API_KEY!,
              }).catch(err => console.error('[EMAIL] Admin:', err))
            : Promise.resolve(),
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

reports.get('/check-number/:number', async (c) => {
  try {
    const number = c.req.param('number').replace(/[^0-9]/g, '');
    if (!number || number.length < 6)
      return c.json({ success: false, message: 'Nomor tidak valid.' }, 400);

    const [[{ count: totalReports }], [blacklist]] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM reports WHERE target_number = ${number} AND status != 'withdrawn'`,
      sql`SELECT level FROM blacklist WHERE target_number = ${number} LIMIT 1`,
    ]);

    if (parseInt(totalReports) === 0)
      return c.json({ success: true, data: { exists: false, totalReports: 0 } });

    return c.json({
      success: true,
      data: { exists: true, totalReports: parseInt(totalReports), level: blacklist?.level ?? null },
    });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan.' }, 500);
  }
});

reports.get('/public/stats', async (c) => {
  try {
    const [[totRow], [verRow], [lossRow]] = await Promise.all([
      sql`SELECT COUNT(*) AS count FROM reports WHERE status != 'rejected'`,
      sql`SELECT COUNT(*) AS count FROM reports WHERE status = 'verified'`,
      sql`SELECT COALESCE(SUM(loss_amount), 0) AS total FROM reports WHERE status != 'rejected'`,
    ]);

    return c.json({
      success: true,
      data: {
        total:     parseInt(totRow.count),
        verified:  parseInt(verRow.count),
        totalLoss: parseInt(lossRow.total),
      },
    });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil statistik.' }, 500);
  }
});

reports.get('/public/recent', async (c) => {
  try {
    const rows = await sql`
      SELECT id, target_number, target_name, target_type, bank_name, category, created_at, status
      FROM reports
      WHERE status != 'rejected'
      ORDER BY created_at DESC
      LIMIT 6
    `;

    return c.json({ success: true, data: rows });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil laporan terkini.' }, 500);
  }
});

reports.get('/public/stats-nomor', async (c) => {
  try {
    const [data] = await sql`SELECT * FROM get_stats_nomor()`;
    return c.json({
      success: true,
      data: {
        totalLaporan:  parseInt(data?.total_laporan  ?? 0),
        totalNomor:    parseInt(data?.total_nomor    ?? 0),
        totalKerugian: parseInt(data?.total_kerugian ?? 0),
      },
    });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil statistik.' }, 500);
  }
});

reports.get('/public/stats-rekening', async (c) => {
  try {
    const [data] = await sql`SELECT * FROM get_stats_rekening()`;
    return c.json({
      success: true,
      data: {
        totalLaporan:  parseInt(data?.total_laporan  ?? 0),
        totalRekening: parseInt(data?.total_rekening ?? 0),
        totalKerugian: parseInt(data?.total_kerugian ?? 0),
      },
    });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil statistik.' }, 500);
  }
});

reports.get('/public/leaderboard-nomor', async (c) => {
  try {
    const rows = await sql`SELECT * FROM get_leaderboard_nomor()`;
    return c.json({ success: true, data: rows });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil leaderboard.' }, 500);
  }
});

reports.get('/public/leaderboard-rekening', async (c) => {
  try {
    const rows = await sql`SELECT * FROM get_leaderboard_rekening()`;
    return c.json({ success: true, data: rows });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil leaderboard.' }, 500);
  }
});

reports.get('/public/check/:number', async (c) => {
  try {
    const number = c.req.param('number').replace(/[^0-9]/g, '');
    if (!number || number.length < 5)
      return c.json({ success: false, message: 'Nomor tidak valid.' }, 400);

    const [data] = await sql`SELECT get_check_page_data(${number}) AS result`;
    return c.json({ success: true, data: data.result });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil data.' }, 500);
  }
});

reports.get('/public/blacklist/:number', async (c) => {
  try {
    const number = c.req.param('number').replace(/[^0-9]/g, '');
    if (!number) return c.json({ success: false, message: 'Nomor tidak valid.' }, 400);

    const [blacklist] = await sql`
      SELECT level, total_reports, unique_reporters
      FROM blacklist WHERE target_number = ${number} LIMIT 1
    `;
    const [trend] = await sql`
      SELECT is_viral, report_count
      FROM robot_trends WHERE target_number = ${number} LIMIT 1
    `;

    return c.json({
      success: true,
      data: {
        blacklist: blacklist ?? null,
        trend:     trend     ?? null,
      },
    });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil data.' }, 500);
  }
});

reports.get('/public/ewallet/:wallet', async (c) => {
  try {
    const wallet = c.req.param('wallet');
    if (!wallet) return c.json({ success: false, message: 'Wallet tidak valid.' }, 400);

    const primary = await sql`
      SELECT target_number, target_name, status, created_at
      FROM reports
      WHERE bank_name ILIKE ${'%' + wallet + '%'}
      AND status NOT IN ('rejected', 'withdrawn')
      ORDER BY created_at DESC
    `;

    const linked = await sql`
      SELECT target_numbers, status, created_at
      FROM reports
      WHERE target_numbers @> ${JSON.stringify([{ type: 'ewallet', bank: wallet }])}::jsonb
      AND status NOT IN ('rejected', 'withdrawn')
      ORDER BY created_at DESC
    `;

    return c.json({ success: true, data: { primary, linked } });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil data.' }, 500);
  }
});

reports.get('/public/bank/:bank', async (c) => {
  try {
    const bank = c.req.param('bank');
    if (!bank) return c.json({ success: false, message: 'Bank tidak valid.' }, 400);

    const primary = await sql`
      SELECT target_number, target_name, status, created_at
      FROM reports
      WHERE bank_name ILIKE ${'%' + bank + '%'}
      AND status NOT IN ('rejected', 'withdrawn')
      ORDER BY created_at DESC
    `;

    const linked = await sql`
      SELECT target_numbers, status, created_at
      FROM reports
      WHERE target_numbers @> ${JSON.stringify([{ type: 'bank_account', bank: bank }])}::jsonb
      AND status NOT IN ('rejected', 'withdrawn')
      ORDER BY created_at DESC
    `;

    return c.json({ success: true, data: { primary, linked } });
  } catch {
    return c.json({ success: false, message: 'Gagal mengambil data.' }, 500);
  }
});

export default reports;