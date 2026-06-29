import sql from '../../core/db';
import { updateBlacklist } from './blacklist-engine';
import { writeLog, LogBatcher } from './audit-logger';
import { recordRejection } from './auto-blocker';
import type { RobotReport, ScoringResult, ScoringReason, RobotVerdict } from './types';

const VERDICT_THRESHOLD = { VERIFIED: 60, PENDING: 30 };
const SPAM_PATTERNS = ['test', 'aaa', 'asd', '123', 'xxx', 'tes aja', 'coba'];

function getVerdict(score: number): RobotVerdict {
  if (score >= VERDICT_THRESHOLD.VERIFIED) return 'verified';
  if (score >= VERDICT_THRESHOLD.PENDING)  return 'pending';
  return 'rejected';
}

export async function scoreReport(
  report: RobotReport,
  batcher?: LogBatcher,
): Promise<ScoringResult> {
  const reasons: ScoringReason[] = [];
  let score = 0;

  const add = (rule: string, points: number, detail: string) => {
    if (points === 0) return;
    score += points;
    reasons.push({ rule, points, detail });
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    uniqueReportersResult,
    todayCountResult,
    profileResult,
    prevVerifiedResult,
    prevRejectedResult,
  ] = await Promise.all([
    sql`
      SELECT COUNT(DISTINCT reporter_id) as count FROM reports
      WHERE target_number = ${report.target_number}
        AND reporter_id != ${report.reporter_id ?? ''}
        AND status != 'withdrawn'
    `,
    sql`
      SELECT COUNT(*) as count FROM reports
      WHERE target_number = ${report.target_number}
        AND created_at >= ${todayStart.toISOString()}
    `,
    report.reporter_id
      ? sql`SELECT created_at FROM profiles WHERE id = ${report.reporter_id} LIMIT 1`
      : Promise.resolve([]),
    report.reporter_id
      ? sql`
          SELECT COUNT(*) as count FROM reports
          WHERE reporter_id = ${report.reporter_id}
            AND status = 'verified'
            AND id != ${report.id}
        `
      : Promise.resolve([{ count: '0' }]),
    report.reporter_id
      ? sql`
          SELECT COUNT(*) as count FROM reports
          WHERE reporter_id = ${report.reporter_id}
            AND status = 'rejected'
            AND id != ${report.id}
        `
      : Promise.resolve([{ count: '0' }]),
  ]);

  const rc = parseInt(uniqueReportersResult[0]?.count ?? '0');
  if      (rc >= 10) add('multiple_reporters', 40, `${rc} orang berbeda melaporkan nomor ini`);
  else if (rc >= 5)  add('multiple_reporters', 25, `${rc} orang berbeda melaporkan nomor ini`);
  else if (rc >= 3)  add('multiple_reporters', 15, `${rc} orang berbeda melaporkan nomor ini`);
  else if (rc >= 1)  add('multiple_reporters',  8, `${rc} orang lain melaporkan nomor ini`);

  const evidenceCount = (report.evidence_urls ?? []).length || (report.evidence_url ? 1 : 0);
  if      (evidenceCount >= 3) add('evidence', 20, `${evidenceCount} bukti foto dilampirkan`);
  else if (evidenceCount >= 2) add('evidence', 15, `${evidenceCount} bukti foto dilampirkan`);
  else if (evidenceCount >= 1) add('evidence', 10, '1 bukti foto dilampirkan');
  else                         add('evidence', -10, 'Tidak ada bukti foto');

  const chronLen = report.chronology?.trim().length ?? 0;
  if      (chronLen >= 500) add('chronology_length', 15, `Kronologi sangat detail (${chronLen} karakter)`);
  else if (chronLen >= 200) add('chronology_length', 10, `Kronologi cukup detail (${chronLen} karakter)`);
  else if (chronLen >= 100) add('chronology_length',  5, `Kronologi singkat (${chronLen} karakter)`);
  else                      add('chronology_length', -5, `Kronologi terlalu singkat (${chronLen} karakter)`);

  const isSpam = SPAM_PATTERNS.some(p => report.chronology?.toLowerCase().includes(p)) && chronLen < 50;
  if (isSpam) add('spam_content', -30, 'Kronologi terdeteksi spam');

  const profile = profileResult[0];
  if (profile?.created_at) {
    const ageDays = (Date.now() - new Date(profile.created_at).getTime()) / 86400000;
    if      (ageDays >= 90) add('account_age', 10, 'Akun pelapor berusia > 90 hari');
    else if (ageDays >= 30) add('account_age',  7, 'Akun pelapor berusia > 30 hari');
    else if (ageDays >= 7)  add('account_age',  3, 'Akun pelapor berusia > 7 hari');
    else                    add('account_age', -5, 'Akun pelapor baru (< 7 hari)');
  }

  const prevVerified = parseInt(prevVerifiedResult[0]?.count ?? '0');
  const prevRejected = parseInt(prevRejectedResult[0]?.count ?? '0');

  if (prevVerified > 0)       add('reporter_history',   5, `Pelapor punya ${prevVerified} laporan verified`);
  if (prevRejected >= 3)      add('reporter_history', -15, `Pelapor punya ${prevRejected} laporan rejected`);
  else if (prevRejected >= 1) add('reporter_history',  -5, `Pelapor punya ${prevRejected} laporan rejected`);

  if (report.loss_amount) {
    if      (report.loss_amount < 1000)     add('loss_amount', -10, 'Nominal kerugian tidak masuk akal');
    else if (report.loss_amount >= 100_000) add('loss_amount',   5, `Nominal Rp ${report.loss_amount.toLocaleString('id-ID')}`);
  }

  if (report.incident_date) {
    const diffDays = (new Date(report.created_at).getTime() - new Date(report.incident_date).getTime()) / 86400000;
    if      (diffDays < 0)   add('incident_date', -15, 'Tanggal kejadian di masa depan');
    else if (diffDays <= 7)  add('incident_date',   5, 'Laporan dibuat dalam 7 hari kejadian');
    else if (diffDays <= 30) add('incident_date',   3, 'Laporan dibuat dalam 30 hari kejadian');
    else if (diffDays > 180) add('incident_date',  -5, 'Jarak kejadian > 6 bulan');
  }

  const todayCount = parseInt(todayCountResult[0]?.count ?? '0');
  if (todayCount >= 5) add('trending', 5, `${todayCount} laporan hari ini untuk nomor ini`);
  if (report.has_other_victims === 'yes') add('other_victims', 5, 'Pelapor menyatakan ada korban lain');

  const finalScore = Math.max(0, Math.min(100, score));
  const verdict    = getVerdict(finalScore);

  const logEntry = { action: 'evaluate' as const, report_id: report.id, verdict, score: finalScore, reasons };
  if (batcher) batcher.add(logEntry);
  else await writeLog(logEntry).catch(() => {});

  return { score: finalScore, verdict, reasons };
}

