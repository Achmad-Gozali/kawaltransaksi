import { randomBytes } from "crypto";

/**
 * Cache sementara (in-memory, bukan DB) untuk hasil decode QRIS saat user
 * baru CEK (belum tentu lapor) lewat /cek-qris. Alasan tidak pakai query
 * param mentah (?name=...&city=...): siapa pun bisa mengarang URL manual
 * dan membuat NMID apapun terlihat seolah dari QR bermerek tepercaya --
 * token di sini hanya bisa dibuat lewat POST /api/qris/preview, yang
 * memanggil parseQrisPayload() (CRC16 + validasi struktur EMV-QRIS penuh),
 * jadi data di baliknya PASTI berasal dari payload yang matematis valid
 * sebagai QRIS, bukan string bebas.
 *
 * Sengaja in-memory (Map biasa), bukan tabel Postgres seperti otpTokens/
 * passwordResetTokens: data ini murni cache tampilan berumur pendek (10
 * menit), tidak apa-apa hilang kalau server restart, dan tidak ada
 * kebutuhan query/audit jangka panjang atasnya.
 */

interface PreviewEntry {
  nmid: string;
  merchantName: string;
  merchantCity: string;
  expiresAt: number;
}

const TTL_MS = 10 * 60 * 1000;
const store = new Map<string, PreviewEntry>();

export function createPreviewToken(data: { nmid: string; merchantName: string; merchantCity: string }): string {
  const token = randomBytes(16).toString("hex");
  store.set(token, { ...data, expiresAt: Date.now() + TTL_MS });
  return token;
}

export function getPreviewToken(token: string): Omit<PreviewEntry, "expiresAt"> | null {
  const entry = store.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(token);
    return null;
  }
  const { expiresAt: _expiresAt, ...data } = entry;
  return data;
}

// Sapu berkala entry kadaluarsa yang tidak pernah dibaca ulang (mis. user
// decode lalu tidak lanjut ke halaman hasil) supaya memori tidak bertumbuh
// tanpa batas. Lookup di getPreviewToken() sudah lazy-expire sendiri --
// interval ini cuma jaring pengaman tambahan.
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of store) {
    if (entry.expiresAt < now) store.delete(token);
  }
}, 5 * 60 * 1000).unref();
