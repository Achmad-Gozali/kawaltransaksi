export async function logSuspiciousIp(
  limiter: KVNamespace,
  ip: string,
  reason: string,
  endpoint: string,
): Promise<void> {
  try {
    const key = `iplog_${ip}_${crypto.randomUUID()}`;
    await limiter.put(key, JSON.stringify({
      ip, reason, endpoint, created_at: new Date().toISOString(),
    }), { expirationTtl: 604800 });
  } catch (err) {
    console.error('[IP LOG] Error:', err);
  }
}

export async function autoBlacklistIfAbuse(
  limiter: KVNamespace,
  ip: string,
  reason: string,
): Promise<void> {
  try {
    const blacklistKey = `blacklist_${ip}`;
    const abuseKey     = `abuse_count_${ip}`;

    if (await limiter.get(blacklistKey)) return;

    const current  = await limiter.get(abuseKey);
    const count    = current ? parseInt(current) : 0;
    const newCount = count + 1;

    if (newCount >= 5) {
      await Promise.all([
        limiter.put(blacklistKey, JSON.stringify({
          ip, reason, auto: true, created_at: new Date().toISOString(),
        }), { expirationTtl: 86400 }),
        limiter.delete(abuseKey),
      ]);
    } else {
      // FIX #5: selalu set TTL konsisten, tidak hanya di hit pertama
      await limiter.put(abuseKey, newCount.toString(), { expirationTtl: 3600 });
    }
  } catch (err) {
    console.error('[AUTO BLACKLIST] Error:', err);
  }
}