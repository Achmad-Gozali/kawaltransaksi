import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { getSupabaseAdmin } from '../../core/supabase';
import { scoreReport, applyVerdict } from './scoring-engine';
import { sendReportStatusChangedEmail } from '../../core/resend';
import { writeLog } from './audit-logger';
import { getEnv } from '../../types';
import sql from '../../core/db';
import type { RobotReport } from './types';

const appeal = new Hono();

const UUID_REGEX          = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const APPEAL_WINDOW_HOURS = 23;
const MIN_REASON_LENGTH   = 50;
const MAX_EVIDENCE_FILES  = 5;

const ALLOWED_STORAGE_HOSTNAMES = [
  'xcljigqrbwtqkiuraohr.supabase.co',
  'cdn.kawaltransaksi.com',
];

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

appeal.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { reportId, reason, evidence_urls, loss_amount } = await c.req.json();

    if (!reportId || !UUID_REGEX.test(reportId))
      return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);
    if (!reason || typeof reason !== 'string' || reason.trim().length < MIN_REASON_LENGTH)
      return c.json({ success: false, message: `Alasan banding minimal ${MIN_REASON_LENGTH} karakter.` }, 400);

    const newEvidenceUrls = sanitizeEvidenceUrls(evidence_urls);
    const newLossAmount   = loss_amount ? Number(loss_amount) : null;
    if (newLossAmount !== null && (isNaN(newLossAmount) || newLossAmount < 1000 || newLossAmount > 999_999_999_999))
      return c.json({ success: false, message: 'Nominal kerugian tidak valid.' }, 400);

    const [report] = await sql`
      SELECT id, status, reporter_id, target_number, robot_verdict_at,
             evidence_urls, evidence_url, loss_amount, chronology,
             created_at, incident_date, has_other_victims
      FROM reports
      WHERE id = ${reportId} AND reporter_id = ${userId}
      LIMIT 1
    `;

    if (!report)
      return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);
    if (report.status !== 'rejected')
      return c.json({ success: false, message: 'Hanya laporan yang ditolak yang dapat diajukan banding.' }, 400);

    if (report.robot_verdict_at) {
      const verdictAgeHours = (Date.now() - new Date(report.robot_verdict_at).getTime()) / 3600000;
      if (verdictAgeHours > APPEAL_WINDOW_HOURS)
        return c.json({ success: false, message: `Batas waktu banding ${APPEAL_WINDOW_HOURS} jam sudah lewat.` }, 400);
    }

    const [existing] = await sql`
      SELECT id, status FROM report_appeals WHERE report_id = ${reportId} LIMIT 1
    `;

    if (existing)
      return c.json({ success: false, message: 'Kamu sudah pernah mengajukan banding untuk laporan ini.' }, 409);

    const existingEvidence  = Array.isArray(report.evidence_urls) ? report.evidence_urls : [];
    const mergedEvidence    = [...new Set([...existingEvidence, ...newEvidenceUrls])].slice(0, 10);
    const updatedChronology = `${report.chronology}\n\n[BANDING] ${reason.trim()}`;

    if (mergedEvidence.length > 0) {
      await sql`
        UPDATE reports SET
          status        = 'pending',
          robot_status  = 'pending',
          chronology    = ${updatedChronology},
          evidence_urls = ${mergedEvidence},
          evidence_url  = ${mergedEvidence[0]}
          ${newLossAmount !== null ? sql`, loss_amount = ${newLossAmount}` : sql``}
        WHERE id = ${reportId}
      `;
    } else {
      await sql`
        UPDATE reports SET
          status       = 'pending',
          robot_status = 'pending',
          chronology   = ${updatedChronology}
          ${newLossAmount !== null ? sql`, loss_amount = ${newLossAmount}` : sql``}
        WHERE id = ${reportId}
      `;
    }

    await sql`
      INSERT INTO report_appeals (report_id, user_id, reason, evidence_urls, loss_amount, status)
      VALUES (${reportId}, ${userId}, ${reason.trim()}, ${newEvidenceUrls}, ${newLossAmount}, 'pending')
    `;

    const freshReport: RobotReport = {
      id:                report.id,
      reporter_id:       report.reporter_id,
      target_number:     report.target_number,
      status:            'pending',
      created_at:        report.created_at,
      incident_date:     report.incident_date,
      has_other_victims: report.has_other_victims,
      loss_amount:       newLossAmount ?? report.loss_amount,
      evidence_urls:     mergedEvidence.length > 0 ? mergedEvidence : report.evidence_urls,
      evidence_url:      mergedEvidence[0] ?? report.evidence_url ?? null,
      chronology:        updatedChronology,
    };

    Promise.resolve().then(() => (async () => {
      try {
        const result = await scoreReport(freshReport).catch((err) => {
          console.error(err);
          return null;
        });
        if (!result) return;

        const appealVerdict = result.score >= 45 ? 'verified' : result.verdict;

        if (appealVerdict === 'verified') {
          await sql`UPDATE reports SET status = 'verified' WHERE id = ${reportId}`;
          await sql`
            UPDATE report_appeals SET status = 'approved', reviewed_at = ${new Date().toISOString()}
            WHERE report_id = ${reportId}
          `;

          await writeLog({ action: 'verdict', report_id: reportId, verdict: 'verified (appeal)', score: result.score }).catch(() => {});

          const [profile] = await sql`SELECT full_name, email FROM profiles WHERE id = ${userId} LIMIT 1`;
          if (profile?.email) {
            const env = getEnv();
            await sendReportStatusChangedEmail({
              to:           profile.email,
              fullName:     profile.full_name ?? 'Pengguna',
              targetNumber: report.target_number,
              newStatus:    'verified',
              reportUrl:    `https://kawaltransaksi.com/dashboard/laporan/${reportId}`,
              apiKey:       env.RESEND_API_KEY,
            }).catch(() => {});
          }
        } else {
          await sql`UPDATE reports SET status = 'rejected' WHERE id = ${reportId}`;
          await sql`
            UPDATE report_appeals SET status = 'rejected', reviewed_at = ${new Date().toISOString()}
            WHERE report_id = ${reportId}
          `;
          await writeLog({ action: 'verdict', report_id: reportId, verdict: 'appeal rejected', score: result.score }).catch(() => {});
        }
      } catch (err) {
        console.error('[APPEAL] Background error:', err);
      }
    })());

    return c.json({ success: true, message: 'Banding berhasil diajukan. Laporan akan ditinjau ulang.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

appeal.get('/:reportId', authMiddleware, async (c) => {
  try {
    const userId   = c.get('userId');
    const reportId = c.req.param('reportId');

    if (!UUID_REGEX.test(reportId))
      return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);

    const [data] = await sql`
      SELECT id, status, reason, evidence_urls, loss_amount, reviewed_at, created_at
      FROM report_appeals
      WHERE report_id = ${reportId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (!data)
      return c.json({ success: false, message: 'Banding tidak ditemukan.' }, 404);

    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default appeal;