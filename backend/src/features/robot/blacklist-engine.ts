import sql from '../../core/db';

type BlacklistLevel = 'medium' | 'high' | 'critical';

const MIN_UNIQUE_REPORTERS = 2;

function getLevel(uniqueReporters: number): BlacklistLevel {
  if (uniqueReporters >= 20) return 'critical';
  if (uniqueReporters >= 10) return 'high';
  return 'medium';
}

export async function updateBlacklist(targetNumber: string): Promise<void> {
  const stats = await sql`
    SELECT reporter_id FROM reports
    WHERE target_number = ${targetNumber} AND status = 'verified'
  `;

  if (!stats.length) return;

  const totalReports    = stats.length;
  const uniqueReporters = new Set(stats.map((r: any) => r.reporter_id).filter(Boolean)).size;

  if (uniqueReporters < MIN_UNIQUE_REPORTERS) return;

  const level = getLevel(uniqueReporters);
  const now   = new Date().toISOString();

  await sql`
    INSERT INTO blacklist (target_number, level, total_reports, unique_reporters, last_reported_at, updated_at)
    VALUES (${targetNumber}, ${level}, ${totalReports}, ${uniqueReporters}, ${now}, ${now})
    ON CONFLICT (target_number) DO UPDATE SET
      level            = EXCLUDED.level,
      total_reports    = EXCLUDED.total_reports,
      unique_reporters = EXCLUDED.unique_reporters,
      last_reported_at = EXCLUDED.last_reported_at,
      updated_at       = EXCLUDED.updated_at
  `;

  console.log(`[BLACKLIST] ${targetNumber} -> ${level} (${uniqueReporters} reporters)`);
}

export async function removeFromBlacklist(targetNumber: string): Promise<void> {
  const [{ count }] = await sql`
    SELECT COUNT(*) as count FROM reports
    WHERE target_number = ${targetNumber} AND status = 'verified'
  `;

  if (parseInt(count) === 0) {
    await sql`DELETE FROM blacklist WHERE target_number = ${targetNumber}`;
    console.log(`[BLACKLIST] ${targetNumber} dihapus dari blacklist`);
  }
}

export async function checkBlacklist(
  targetNumber: string,
): Promise<{ isBlacklisted: boolean; level?: BlacklistLevel; totalReports?: number; uniqueReporters?: number }> {
  const [data] = await sql`
    SELECT level, total_reports, unique_reporters FROM blacklist
    WHERE target_number = ${targetNumber}
    LIMIT 1
  `;

  if (!data) return { isBlacklisted: false };

  return {
    isBlacklisted:   true,
    level:           data.level as BlacklistLevel,
    totalReports:    data.total_reports,
    uniqueReporters: data.unique_reporters,
  };
}

export async function runConfidenceDecay(): Promise<{ processed: number; downgraded: number; removed: number }> {
  const stats = { processed: 0, downgraded: 0, removed: 0 };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const staleEntries = await sql`
    SELECT target_number, level FROM blacklist
    WHERE last_reported_at < ${sixMonthsAgo.toISOString()}
  `;

  if (!staleEntries.length) return stats;

  stats.processed = staleEntries.length;

  const toDelete    = staleEntries.filter((e: any) => e.level === 'medium').map((e: any) => e.target_number);
  const toCritical  = staleEntries.filter((e: any) => e.level === 'critical').map((e: any) => e.target_number);
  const toDowngrade = staleEntries.filter((e: any) => e.level === 'high').map((e: any) => e.target_number);
  const now         = new Date().toISOString();

  await Promise.all([
    toDelete.length
      ? sql`DELETE FROM blacklist WHERE target_number IN ${sql(toDelete)}`
      : Promise.resolve(),

    toCritical.length
      ? sql`UPDATE blacklist SET level = 'high', updated_at = ${now} WHERE target_number IN ${sql(toCritical)}`
      : Promise.resolve(),

    toDowngrade.length
      ? sql`UPDATE blacklist SET level = 'medium', updated_at = ${now} WHERE target_number IN ${sql(toDowngrade)}`
      : Promise.resolve(),
  ]);

  stats.removed    = toDelete.length;
  stats.downgraded = toCritical.length + toDowngrade.length;

  console.log('[BLACKLIST] Confidence decay selesai:', stats);
  return stats;
}