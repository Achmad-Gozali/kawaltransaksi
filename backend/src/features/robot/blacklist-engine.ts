import { getSupabaseAdmin } from '../../core/supabase';

type BlacklistLevel = 'medium' | 'high' | 'critical';

const MIN_UNIQUE_REPORTERS = 2;

function getLevel(uniqueReporters: number): BlacklistLevel {
  if (uniqueReporters >= 20) return 'critical';
  if (uniqueReporters >= 10) return 'high';
  return 'medium';
}

export async function updateBlacklist(
  targetNumber: string,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<void> {
  const { data: stats } = await supabase
    .from('reports')
    .select('reporter_id')
    .eq('target_number', targetNumber)
    .eq('status', 'verified');

  if (!stats?.length) return;

  const totalReports    = stats.length;
  const uniqueReporters = new Set(stats.map(r => r.reporter_id).filter(Boolean)).size;

  if (uniqueReporters < MIN_UNIQUE_REPORTERS) return;

  const level = getLevel(uniqueReporters);

  await supabase.from('blacklist').upsert({
    target_number:    targetNumber,
    level,
    total_reports:    totalReports,
    unique_reporters: uniqueReporters,
    last_reported_at: new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'target_number' });

  console.log(`[BLACKLIST] ${targetNumber} -> ${level} (${uniqueReporters} reporters)`);
}

export async function removeFromBlacklist(
  targetNumber: string,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<void> {
  const { count } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('target_number', targetNumber)
    .eq('status', 'verified');

  if ((count ?? 0) === 0) {
    await supabase.from('blacklist').delete().eq('target_number', targetNumber);
    console.log(`[BLACKLIST] ${targetNumber} dihapus dari blacklist`);
  }
}

export async function checkBlacklist(
  targetNumber: string,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<{ isBlacklisted: boolean; level?: BlacklistLevel; totalReports?: number; uniqueReporters?: number }> {
  const { data } = await supabase
    .from('blacklist')
    .select('level, total_reports, unique_reporters')
    .eq('target_number', targetNumber)
    .single();

  if (!data) return { isBlacklisted: false };

  return {
    isBlacklisted:   true,
    level:           data.level as BlacklistLevel,
    totalReports:    data.total_reports,
    uniqueReporters: data.unique_reporters,
  };
}

// Dipanggil cron tiap bulan — turunkan level entri blacklist yang sudah lama tidak aktif
export async function runConfidenceDecay(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<{ processed: number; downgraded: number; removed: number }> {
  const stats = { processed: 0, downgraded: 0, removed: 0 };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: staleEntries } = await supabase
    .from('blacklist')
    .select('target_number, level')
    .lt('last_reported_at', sixMonthsAgo.toISOString());

  if (!staleEntries?.length) return stats;

  stats.processed = staleEntries.length;

  const toDelete    = staleEntries.filter(e => e.level === 'medium').map(e => e.target_number);
  const toCritical  = staleEntries.filter(e => e.level === 'critical').map(e => e.target_number);
  const toDowngrade = staleEntries.filter(e => e.level === 'high').map(e => e.target_number);
  const now         = new Date().toISOString();

  // Bulk ops — dari N query jadi maksimal 3 query
  await Promise.all([
    toDelete.length
      ? supabase.from('blacklist').delete().in('target_number', toDelete)
      : Promise.resolve(),

    toCritical.length
      ? supabase.from('blacklist').update({ level: 'high', updated_at: now }).in('target_number', toCritical)
      : Promise.resolve(),

    toDowngrade.length
      ? supabase.from('blacklist').update({ level: 'medium', updated_at: now }).in('target_number', toDowngrade)
      : Promise.resolve(),
  ]);

  stats.removed    = toDelete.length;
  stats.downgraded = toCritical.length + toDowngrade.length;

  console.log('[BLACKLIST] Confidence decay selesai:', stats);
  return stats;
}