// ============================================
// 📁 LOKASI: backend/src/features/robot/auto-blocker.ts
// ============================================

// ── Durasi block ──────────────────────────────────────────────────────────────

const BLOCK_DURATION = {
  TEMP_24H:  60 * 60 * 24,        // 24 jam
  TEMP_7D:   60 * 60 * 24 * 7,    // 7 hari
  PERMANENT: 60 * 60 * 24 * 3650, // ~10 tahun (permanent)
};

// ── Threshold trigger ─────────────────────────────────────────────────────────

const THRESHOLD = {
  REJECT_1H:        3,  // 3x reject dalam 1 jam → temp block 24 jam
  REJECT_1D:        10, // 10x reject dalam 1 hari → temp block 7 hari
  REJECT_7D:        20, // 20x reject dalam 7 hari → permanent block
  TEMP_24H_COUNT:   3,  // 3x kena temp 24h → eskalasi ke 7 hari
  TEMP_7D_COUNT:    2,  // 2x kena temp 7d → permanent
};

// ── Key helpers ───────────────────────────────────────────────────────────────

const keys = {
  block:        (id: string) => `autoblock_${id}`,
  rejectCount:  (id: string, window: string) => `reject_count_${window}_${id}`,
  blockCount24: (id: string) => `block24h_count_${id}`,
  blockCount7:  (id: string) => `block7d_count_${id}`,
};

// ── Cek apakah user/IP diblokir ──────────────────────────────────────────────

export async function isBlocked(
  identifier: string, // bisa userId atau IP
  kv: KVNamespace
): Promise<{ blocked: boolean; reason?: string; until?: string }> {
  try {
    const raw = await kv.get(keys.block(identifier));
    if (!raw) return { blocked: false };
    const data = JSON.parse(raw);
    return { blocked: true, reason: data.reason, until: data.until };
  } catch {
    return { blocked: false };
  }
}

// ── Catat laporan reject untuk user/IP ───────────────────────────────────────

export async function recordRejection(
  userId: string | null,
  ip: string,
  kv: KVNamespace
): Promise<void> {
  await Promise.all([
    userId && incrementRejectCount(userId, kv),
    incrementRejectCount(ip, kv),
  ].filter(Boolean));
}

async function incrementRejectCount(identifier: string, kv: KVNamespace): Promise<void> {
  try {
    // Hitung reject dalam 1 jam
    const key1h = keys.rejectCount(identifier, '1h');
    const count1h = parseInt(await kv.get(key1h) ?? '0') + 1;
    await kv.put(key1h, count1h.toString(), { expirationTtl: 3600 });

    // Hitung reject dalam 1 hari
    const key1d = keys.rejectCount(identifier, '1d');
    const count1d = parseInt(await kv.get(key1d) ?? '0') + 1;
    await kv.put(key1d, count1d.toString(), { expirationTtl: 86400 });

    // Hitung reject dalam 7 hari
    const key7d = keys.rejectCount(identifier, '7d');
    const count7d = parseInt(await kv.get(key7d) ?? '0') + 1;
    await kv.put(key7d, count7d.toString(), { expirationTtl: 604800 });

    // Evaluasi apakah perlu diblokir
    await evaluateBlock(identifier, count1h, count1d, count7d, kv);
  } catch (err) {
    console.error('[AUTO-BLOCKER] incrementRejectCount error:', err);
  }
}

async function evaluateBlock(
  identifier: string,
  count1h: number,
  count1d: number,
  count7d: number,
  kv: KVNamespace
): Promise<void> {
  // Cek sudah pernah diblock berapa kali
  const prev24h = parseInt(await kv.get(keys.blockCount24(identifier)) ?? '0');
  const prev7d  = parseInt(await kv.get(keys.blockCount7(identifier)) ?? '0');

  // Permanent block
  if (
    count7d >= THRESHOLD.REJECT_7D ||
    prev7d >= THRESHOLD.TEMP_7D_COUNT
  ) {
    await applyBlock(identifier, 'permanent', BLOCK_DURATION.PERMANENT, kv,
      `${count7d}x reject dalam 7 hari atau ${prev7d}x temp block 7 hari`);
    return;
  }

  // Temp block 7 hari
  if (
    count1d >= THRESHOLD.REJECT_1D ||
    prev24h >= THRESHOLD.TEMP_24H_COUNT
  ) {
    await applyBlock(identifier, '7d', BLOCK_DURATION.TEMP_7D, kv,
      `${count1d}x reject dalam 1 hari atau ${prev24h}x temp block 24 jam`);
    // Catat block 7d count
    await kv.put(keys.blockCount7(identifier), (prev7d + 1).toString(), { expirationTtl: BLOCK_DURATION.PERMANENT });
    return;
  }

  // Temp block 24 jam
  if (count1h >= THRESHOLD.REJECT_1H) {
    await applyBlock(identifier, '24h', BLOCK_DURATION.TEMP_24H, kv,
      `${count1h}x reject dalam 1 jam`);
    // Catat block 24h count
    await kv.put(keys.blockCount24(identifier), (prev24h + 1).toString(), { expirationTtl: BLOCK_DURATION.PERMANENT });
  }
}

async function applyBlock(
  identifier: string,
  type: '24h' | '7d' | 'permanent',
  ttl: number,
  kv: KVNamespace,
  reason: string
): Promise<void> {
  const until = type === 'permanent'
    ? 'Permanent'
    : new Date(Date.now() + ttl * 1000).toISOString();

  await kv.put(keys.block(identifier), JSON.stringify({
    type, reason, until, blocked_at: new Date().toISOString(),
  }), { expirationTtl: ttl });

  console.log(`[AUTO-BLOCKER] Block ${type} applied to ${identifier}: ${reason}`);
}

// ── Manual unblock (untuk admin) ──────────────────────────────────────────────

export async function unblock(identifier: string, kv: KVNamespace): Promise<void> {
  await kv.delete(keys.block(identifier));
  console.log(`[AUTO-BLOCKER] Unblock: ${identifier}`);
}