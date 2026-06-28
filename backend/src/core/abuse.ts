import { kv } from './redis';

export async function logSuspiciousIp(
  ip: string,
  reason: string,
  endpoint: string,
): Promise<void> {
  try {
    const key = `iplog_${ip}_${crypto.randomUUID()}`;
    await kv.put(key, JSON.stringify({
      ip, reason, endpoint, created_at: new Date().toISOString(),
    }), { expirationTtl: 604800 });
  } catch (err) {
    console.error('[IP LOG] Error:', err);
  }
}

export async function autoBlacklistIfAbuse(
  ip: string,
  reason: string,
): Promise<void> {
  try {
    const blacklistKey = `blacklist_${ip}`;
    const abuseKey     = `abuse_count_${ip}`;

    if (await kv.get(blacklistKey)) return;

    const current  = await kv.get(abuseKey);
    const count    = current ? parseInt(current) : 0;
    const newCount = count + 1;

    if (newCount >= 5) {
      await Promise.all([
        kv.put(blacklistKey, JSON.stringify({
          ip, reason, auto: true, created_at: new Date().toISOString(),
        }), { expirationTtl: 86400 }),
        kv.delete(abuseKey),
      ]);
    } else {
      await kv.put(abuseKey, newCount.toString(), { expirationTtl: 3600 });
    }
  } catch (err) {
    console.error('[AUTO BLACKLIST] Error:', err);
  }
}