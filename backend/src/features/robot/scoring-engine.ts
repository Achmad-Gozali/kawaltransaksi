// ============================================
//  LOKASI: backend/src/features/robot/scoring-engine.ts
// ============================================

import { getSupabaseAdmin } from '../../core/supabase';
import { updateBlacklist } from './blacklist-engine';
import { writeLog } from './audit-logger';
import type { RobotReport, ScoringResult, ScoringReason, RobotVerdict } from './types';

const VERDICT_THRESHOLD = { VERIFIED: 60, PENDING: 30 };

function getVerdict(score: number): RobotVerdict {
  if (score >= VERDICT_THRESHOLD.VERIFIED) return 'verified';
  if (score >= VERDICT_THRESHOLD.PENDING)  return 'pending';
  return 'rejected';
}

export async function scoreReport(
  report: RobotReport,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<ScoringResult> {
  const reasons: ScoringReason[] = [];
  let score = 0;

  const add = (rule: string, points: number, detail: string) => {
    if (points === 0) return;
    score += points;
    reasons.push({ rule, points, detail });
  };

  // RULE 1: Jumlah pelapor unik
  const { count: uniqueReporters } = await supabase
    .from('reports')
    .select('reporter_id', { count: 'exact', head: true })
    .eq('target_number', report.target_number)
    .neq('reporter_id', report.reporter_id ?? '')
    .neq('status', 'withdrawn');

  const rc = uniqueReporters ?? 0;
  if (rc >= 10)     add('multiple_reporters', 40, `${rc} orang berbeda melaporkan nomor ini`);
  else if (rc >= 5) add('multiple_reporters', 25, `${rc} orang berbeda melaporkan nomor ini`);
  else if (rc >= 3) add('multiple_reporters', 15, `${rc} orang berbeda melaporkan nomor ini`);
  else if (rc >= 1) add('multiple_reporters',  8, `${rc} orang lain melaporkan nomor ini`);

  // RULE 2: Bukti foto
  const evidenceCount = (report.evidence_urls ?? []).length || (report.evidence_url ? 1 : 0);
  if (evidenceCount >= 3)      add('evidence', 20, `${evidenceCount} bukti foto dilampirkan`);
  else if (evidenceCount >= 2) add('evidence', 15, `${evidenceCount} bukti foto dilampirkan`);
  else if (evidenceCount >= 1) add('evidence', 10, '1 bukti foto dilampirkan');
  else                         add('evidence', -10, 'Tidak ada bukti foto');

  // RULE 3: Panjang kronologi
  const chronLen = report.chronology?.trim().length ?? 0;
  if (chronLen >= 500)      add('chronology_length', 15, `Kronologi sangat detail (${chronLen} karakter)`);
  else if (chronLen >= 200) add('chronology_length', 10, `Kronologi cukup detail (${chronLen} karakter)`);
  else if (chronLen >= 100) add('chronology_length',  5, `Kronologi singkat (${chronLen} karakter)`);
  else                      add('chronology_length', -5, `Kronologi terlalu singkat (${chronLen} karakter)`);

  // RULE 4: Spam check
  const spamPatterns = ['test', 'aaa', 'asd', '123', 'xxx', 'tes aja', 'coba'];
  const isSpam = spamPatterns.some(p => report.chronology?.toLowerCase().includes(p)) && chronLen < 50;
  if (isSpam) add('spam_content', -30, 'Kronologi terdeteksi spam');

  // RULE 5: Umur akun pelapor
  if (report.reporter_id) {
    const { data: profile } = await supabase
      .from('profiles').select('created_at').eq('id', report.reporter_id).single();

    if (profile?.created_at) {
      const ageDays = (Date.now() - new Date(profile.created_at).getTime()) / 86400000;
      if (ageDays >= 90)      add('account_age', 10, 'Akun pelapor berusia > 90 hari');
      else if (ageDays >= 30) add('account_age',  7, 'Akun pelapor berusia > 30 hari');
      else if (ageDays >= 7)  add('account_age',  3, 'Akun pelapor berusia > 7 hari');
      else                    add('account_age', -5, 'Akun pelapor baru (< 7 hari)');
    }

    // RULE 6: Histori laporan user
    const { count: prevVerified } = await supabase.from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', report.reporter_id).eq('status', 'verified').neq('id', report.id);
    const { count: prevRejected } = await supabase.from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', report.reporter_id).eq('status', 'rejected').neq('id', report.id);

    if ((prevVerified ?? 0) > 0)       add('reporter_history',  5, `Pelapor punya ${prevVerified} laporan verified`);
    if ((prevRejected ?? 0) >= 3)      add('reporter_history', -15, `Pelapor punya ${prevRejected} laporan rejected`);
    else if ((prevRejected ?? 0) >= 1) add('reporter_history',  -5, `Pelapor punya ${prevRejected} laporan rejected`);
  }

  // RULE 7: Nominal kerugian
  if (report.loss_amount) {
    if (report.loss_amount < 1000)          add('loss_amount', -10, 'Nominal kerugian tidak masuk akal');
    else if (report.loss_amount >= 100_000) add('loss_amount',   5, `Nominal Rp ${report.loss_amount.toLocaleString('id-ID')}`);
  }

  // RULE 8: Tanggal kejadian
  if (report.incident_date) {
    const diffDays = (new Date(report.created_at).getTime() - new Date(report.incident_date).getTime()) / 86400000;
    if (diffDays < 0)        add('incident_date', -15, 'Tanggal kejadian di masa depan');
    else if (diffDays <= 7)  add('incident_date',   5, 'Laporan dibuat dalam 7 hari kejadian');
    else if (diffDays <= 30) add('incident_date',   3, 'Laporan dibuat dalam 30 hari kejadian');
    else if (diffDays > 180) add('incident_date',  -5, 'Jarak kejadian > 6 bulan');
  }

  // RULE 9: Trending hari ini
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase.from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('target_number', report.target_number)
    .gte('created_at', todayStart.toISOString());
  if ((todayCount ?? 0) >= 5) add('trending', 5, `${todayCount} laporan hari ini untuk nomor ini`);

  // RULE 10: Ada korban lain
  if (report.has_other_victims === 'yes') add('other_victims', 5, 'Pelapor menyatakan ada korban lain');

  const finalScore = Math.max(0, Math.min(100, score));
  const verdict    = getVerdict(finalScore);

  // [AUDIT] Log hasil scoring
  await writeLog({
    action:    'evaluate',
    report_id: report.id,
    verdict,
    score:     finalScore,
    reasons,
  }, supabase).catch(() => {});

  return { score: finalScore, verdict, reasons };
}

export async function applyVerdict(
  reportId: string,
  result: ScoringResult,
  supabase: ReturnType<typeof getSupabaseAdmin>,
  existingStatus?: string  // <- status laporan sebelum robot evaluasi
): Promise<void> {
  const updateData: Record<string, unknown> = {
    robot_score:      result.score,
    robot_status:     result.verdict,
    robot_verdict_at: new Date().toISOString(),
    robot_reasons:    result.reasons,
  };

  // Kalau robot verdict 'verified' -> upgrade status ke verified
  if (result.verdict === 'verified') {
    updateData.status = 'verified';
  }

  // Kalau robot verdict 'rejected' -> HANYA reject kalau belum verified manual
  // Jangan downgrade laporan yang udah diverifikasi manusia
  if (result.verdict === 'rejected' && existingStatus !== 'verified') {
    updateData.status = 'rejected';
  }

  // Kalau robot verdict 'pending' -> status laporan TIDAK diubah (biarkan existing)

  const { data: report } = await supabase
    .from('reports').update(updateData).eq('id', reportId).select('target_number').single();

  // [AUDIT] Log verdict
  await writeLog({
    action:    'verdict',
    report_id: reportId,
    verdict:   result.verdict,
    score:     result.score,
  }, supabase).catch(() => {});

  // [BLACKLIST] Update blacklist kalau verified
  if (result.verdict === 'verified' && report?.target_number) {
    await updateBlacklist(report.target_number, supabase).catch(err =>
      console.error('[BLACKLIST] Error update:', err)
    );
    await writeLog({ action: 'blacklist', report_id: reportId }, supabase).catch(() => {});
  }
}

export async function reEvaluateByNumber(
  targetNumber: string,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<void> {
  const { data: relatedReports } = await supabase
    .from('reports').select('*')
    .eq('target_number', targetNumber)
    .in('status', ['pending', 'verified'])
    .neq('robot_status', 'verified');

  if (!relatedReports?.length) return;

  for (const report of relatedReports) {
    const result = await scoreReport(report as RobotReport, supabase);
    await applyVerdict(report.id, result, supabase, report.status);  // <- pass existing status
  }
}