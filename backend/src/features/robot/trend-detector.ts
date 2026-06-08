import { getSupabaseAdmin } from '../../core/supabase';
import { writeLog }         from './audit-logger';

const VIRAL_THRESHOLD = 10;

export async function detectTrends(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<{ viral: number; updated: number; reset: number }> {
  const stats    = { viral: 0, updated: 0, reset: 0 };
  const since24h = new Date(Date.now() - 86400000).toISOString();
  const now      = new Date().toISOString();

  const { data: recentReports } = await supabase
    .from('reports')
    .select('target_number')
    .gte('created_at', since24h)
    .neq('status', 'withdrawn');

  const countMap: Record<string, number> = {};
  for (const r of recentReports ?? []) {
    countMap[r.target_number] = (countMap[r.target_number] ?? 0) + 1;
  }

  const activeNumbers = Object.keys(countMap);

  if (activeNumbers.length > 0) {
    // Bulk upsert semua sekaligus — dari N query jadi 1
    const upsertRows = activeNumbers.map(num => {
      const count   = countMap[num];
      const isViral = count >= VIRAL_THRESHOLD;
      if (isViral) stats.viral++;
      return {
        target_number: num,
        report_count:  count,
        is_viral:      isViral,
        updated_at:    now,
        ...(isViral && { detected_at: now }),
      };
    });

    await supabase.from('robot_trends').upsert(upsertRows, { onConflict: 'target_number' });
    stats.updated = activeNumbers.length;

    if (stats.viral > 0) {
      console.log(`[TREND] ${stats.viral} nomor viral terdeteksi`);
    }

    // Reset nomor yang sudah tidak aktif dalam 24 jam
    const { data: staleViral } = await supabase
      .from('robot_trends')
      .select('target_number')
      .eq('is_viral', true)
      .not('target_number', 'in', `(${activeNumbers.map(n => `"${n}"`).join(',')})`);

    if (staleViral?.length) {
      await supabase
        .from('robot_trends')
        .update({ is_viral: false, updated_at: now })
        .in('target_number', staleViral.map(r => r.target_number));

      stats.reset = staleViral.length;
      console.log(`[TREND] Reset ${stats.reset} nomor yang tidak lagi viral`);
    }
  } else {
    // Tidak ada laporan sama sekali dalam 24 jam — reset semua yang masih viral
    const { count: resetCount } = await supabase
      .from('robot_trends')
      .update({ is_viral: false, updated_at: now })
      .eq('is_viral', true);

    stats.reset = resetCount ?? 0;
  }

  await writeLog({
    action:  'scheduler',
    reasons: [{ type: 'trend_detection', ...stats }],
  }, supabase).catch(() => {});

  return stats;
}

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