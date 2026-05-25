// ============================================
//  LOKASI: backend/src/features/robot/trend-detector.ts
// ============================================

import { getSupabaseAdmin } from '../../core/supabase';
import { writeLog } from './audit-logger';

const VIRAL_THRESHOLD = 10; // laporan dalam 24 jam = viral

// -- Deteksi nomor viral -------------------------------------------------------

export async function detectTrends(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<{ viral: number; updated: number }> {
  const stats = { viral: 0, updated: 0 };

  const since24h = new Date(Date.now() - 86400000).toISOString();

  // Ambil semua nomor yang dilaporkan dalam 24 jam terakhir
  const { data: recentReports } = await supabase
    .from('reports')
    .select('target_number')
    .gte('created_at', since24h)
    .neq('status', 'withdrawn');

  if (!recentReports?.length) return stats;

  // Hitung jumlah laporan per nomor
  const countMap: Record<string, number> = {};
  for (const r of recentReports) {
    countMap[r.target_number] = (countMap[r.target_number] ?? 0) + 1;
  }

  for (const [targetNumber, count] of Object.entries(countMap)) {
    const isViral = count >= VIRAL_THRESHOLD;

    await supabase.from('robot_trends').upsert({
      target_number: targetNumber,
      report_count:  count,
      is_viral:      isViral,
      updated_at:    new Date().toISOString(),
      ...(isViral && { detected_at: new Date().toISOString() }),
    }, { onConflict: 'target_number' });

    stats.updated++;
    if (isViral) {
      stats.viral++;
      console.log(`[TREND]  Nomor viral: ${targetNumber} (${count} laporan dalam 24 jam)`);
    }
  }

  await writeLog({ action: 'scheduler', reasons: [{ type: 'trend_detection', ...stats }] }, supabase).catch(() => {});
  return stats;
}

// -- Ambil daftar nomor viral (untuk homepage / admin) ------------------------

export async function getViralNumbers(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  limit = 10
): Promise<{ target_number: string; report_count: number; detected_at: string }[]> {
  const { data } = await supabase
    .from('robot_trends')
    .select('target_number, report_count, detected_at')
    .eq('is_viral', true)
    .order('report_count', { ascending: false })
    .limit(limit);

  return data ?? [];
}

// -- Cek apakah satu nomor sedang viral ---------------------------------------

export async function isNumberViral(
  targetNumber: string,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<boolean> {
  const { data } = await supabase
    .from('robot_trends')
    .select('is_viral')
    .eq('target_number', targetNumber)
    .single();

  return data?.is_viral ?? false;
}