/**
 * Parser & validator payload EMV-QRIS (Quick Response Code Indonesian
 * Standard), dibangun di atas spesifikasi umum EMVCo QR Code untuk
 * pembayaran, dengan konvensi tag 51 (Merchant Account Information --
 * Domestik) yang dipakai khusus oleh QRIS Indonesia.
 *
 * PRINSIP UTAMA: server adalah satu-satunya sumber kebenaran untuk data
 * merchant yang disimpan. Client (lewat jsQR di browser) hanya mengirim
 * payload MENTAH hasil scan foto -- field targetValue/targetName/
 * merchantCity yang tersimpan ke database SELALU berasal dari hasil
 * parseQrisPayload() di sini, bukan dari field terpisah yang diklaim
 * client. Ini mencegah penyerang mengirim foto QRIS asli sambil
 * berbohong soal NMID/nama/kota lewat field lain.
 *
 * Spesifikasi tag di bawah dikonfirmasi silang dari beberapa sumber
 * independen (analisis payload nyata + source code toolkit QRIS
 * open-source yang eksplisit mengklaim kepatuhan EMVCo+CRC16-CCITT),
 * BUKAN dibaca langsung dari dokumen teknis resmi Bank Indonesia (tidak
 * bisa diakses lewat tool ini). Cukup diyakini untuk dipakai produksi,
 * tapi kalau suatu saat ditemukan payload QRIS sah yang ditolak parser
 * ini, kemungkinan besar itu tanda ada varian tag yang belum tercakup --
 * bukan berarti payload itu palsu.
 */

const CRC_POLY = 0x1021;
const CRC_INIT = 0xffff;

/** CRC16-CCITT-FALSE: dipakai EMVCo QR Code (termasuk QRIS) untuk tag 63. */
function calculateCrc16(data: string): string {
  let crc = CRC_INIT;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ CRC_POLY) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Parser TLV EMV generik: 2 karakter tag ID + 2 karakter panjang desimal
 * + value sepanjang itu, diulang sampai habis. Dipakai baik untuk level
 * atas payload maupun untuk sub-TLV di dalam tag 51.
 *
 * Mengembalikan null (bukan throw) kalau struktur rusak/terpotong --
 * pemanggil memperlakukan itu sebagai payload tidak valid.
 */
function parseTlv(data: string): Map<string, string> | null {
  const tags = new Map<string, string>();
  let i = 0;
  while (i < data.length) {
    if (i + 4 > data.length) return null;
    const id = data.slice(i, i + 2);
    const lenStr = data.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(lenStr)) return null;
    const len = Number.parseInt(lenStr, 10);
    const start = i + 4;
    const end = start + len;
    if (end > data.length) return null;
    tags.set(id, data.slice(start, end));
    i = end;
  }
  return tags;
}

const MAX_PAYLOAD_LENGTH = 1000; // payload QRIS asli biasanya jauh di bawah ini; batas ini cuma jaga-jaga dari input abusive.
const NMID_PATTERN = /^[A-Za-z0-9]{15}$/;

export interface QrisParseResult {
  valid: boolean;
  nmid?: string;
  merchantName?: string;
  merchantCity?: string;
  error?: string;
}

/**
 * Parse + validasi penuh sebuah payload EMV-QRIS mentah (hasil decode QR
 * dari foto, dikirim client apa adanya). Kalau valid, field yang
 * dikembalikan (nmid/merchantName/merchantCity) adalah yang BOLEH
 * dipakai untuk mengisi targetValue/targetName/merchantCity laporan --
 * apapun yang dikirim client di field lain harus diabaikan.
 */
export function parseQrisPayload(rawPayload: unknown): QrisParseResult {
  if (typeof rawPayload !== "string" || rawPayload.length === 0) {
    return { valid: false, error: "Payload QRIS kosong atau tidak valid." };
  }
  if (rawPayload.length > MAX_PAYLOAD_LENGTH) {
    return { valid: false, error: "Payload QRIS terlalu panjang." };
  }

  // ── 1. Validasi CRC (tag 63, selalu 4 karakter, selalu di akhir payload) ──
  // Diambil dari 8 karakter terakhir (bukan indexOf("6304")) supaya tidak
  // salah kalau ada value field lain yang kebetulan mengandung "6304".
  if (rawPayload.length < 8) {
    return { valid: false, error: "Payload QRIS terlalu pendek." };
  }
  const crcTagAndLen = rawPayload.slice(-8, -4);
  if (crcTagAndLen !== "6304") {
    return { valid: false, error: "Payload tidak diakhiri tag CRC (63) yang valid." };
  }
  const expectedCrc = rawPayload.slice(-4).toUpperCase();
  const dataForCrc = rawPayload.slice(0, -4); // sampai & termasuk "6304", tanpa 4 hex value CRC
  const actualCrc = calculateCrc16(dataForCrc);
  if (expectedCrc !== actualCrc) {
    return { valid: false, error: "Checksum QRIS tidak valid. Foto mungkin rusak, buram, atau bukan QRIS asli." };
  }

  // ── 2. Parse struktur TLV level atas ──
  const tags = parseTlv(rawPayload);
  if (!tags) {
    return { valid: false, error: "Struktur payload QRIS tidak dapat dibaca." };
  }

  // ── 3. Validasi tag wajib yang menandakan ini QRIS domestik Indonesia ──
  if (tags.get("00") !== "01") {
    return { valid: false, error: "Format payload QR tidak dikenali sebagai QRIS." };
  }
  if (tags.get("58") !== "ID") {
    return { valid: false, error: "QR ini bukan QRIS domestik Indonesia." };
  }
  if (tags.get("53") !== "360") {
    return { valid: false, error: "Mata uang pada QRIS ini bukan Rupiah." };
  }

  const merchantName = tags.get("59")?.trim();
  const merchantCity = tags.get("60")?.trim();
  if (!merchantName) {
    return { valid: false, error: "Nama merchant tidak ditemukan pada QRIS ini." };
  }
  if (!merchantCity) {
    return { valid: false, error: "Kota merchant tidak ditemukan pada QRIS ini." };
  }

  // ── 4. Ekstrak NMID dari tag 51 (Merchant Account Information -- Domestik) ──
  const merchantAccountInfo = tags.get("51");
  if (!merchantAccountInfo) {
    return { valid: false, error: "Data akun merchant domestik (NMID) tidak ditemukan pada QRIS ini." };
  }
  const subTags = parseTlv(merchantAccountInfo);
  if (!subTags) {
    return { valid: false, error: "Data akun merchant domestik pada QRIS ini rusak." };
  }
  const nmid = subTags.get("02");
  if (!nmid || !NMID_PATTERN.test(nmid)) {
    return { valid: false, error: "NMID pada QRIS ini tidak sesuai format (harus 15 karakter alfanumerik)." };
  }

  return {
    valid: true,
    nmid: nmid.toUpperCase(),
    merchantName,
    merchantCity,
  };
}

/**
 * Sanity check ringan atas NMID yang SUDAH diekstrak & tervalidasi lewat
 * parseQrisPayload() -- dipakai oleh robot.ts sebagai bagian dari
 * isValidTargetFormat(), supaya bentuk fungsinya konsisten dengan
 * isValidPhone/isValidBankAccount/isValidEwallet meski validasi berat
 * (CRC + TLV) sudah selesai duluan di route handler sebelum sampai sini.
 */
export function isValidNmidFormat(value: string): boolean {
  return NMID_PATTERN.test(value);
}