export async function applyVerdict(
  report: Pick<RobotReport, 'id' | 'target_number' | 'reporter_id'>,
  result: ScoringResult,
  existingStatus?: string,
  options?: { ip?: string; batcher?: LogBatcher },
): Promise<void> {
  const now = new Date().toISOString();

  if (result.verdict === 'verified') {
    await sql`
      UPDATE reports SET
        robot_score      = ${result.score},
        robot_status     = ${result.verdict},
        robot_verdict_at = ${now},
        robot_reasons    = ${JSON.stringify(result.reasons)},
        status           = 'verified'
      WHERE id = ${report.id}
    `;
  } else if (result.verdict === 'rejected' && existingStatus !== 'verified') {
    await sql`
      UPDATE reports SET
        robot_score      = ${result.score},
        robot_status     = ${result.verdict},
        robot_verdict_at = ${now},
        robot_reasons    = ${JSON.stringify(result.reasons)},
        status           = 'rejected'
      WHERE id = ${report.id}
    `;
  } else {
    await sql`
      UPDATE reports SET
        robot_score      = ${result.score},
        robot_status     = ${result.verdict},
        robot_verdict_at = ${now},
        robot_reasons    = ${JSON.stringify(result.reasons)}
      WHERE id = ${report.id}
    `;
  }

  const verdictLog = { action: 'verdict' as const, report_id: report.id, verdict: result.verdict, score: result.score };
  if (options?.batcher) options.batcher.add(verdictLog);
  else await writeLog(verdictLog).catch(() => {});

  if (result.verdict === 'verified' && report.target_number) {
    await updateBlacklist(report.target_number).catch(err =>
      console.error('[BLACKLIST] Error update:', err)
    );
    const blacklistLog = { action: 'blacklist' as const, report_id: report.id };
    if (options?.batcher) options.batcher.add(blacklistLog);
    else await writeLog(blacklistLog).catch(() => {});
  }

  if (result.verdict === 'rejected' && existingStatus !== 'verified') {
    const ip         = options?.ip ?? 'unknown';
    const reporterId = report.reporter_id ?? null;
    if (reporterId || ip !== 'unknown') {
      Promise.resolve(
        recordRejection(reporterId, ip)
      ).catch(err => console.error('[AUTO-BLOCKER] recordRejection error:', err));
    }
  }
}

export async function reEvaluateByNumber(targetNumber: string): Promise<void> {
  const relatedReports = await sql`
    SELECT * FROM reports
    WHERE target_number = ${targetNumber}
      AND status IN ('pending', 'verified')
      AND robot_status != 'verified'
  `;

  if (!relatedReports.length) return;

  const batcher = new LogBatcher();
  for (const report of relatedReports) {
    const result = await scoreReport(report as RobotReport, batcher);
    await applyVerdict(report as RobotReport, result, report.status, { batcher });
  }
  await batcher.flush();
}