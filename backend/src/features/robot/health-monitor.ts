import sql from '../../core/db';
import { writeLog } from './audit-logger';

export interface HealthSnapshot {
  processed:       number;
  verified:        number;
  rejected:        number;
  errors:          number;
  avg_duration_ms: number;
  pending_total:   number;
  error_rate:      number;
  checked_at?:     string;
}

export async function saveHealthSnapshot(snapshot: HealthSnapshot): Promise<void> {
  try {
    await sql`
      INSERT INTO robot_health (processed, verified, rejected, errors, avg_duration_ms, pending_total, error_rate)
      VALUES (
        ${snapshot.processed},
        ${snapshot.verified},
        ${snapshot.rejected},
        ${snapshot.errors},
        ${snapshot.avg_duration_ms},
        ${snapshot.pending_total},
        ${snapshot.error_rate}
      )
    `;

    await writeLog({ action: 'health', reasons: [snapshot] });
    console.log('[HEALTH] Snapshot tersimpan:', snapshot);
  } catch (err) {
    console.error('[HEALTH] Gagal simpan snapshot:', err);
  }
}

export async function getLatestHealth(): Promise<HealthSnapshot | null> {
  const [latest, [{ count: pendingCount }]] = await Promise.all([
    sql`
      SELECT * FROM robot_health
      ORDER BY checked_at DESC
      LIMIT 1
    `,
    sql`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`,
  ]);

  if (!latest.length) return null;
  const data = latest[0];

  return {
    processed:       data.processed,
    verified:        data.verified,
    rejected:        data.rejected,
    errors:          data.errors,
    avg_duration_ms: data.avg_duration_ms,
    pending_total:   parseInt(pendingCount),
    error_rate:      data.error_rate,
    checked_at:      data.checked_at,
  };
}

export function buildSnapshot(
  stats: { processed: number; verified: number; rejected: number; errors: number },
  durations: number[],
  pendingTotal: number,
): HealthSnapshot {
  const avg_duration_ms = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const error_rate = stats.processed > 0
    ? parseFloat(((stats.errors / stats.processed) * 100).toFixed(2))
    : 0;

  return { ...stats, avg_duration_ms, pending_total: pendingTotal, error_rate };
}

export function detectAnomalies(snapshot: HealthSnapshot): string[] {
  const alerts: string[] = [];

  if (snapshot.error_rate > 10)
    alerts.push(`[!] Error rate tinggi: ${snapshot.error_rate}%`);
  if (snapshot.pending_total > 200)
    alerts.push(`[!] Queue pending menumpuk: ${snapshot.pending_total} laporan`);
  if (snapshot.avg_duration_ms > 5000)
    alerts.push(`[!] Robot lambat: rata-rata ${snapshot.avg_duration_ms}ms per laporan`);

  return alerts;
}