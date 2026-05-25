// ============================================
//  LOKASI: backend/src/features/robot/appeal-system.ts
// ============================================

import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { getSupabaseAdmin } from '../../core/supabase';
import { scoreReport, applyVerdict } from './scoring-engine';
import { sendReportStatusChangedEmail } from '../../core/resend';
import { writeLog } from './audit-logger';
import type { RobotReport } from './types';
import type { Env } from '../../types';

const appeal = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string };
}>();

const UUID_REGEX        = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const APPEAL_WINDOW_DAYS = 7;
const MIN_REASON_LENGTH  = 50;
const MAX_EVIDENCE_FILES = 5;

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

// -- POST /api/appeals -- ajukan banding ---------------------------------------

appeal.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { reportId, reason, evidence_urls, loss_amount } = await c.req.json();

    if (!reportId || !UUID_REGEX.test(reportId))
      return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);
    if (!reason || typeof reason !== 'string' || reason.trim().length < MIN_REASON_LENGTH)
      return c.json({ success: false, message: `Alasan banding minimal ${MIN_REASON_LENGTH} karakter.` }, 400);

    // Validasi evidence_urls kalau ada
    const newEvidenceUrls = sanitizeEvidenceUrls(evidence_urls);

    // Validasi loss_amount kalau ada
    const newLossAmount = loss_amount ? Number(loss_amount) : null;
    if (newLossAmount !== null && (isNaN(newLossAmount) || newLossAmount < 1000 || newLossAmount > 999_999_999_999))
      return c.json({ success: false, message: 'Nominal kerugian tidak valid.' }, 400);

    const supabase = getSupabaseAdmin(c.env);

    // Cek laporan milik user & statusnya rejected
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, status, reporter_id, target_number, robot_verdict_at, evidence_urls, loss_amount, chronology')
      .eq('id', reportId)
      .eq('reporter_id', userId)
      .single();

    if (fetchError || !report)
      return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);
    if (report.status !== 'rejected')
      return c.json({ success: false, message: 'Hanya laporan yang ditolak yang dapat diajukan banding.' }, 400);

    // Cek window 7 hari
    if (report.robot_verdict_at) {
      const verdictAge = (Date.now() - new Date(report.robot_verdict_at).getTime()) / 86400000;
      if (verdictAge > APPEAL_WINDOW_DAYS)
        return c.json({ success: false, message: `Batas waktu banding ${APPEAL_WINDOW_DAYS} hari sudah lewat.` }, 400);
    }

    // Cek apakah sudah pernah banding
    const { data: existing } = await supabase
      .from('report_appeals')
      .select('id, status')
      .eq('report_id', reportId)
      .single();

    if (existing)
      return c.json({ success: false, message: 'Kamu sudah pernah mengajukan banding untuk laporan ini.' }, 409);

    // Gabungkan evidence_urls lama + baru
    const existingEvidence  = Array.isArray(report.evidence_urls) ? report.evidence_urls : [];
    const mergedEvidence    = [...new Set([...existingEvidence, ...newEvidenceUrls])].slice(0, 10);

    // Update laporan dengan data baru sebelum re-evaluate
    const updateData: Record<string, unknown> = {
      status:       'pending', // reset ke pending dulu
      robot_status: 'pending',
    };
    if (mergedEvidence.length > 0) {
      updateData.evidence_urls = mergedEvidence;
      updateData.evidence_url  = mergedEvidence[0];
    }
    if (newLossAmount !== null) {
      updateData.loss_amount = newLossAmount;
    }
    // Gabungkan kronologi lama + alasan banding
    updateData.chronology = `${report.chronology}\n\n[BANDING] ${reason.trim()}`;

    await supabase.from('reports').update(updateData).eq('id', reportId);

    // Simpan appeal
    const { error } = await supabase.from('report_appeals').insert({
      report_id:     reportId,
      user_id:       userId,
      reason:        reason.trim(),
      evidence_urls: newEvidenceUrls,
      loss_amount:   newLossAmount,
      status:        'pending',
    });

    if (error) throw error;

    // Robot langsung re-evaluate dengan data yang sudah diupdate
    c.executionCtx.waitUntil((async () => {
      try {
        const { data: freshReport } = await supabase
          .from('reports').select('*').eq('id', reportId).single();

        if (freshReport) {
          const result = await scoreReport(freshReport as RobotReport, supabase);

          // Untuk appeal, threshold lebih rendah: 45 sudah cukup untuk verified
          const appealVerdict = result.score >= 45 ? 'verified' : result.verdict;

          if (appealVerdict === 'verified') {
            await supabase.from('reports').update({ status: 'verified' }).eq('id', reportId);
            await supabase.from('report_appeals').update({
              status:      'approved',
              reviewed_at: new Date().toISOString(),
            }).eq('report_id', reportId);

            await writeLog({ action: 'verdict', report_id: reportId, verdict: 'verified (appeal)', score: result.score }, supabase).catch(() => {});

            const { data: profile } = await supabase
              .from('profiles').select('full_name, email').eq('id', userId).single();
            if (profile?.email) {
              await sendReportStatusChangedEmail({
                to:           profile.email,
                fullName:     profile.full_name ?? 'Pengguna',
                targetNumber: report.target_number,
                newStatus:    'verified',
                reportUrl:    `https://kawaltransaksi.com/dashboard/laporan/${reportId}`,
                apiKey:       c.env.RESEND_API_KEY,
              }).catch(() => {});
            }
          } else {
            await supabase.from('reports').update({ status: 'rejected' }).eq('id', reportId);
            await supabase.from('report_appeals').update({
              status:      'rejected',
              reviewed_at: new Date().toISOString(),
            }).eq('report_id', reportId);

            await writeLog({ action: 'verdict', report_id: reportId, verdict: 'appeal rejected', score: result.score }, supabase).catch(() => {});
          }
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

// -- GET /api/appeals/:reportId -- status banding -------------------------------

appeal.get('/:reportId', authMiddleware, async (c) => {
  try {
    const userId   = c.get('userId');
    const reportId = c.req.param('reportId');

    if (!UUID_REGEX.test(reportId))
      return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);

    const supabase = getSupabaseAdmin(c.env);
    const { data, error } = await supabase
      .from('report_appeals')
      .select('id, status, reason, evidence_urls, loss_amount, reviewed_at, created_at')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .single();

    if (error || !data)
      return c.json({ success: false, message: 'Banding tidak ditemukan.' }, 404);

    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default appeal;