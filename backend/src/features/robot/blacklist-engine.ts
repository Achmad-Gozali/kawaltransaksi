// ============================================
// 📁 LOKASI: backend/src/features/robot/blacklist-engine.ts
// ============================================

import { getSupabaseAdmin } from '../../core/supabase';

type BlacklistLevel = 'medium' | 'high' | 'critical';

function getLevel(uniqueReporters: number): BlacklistLevel {
  if (uniqueReporters >= 20) return 'critical';
  if (uniqueReporters >= 10) return 'high';
  return 'medium';
}

// ── Update blacklist saat ada laporan verified baru ───────────────────────────

export async function updateBlacklist(
  targetNumber: string,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<void> {
  // Hitung total laporan & unique reporters untuk nomor ini
  const { data: stats } = await supabase
    .from('reports')
    .select('reporter_id')
    .eq('target_number', targetNumber)
    .eq('status', 'verified');

  if (!stats?.length) return;

  const totalReports    = stats.length;
  const uniqueReporters = new Set(stats.map(r => r.reporter_id).filter(Boolean)).size;

  // Hanya masuk blacklist kalau minimal 5 unique reporters
  if (uniqueReporters < 5) return;

  const level = getLevel(uniqueReporters);

  // Upsert ke tabel blacklist
  await supabase.from('blacklist').upsert({
    target_number:    targetNumber,
    level,
    total_reports:    totalReports,
    unique_reporters: uniqueReporters,
    last_reported_at: new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'target_number' });

  console.log(`[BLACKLIST] ${targetNumber} → ${level} (${uniqueReporters} reporters)`);
}

// ── Remove dari blacklist kalau tidak ada laporan verified ────────────────────

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

// ── Cek apakah nomor ada di blacklist ────────────────────────────────────────

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

// ── Confidence decay: turunkan level kalau tidak ada laporan baru ─────────────
// Dipanggil oleh cron tiap bulan

export async function runConfidenceDecay(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<{ processed: number; downgraded: number; removed: number }> {
  const stats = { processed: 0, downgraded: 0, removed: 0 };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Ambil semua blacklist yang tidak ada laporan baru dalam 6 bulan
  const { data: staleEntries } = await supabase
    .from('blacklist')
    .select('*')
    .lt('last_reported_at', sixMonthsAgo.toISOString());

  if (!staleEntries?.length) return stats;

  for (const entry of staleEntries) {
    stats.processed++;

    if (entry.level === 'medium') {
      // Medium yang sudah lama → hapus
      await supabase.from('blacklist').delete().eq('target_number', entry.target_number);
      stats.removed++;
    } else {
      // High → Medium, Critical → High
      const newLevel: BlacklistLevel = entry.level === 'critical' ? 'high' : 'medium';
      await supabase.from('blacklist').update({
        level:      newLevel,
        updated_at: new Date().toISOString(),
      }).eq('target_number', entry.target_number);
      stats.downgraded++;
    }
  }

  console.log('[BLACKLIST] Confidence decay selesai:', stats);
  return stats;
}