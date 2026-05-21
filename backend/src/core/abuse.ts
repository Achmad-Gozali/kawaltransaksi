// core/abuse.ts — extracted dari index.ts untuk menghindari circular import

export async function logSuspiciousIp(
  limiter: KVNamespace,
  ip: string,
  reason: string,
  endpoint: string,
): Promise<void> {
  try {
    const logKey = `iplog_${ip}_${Date.now()}`;
    await limiter.put(
      logKey,
      JSON.stringify({ ip, reason, endpoint, created_at: new Date().toISOString() }),
      { expirationTtl: 604800 },
    );
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
    const abuseKey = `abuse_count_${ip}`;
    const current  = await limiter.get(abuseKey);
    const count    = current ? parseInt(current) : 0;
    const newCount = count + 1;
    if (newCount >= 5) {
      const blacklistKey = `blacklist_${ip}`;
      const existing     = await limiter.get(blacklistKey);
      if (!existing) {
        await limiter.put(
          blacklistKey,
          JSON.stringify({ ip, reason, auto: true, created_at: new Date().toISOString() }),
          { expirationTtl: 86400 },
        );
        await limiter.delete(abuseKey);
      }
    } else {
      await limiter.put(abuseKey, newCount.toString(), { expirationTtl: 3600 });
    }
  } catch (err) {
    console.error('[AUTO BLACKLIST] Error:', err);
  }
}