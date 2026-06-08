import { getSupabaseAdmin } from '../../core/supabase';
import { writeLog }         from './audit-logger';

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

export async function saveHealthSnapshot(
  snapshot: HealthSnapshot,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<void> {
  try {
    await supabase.from('robot_health').insert({
      processed:       snapshot.processed,
      verified:        snapshot.verified,
      rejected:        snapshot.rejected,
      errors:          snapshot.errors,
      avg_duration_ms: snapshot.avg_duration_ms,
      pending_total:   snapshot.pending_total,
      error_rate:      snapshot.error_rate,
    });

    await writeLog({ action: 'health', reasons: [snapshot] }, supabase);
    console.log('[HEALTH] Snapshot tersimpan:', snapshot);
  } catch (err) {
    console.error('[HEALTH] Gagal simpan snapshot:', err);
  }
}

export async function getLatestHealth(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<HealthSnapshot | null> {
  // Dua query ini independen — jalankan paralel
  const [{ data: latest }, { count: pendingCount }] = await Promise.all([
    supabase
      .from('robot_health')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  if (!latest) return null;

  return {
    processed:       latest.processed,
    verified:        latest.verified,
    rejected:        latest.rejected,
    errors:          latest.errors,
    avg_duration_ms: latest.avg_duration_ms,
    pending_total:   pendingCount ?? 0,
    error_rate:      latest.error_rate,
    checked_at:      latest.checked_at,
  };
}

export function buildSnapshot(
  stats: { processed: number; verified: number; rejected: number; errors: number },
  durations: number[],
  pendingTotal: number
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