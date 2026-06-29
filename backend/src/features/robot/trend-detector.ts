import sql from '../../core/db';
import { writeLog } from './audit-logger';

const VIRAL_THRESHOLD = 10;

export async function detectTrends(): Promise<{ viral: number; updated: number; reset: number }> {
  const stats    = { viral: 0, updated: 0, reset: 0 };
  const since24h = new Date(Date.now() - 86400000).toISOString();
  const now      = new Date().toISOString();

  const recentReports = await sql`
    SELECT target_number FROM reports
    WHERE created_at >= ${since24h} AND status != 'withdrawn'
  `;

  const countMap: Record<string, number> = {};
  for (const r of recentReports) {
    countMap[r.target_number] = (countMap[r.target_number] ?? 0) + 1;
  }

  const activeNumbers = Object.keys(countMap);

  if (activeNumbers.length > 0) {
    for (const num of activeNumbers) {
      const count   = countMap[num];
      const isViral = count >= VIRAL_THRESHOLD;
      if (isViral) stats.viral++;

      await sql`
        INSERT INTO robot_trends (target_number, report_count, is_viral, updated_at ${isViral ? sql`, detected_at` : sql``})
        VALUES (${num}, ${count}, ${isViral}, ${now} ${isViral ? sql`, ${now}` : sql``})
        ON CONFLICT (target_number) DO UPDATE SET
          report_count = EXCLUDED.report_count,
          is_viral     = EXCLUDED.is_viral,
          updated_at   = EXCLUDED.updated_at
          ${isViral ? sql`, detected_at = EXCLUDED.detected_at` : sql``}
      `;
    }

    stats.updated = activeNumbers.length;

    if (stats.viral > 0) console.log(`[TREND] ${stats.viral} nomor viral terdeteksi`);

    const staleViral = await sql`
      SELECT target_number FROM robot_trends
      WHERE is_viral = true AND target_number != ALL(${activeNumbers})
    `;

    if (staleViral.length) {
      await sql`
        UPDATE robot_trends SET is_viral = false, updated_at = ${now}
        WHERE target_number = ANY(${staleViral.map((r: any) => r.target_number)})
      `;
      stats.reset = staleViral.length;
      console.log(`[TREND] Reset ${stats.reset} nomor yang tidak lagi viral`);
    }
  } else {
    const result = await sql`
      UPDATE robot_trends SET is_viral = false, updated_at = ${now}
      WHERE is_viral = true
    `;
    stats.reset = result.count;
  }

  await writeLog({
    action:  'scheduler',
    reasons: [{ type: 'trend_detection', ...stats }],
  }).catch(() => {});

  return stats;
}

export async function getViralNumbers(
  limit = 10,
): Promise<{ target_number: string; report_count: number; detected_at: string }[]> {
  const data = await sql`
    SELECT target_number, report_count, detected_at FROM robot_trends
    WHERE is_viral = true
    ORDER BY report_count DESC
    LIMIT ${limit}
  `;
  return data as any[];
}

export async function isNumberViral(targetNumber: string): Promise<boolean> {
  const [data] = await sql`
    SELECT is_viral FROM robot_trends
    WHERE target_number = ${targetNumber}
    LIMIT 1
  `;
  return data?.is_viral ?? false;
}