import { Hono } from 'hono';
import { getSupabaseAdmin } from '../../core/supabase';
import { scoreReport, applyVerdict, reEvaluateByNumber } from './scoring-engine';
import { checkBlacklist, runConfidenceDecay } from './blacklist-engine';
import { saveHealthSnapshot, buildSnapshot, detectAnomalies, getLatestHealth } from './health-monitor';
import { detectTrends, getViralNumbers } from './trend-detector';
import { writeLog } from './audit-logger';
import type { RobotReport } from './types';
import type { Env } from '../../types';

const robot = new Hono<{ Bindings: Env }>();

function isInternal(c: { req: { header: (k: string) => string | undefined }; env: Env }): boolean {
  return c.req.header('X-Internal-Key') === (c.get('env') as any).INTERNAL_API_KEY;
}

robot.post('/evaluate/:reportId', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const supabase = getSupabaseAdmin(c.env);
  const { data: report, error } = await supabase
    .from('reports').select('*').eq('id', c.req.param('reportId')).single();
  if (error || !report) return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);
  const result = await scoreReport(report as RobotReport, supabase);
  await applyVerdict(report as RobotReport, result, supabase, report.status);
  return c.json({ success: true, data: result });
});

robot.post('/evaluate-number/:number', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  await reEvaluateByNumber(c.req.param('number'), getSupabaseAdmin(c.env));
  return c.json({ success: true, message: `Re-evaluasi selesai untuk nomor ${c.req.param('number')}.` });
});

robot.get('/blacklist/:number', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const result = await checkBlacklist(c.req.param('number'), getSupabaseAdmin(c.env));
  return c.json({ success: true, data: result });
});

robot.get('/blacklist-list', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const { data } = await getSupabaseAdmin(c.env)
    .from('blacklist')
    .select('*')
    .order('unique_reporters', { ascending: false })
    .limit(50);
  return c.json({ success: true, data: data ?? [] });
});

robot.get('/health', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const latest = await getLatestHealth(getSupabaseAdmin(c.env));
  return c.json({ success: true, data: latest });
});

robot.get('/viral', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const data = await getViralNumbers(getSupabaseAdmin(c.env));
  return c.json({ success: true, data });
});

robot.get('/logs', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const { data } = await getSupabaseAdmin(c.env)
    .from('robot_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return c.json({ success: true, data: data ?? [] });
});

robot.post('/run-scheduler', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const result = await runScheduler(getSupabaseAdmin(c.env));
  return c.json({ success: true, data: result });
});

robot.post('/run-decay', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const supabase = getSupabaseAdmin(c.env);
  const result   = await runConfidenceDecay(supabase);
  await writeLog({ action: 'decay', reasons: [result] }, supabase).catch(() => {});
  return c.json({ success: true, data: result });
});

robot.post('/run-trends', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const result = await detectTrends(getSupabaseAdmin(c.env));
  return c.json({ success: true, data: result });
});

robot.post('/backfill', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);

  const supabase = getSupabaseAdmin(c.env);
  const stats = { processed: 0, verified: 0, rejected: 0, skipped: 0, errors: 0 };

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('status', 'verified')
    .eq('robot_status', 'pending')
    .order('created_at', { ascending: true });

  if (!reports?.length)
    return c.json({ success: true, message: 'Tidak ada laporan yang perlu diproses.', data: stats });

  for (const report of reports) {
    try {
      const result = await scoreReport(report as RobotReport, supabase);
      await applyVerdict(report as RobotReport, result, supabase, report.status);
      stats.processed++;
      if (result.verdict === 'verified') stats.verified++;
      if (result.verdict === 'rejected') stats.rejected++;
      if (result.verdict === 'pending')  stats.skipped++;
    } catch (err) {
      console.error(`[BACKFILL] Error evaluasi ${report.id}:`, err);
      stats.errors++;
      await writeLog({ action: 'evaluate', report_id: report.id, error: String(err) }, supabase).catch(() => {});
    }
  }

  await writeLog({ action: 'scheduler', reasons: [{ ...stats, source: 'backfill' }] }, supabase).catch(() => {});
  console.log('[BACKFILL] Selesai:', stats);
  return c.json({ success: true, data: stats });
});

export async function runScheduler(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<{ processed: number; verified: number; rejected: number; errors: number; alerts: string[] }> {
  const stats     = { processed: 0, verified: 0, rejected: 0, errors: 0 };
  const durations: number[] = [];

  const { count: pendingTotal } = await supabase
    .from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending');

  const { data: pendingReports } = await supabase
    .from('reports').select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  if (pendingReports?.length) {
    for (const report of pendingReports) {
      const start = Date.now();
      try {
        const result = await scoreReport(report as RobotReport, supabase);
        await applyVerdict(report as RobotReport, result, supabase, report.status);
        stats.processed++;
        if (result.verdict === 'verified') stats.verified++;
        if (result.verdict === 'rejected') stats.rejected++;
        durations.push(Date.now() - start);
      } catch (err) {
        console.error(`[ROBOT] Error evaluasi ${report.id}:`, err);
        stats.errors++;
        await writeLog({ action: 'evaluate', report_id: report.id, error: String(err) }, supabase).catch(() => {});
      }
    }
  }

  const snapshot = buildSnapshot(stats, durations, pendingTotal ?? 0);
  await saveHealthSnapshot(snapshot, supabase);

  const alerts = detectAnomalies(snapshot);
  if (alerts.length) console.warn('[HEALTH] Anomali:', alerts);

  await writeLog({ action: 'scheduler', reasons: [{ ...stats, alerts }] }, supabase).catch(() => {});
  console.log('[ROBOT] Scheduler selesai:', stats);
  return { ...stats, alerts };
}

export default robot;