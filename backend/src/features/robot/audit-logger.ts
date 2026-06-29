import sql from '../../core/db';

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

export class LogBatcher {
  private queue: LogEntry[] = [];

  add(entry: LogEntry) {
    this.queue.push(entry);
  }

  async flush(): Promise<void> {
    if (!this.queue.length) return;

    const batch = this.queue.splice(0);
    try {
      await sql`
        INSERT INTO robot_logs (report_id, action, verdict, score, reasons, error, duration_ms)
        SELECT * FROM ${sql(batch.map(e => ({
          report_id:   e.report_id   ?? null,
          action:      e.action,
          verdict:     e.verdict     ?? null,
          score:       e.score       ?? null,
          reasons:     JSON.stringify(e.reasons ?? []),
          error:       e.error       ?? null,
          duration_ms: e.duration_ms ?? null,
        })))}
      `;
    } catch (err) {
      console.error('[AUDIT-LOGGER] Batch flush gagal:', err);
    }
  }
}

export async function writeLog(entry: LogEntry): Promise<void> {
  try {
    await sql`
      INSERT INTO robot_logs (report_id, action, verdict, score, reasons, error, duration_ms)
      VALUES (
        ${entry.report_id   ?? null},
        ${entry.action},
        ${entry.verdict     ?? null},
        ${entry.score       ?? null},
        ${JSON.stringify(entry.reasons ?? [])},
        ${entry.error       ?? null},
        ${entry.duration_ms ?? null}
      )
    `;
  } catch (err) {
    console.error('[AUDIT-LOGGER] Gagal tulis log:', err);
  }
}

export async function withLog<T>(
  action: LogAction,
  reportId: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    await writeLog({ action, report_id: reportId, duration_ms: Date.now() - start });
    return result;
  } catch (err) {
    await writeLog({
      action,
      report_id:   reportId,
      error:       err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - start,
    });
    throw err;
  }
}