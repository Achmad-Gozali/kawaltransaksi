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

// Kumpulin log dulu, flush sekali di akhir run — biar tidak N×insert per scheduler
export class LogBatcher {
  private queue: LogEntry[] = [];

  add(entry: LogEntry) {
    this.queue.push(entry);
  }

  async flush(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<void> {
    if (!this.queue.length) return;

    const batch = this.queue.splice(0); // drain sekaligus
    try {
      await supabase.from('robot_logs').insert(
        batch.map(e => ({
          report_id:   e.report_id   ?? null,
          action:      e.action,
          verdict:     e.verdict     ?? null,
          score:       e.score       ?? null,
          reasons:     e.reasons     ?? [],
          error:       e.error       ?? null,
          duration_ms: e.duration_ms ?? null,
        }))
      );
    } catch (err) {
      console.error('[AUDIT-LOGGER] Batch flush gagal:', err);
    }
  }
}

// Single insert — untuk operasi di luar scheduler (appeal, manual evaluate)
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
    console.error('[AUDIT-LOGGER] Gagal tulis log:', err);
  }
}

export async function withLog<T>(
  action: LogAction,
  reportId: string | undefined,
  fn: () => Promise<T>,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    await writeLog({ action, report_id: reportId, duration_ms: Date.now() - start }, supabase);
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