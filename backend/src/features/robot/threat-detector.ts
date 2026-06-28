import { getSupabaseAdmin } from '../../core/supabase';
import { writeLog } from './audit-logger';
import { kv } from '../../core/redis';

const WINDOW_MS         = 30 * 60 * 1000;
const BASELINE_KEY      = 'threat_baseline';
const SIGMA_THRESHOLD   = 3;
const BLOCK_THRESHOLD   = 5;
const MIN_SAMPLES       = 5;
const MIN_HITS_TO_BLOCK = 10;

interface Baseline {
  mean: number;
  stddev: number;
  samples: number[];
  updated_at: number;
}

interface ThreatReport {
  endpoint: string;
  current: number;
  mean: number;
  sigma: number;
  z_score: number;
}

function calcStats(samples: number[]): { mean: number; stddev: number } {
  const mean     = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
  return { mean, stddev: Math.sqrt(variance) };
}

async function getBaselines(): Promise<Record<string, Baseline>> {
  try {
    const raw = await kv.get(BASELINE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveBaselines(data: Record<string, Baseline>): Promise<void> {
  await kv.put(BASELINE_KEY, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 7 });
}

async function collectTraffic(): Promise<{
  samples: { endpoint: string; count: number }[];
  logs: { ip: string; endpoint: string; created_at: string }[];
}> {
  const cutoff = Date.now() - WINDOW_MS;
  const { keys: ipKeys } = await kv.list({ prefix: 'iplog_' });

  const endpointCount: Record<string, number> = {};
  const logs: { ip: string; endpoint: string; created_at: string }[] = [];

  await Promise.all(
    ipKeys.map(async ({ name }) => {
      try {
        const raw = await kv.get(name);
        if (!raw) return;
        const log = JSON.parse(raw) as { ip: string; endpoint: string; created_at: string };
        if (new Date(log.created_at).getTime() < cutoff) return;
        endpointCount[log.endpoint] = (endpointCount[log.endpoint] ?? 0) + 1;
        logs.push(log);
      } catch {}
    })
  );

  return {
    samples: Object.entries(endpointCount).map(([endpoint, count]) => ({ endpoint, count })),
    logs,
  };
}

async function blockThreatenedIps(
  threats: ThreatReport[],
  logs: { ip: string; endpoint: string }[],
): Promise<number> {
  const threatenedEndpoints = new Set(
    threats.filter(t => t.z_score >= BLOCK_THRESHOLD).map(t => t.endpoint)
  );
  if (!threatenedEndpoints.size) return 0;

  const ipHits: Record<string, number> = {};
  for (const log of logs) {
    if (!threatenedEndpoints.has(log.endpoint)) continue;
    ipHits[log.ip] = (ipHits[log.ip] ?? 0) + 1;
  }

  let blocked = 0;
  await Promise.all(
    Object.entries(ipHits).map(async ([ip, hits]) => {
      if (hits < MIN_HITS_TO_BLOCK) return;
      const key = `blacklist_${ip}`;
      if (await kv.get(key)) return;
      await kv.put(key, JSON.stringify({
        ip,
        reason: `Auto-block: anomali traffic z-score >= ${BLOCK_THRESHOLD}`,
        auto: true,
        created_at: new Date().toISOString(),
      }), { expirationTtl: 86400 });
      blocked++;
    })
  );

  return blocked;
}

export async function detectThreats(
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<{ threats: ThreatReport[]; updated: number; blocked: number }> {
  const [{ samples, logs }, baselines] = await Promise.all([
    collectTraffic(),
    getBaselines(),
  ]);

  const threats: ThreatReport[] = [];
  const now = Date.now();

  for (const { endpoint, count } of samples) {
    const baseline    = baselines[endpoint];
    const prevSamples = baseline?.samples ?? [];

    if (!baseline || prevSamples.length < MIN_SAMPLES) {
      const updated = [...prevSamples, count].slice(-20);
      const { mean, stddev } = calcStats(updated);
      baselines[endpoint] = { mean, stddev, samples: updated, updated_at: now };
      continue;
    }

    const { mean, stddev } = baseline;
    const z_score = stddev > 0 ? (count - mean) / stddev : 0;

    if (z_score >= SIGMA_THRESHOLD) {
      threats.push({ endpoint, current: count, mean, sigma: stddev, z_score });
    }

    const updated = [...prevSamples, count].slice(-20);
    const stats   = calcStats(updated);
    baselines[endpoint] = { mean: stats.mean, stddev: stats.stddev, samples: updated, updated_at: now };
  }

  const [, blocked] = await Promise.all([
    saveBaselines(baselines),
    blockThreatenedIps(threats, logs),
  ]);

  if (threats.length > 0) {
    console.log(`[THREAT] ${threats.length} anomali, ${blocked} IP di-block`);
    await writeLog({
      action: 'scheduler',
      reasons: [{ type: 'threat_detection', threats, blocked }],
    }, supabase).catch(() => {});
  }

  return { threats, updated: Object.keys(baselines).length, blocked };
}