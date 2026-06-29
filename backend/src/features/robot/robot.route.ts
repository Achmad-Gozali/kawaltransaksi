import { Hono } from 'hono';
import sql from '../../core/db';
import { scoreReport, applyVerdict, reEvaluateByNumber } from './scoring-engine';
import { checkBlacklist, runConfidenceDecay } from './blacklist-engine';
import { saveHealthSnapshot, buildSnapshot, detectAnomalies, getLatestHealth } from './health-monitor';
import { detectTrends, getViralNumbers } from './trend-detector';
import { writeLog } from './audit-logger';
import { getEnv } from '../../types';
import type { RobotReport } from './types';

const robot = new Hono();

function isInternal(c: any): boolean {
  const env = getEnv();
  return c.req.header('X-Internal-Key') === env.INTERNAL_API_KEY;
}

robot.post('/evaluate/:reportId', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const [report] = await sql`SELECT * FROM reports WHERE id = ${c.req.param('reportId')} LIMIT 1`;
  if (!report) return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);
  const result = await scoreReport(report as RobotReport);
  await applyVerdict(report as RobotReport, result, report.status);
  return c.json({ success: true, data: result });
});

robot.post('/evaluate-number/:number', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  await reEvaluateByNumber(c.req.param('number'));
  return c.json({ success: true, message: `Re-evaluasi selesai untuk nomor ${c.req.param('number')}.` });
});

robot.get('/blacklist/:number', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const result = await checkBlacklist(c.req.param('number'));
  return c.json({ success: true, data: result });
});

robot.get('/blacklist-list', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const data = await sql`SELECT * FROM blacklist ORDER BY unique_reporters DESC LIMIT 50`;
  return c.json({ success: true, data });
});

robot.get('/health', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const latest = await getLatestHealth();
  return c.json({ success: true, data: latest });
});

robot.get('/viral', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const data = await getViralNumbers();
  return c.json({ success: true, data });
});

robot.get('/logs', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const data = await sql`SELECT * FROM robot_logs ORDER BY created_at DESC LIMIT 50`;
  return c.json({ success: true, data });
});

robot.post('/run-scheduler', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const result = await runScheduler();
  return c.json({ success: true, data: result });
});

robot.post('/run-decay', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const result = await runConfidenceDecay();
  await writeLog({ action: 'decay', reasons: [result] }).catch(() => {});
  return c.json({ success: true, data: result });
});

robot.post('/run-trends', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  const result = await detectTrends();
  return c.json({ success: true, data: result });
});

robot.post('/backfill', async (c) => {
  if (!isInternal(c)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);

  const stats = { processed: 0, verified: 0, rejected: 0, skipped: 0, errors: 0 };

  const reports = await sql`
    SELECT * FROM reports
    WHERE status = 'verified' AND robot_status = 'pending'
    ORDER BY created_at ASC
  `;

  if (!reports.length)
    return c.json({ success: true, message: 'Tidak ada laporan yang perlu diproses.', data: stats });

  for (const report of reports) {
    try {
      const result = await scoreReport(report as RobotReport);
      await applyVerdict(report as RobotReport, result, report.status);
      stats.processed++;
      if (result.verdict === 'verified') stats.verified++;
      if (result.verdict === 'rejected') stats.rejected++;
      if (result.verdict === 'pending')  stats.skipped++;
    } catch (err) {
      console.error(`[BACKFILL] Error evaluasi ${report.id}:`, err);
      stats.errors++;
      await writeLog({ action: 'evaluate', report_id: report.id, error: String(err) }).catch(() => {});
    }
  }

  await writeLog({ action: 'scheduler', reasons: [{ ...stats, source: 'backfill' }] }).catch(() => {});
  console.log('[BACKFILL] Selesai:', stats);
  return c.json({ success: true, data: stats });
});

export async function runScheduler(): Promise<{ processed: number; verified: number; rejected: number; errors: number; alerts: string[] }> {
  const stats     = { processed: 0, verified: 0, rejected: 0, errors: 0 };
  const durations: number[] = [];

  const [{ count: pendingTotal }] = await sql`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`;

  const pendingReports = await sql`
    SELECT * FROM reports
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 50
  `;

  for (const report of pendingReports) {
    const start = Date.now();
    try {
      const result = await scoreReport(report as RobotReport);
      await applyVerdict(report as RobotReport, result, report.status);
      stats.processed++;
      if (result.verdict === 'verified') stats.verified++;
      if (result.verdict === 'rejected') stats.rejected++;
      durations.push(Date.now() - start);
    } catch (err) {
      console.error(`[ROBOT] Error evaluasi ${report.id}:`, err);
      stats.errors++;
      await writeLog({ action: 'evaluate', report_id: report.id, error: String(err) }).catch(() => {});
    }
  }

  const snapshot = buildSnapshot(stats, durations, parseInt(pendingTotal ?? '0'));
  await saveHealthSnapshot(snapshot);

  const alerts = detectAnomalies(snapshot);
  if (alerts.length) console.warn('[HEALTH] Anomali:', alerts);

  await writeLog({ action: 'scheduler', reasons: [{ ...stats, alerts }] }).catch(() => {});
  console.log('[ROBOT] Scheduler selesai:', stats);
  return { ...stats, alerts };
}

export default robot;