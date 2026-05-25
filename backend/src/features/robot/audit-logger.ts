// ============================================
// 📁 LOKASI: backend/src/features/robot/audit-logger.ts
// ============================================

import { getSupabaseAdmin } from '../../core/supabase';

type LogAction = 'evaluate' | 'verdict' | 'blacklist' | 'block' | 'decay' | 'scheduler' | 'health';

interface LogEntry {
  report_id?:   string;
  action:       LogAction;
  verdict?:     string;
  score?:       number;
  reasons?:     unknown[];
  error?:       string;
  duration_ms?: number;
}

export async function writeLog(
  entry: LogEntry,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<void> {
  try {
    await supabase.from('robot_logs').insert({
      report_id:   entry.report_id   ?? null,
      action:      entry.action,
      verdict:     entry.verdict     ?? null,
      score:       entry.score       ?? null,
      reasons:     entry.reasons     ?? [],
      error:       entry.error       ?? null,
      duration_ms: entry.duration_ms ?? null,
    });
  } catch (err) {
    // Log gagal tidak boleh crash robot
    console.error('[AUDIT-LOGGER] Gagal tulis log:', err);
  }
}

// ── Helper: wrap fungsi dengan logging otomatis ───────────────────────────────

export async function withLog<T>(
  action: LogAction,
  reportId: string | undefined,
  fn: () => Promise<T>,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    await writeLog({
      action,
      report_id:   reportId,
      duration_ms: Date.now() - start,
    }, supabase);
    return result;
  } catch (err) {
    await writeLog({
      action,
      report_id:   reportId,
      error:       err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - start,
    }, supabase);
    throw err;
  }
}