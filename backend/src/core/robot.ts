import { db } from "./db.js";
import { reports, users } from "./schema.js";
import { getFileSizeFromR2 } from "./storage.js";
import { isValidNmidFormat } from "./qris.js";
import { and, eq, gte, sql } from "drizzle-orm";

const MIN_FILE_SIZE_BYTES = 50 * 1024; // 50KB

// ── Helpers ────────────────────────────────────────────────────────────────

function stripWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function countWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function countUniqueWords(text: string): number {
  const words = countWords(text).map(w => w.toLowerCase());
  return new Set(words).size;
}

function letterRatio(text: string): number {
  const letters = (text.match(/[a-zA-ZÀ-ÿ]/g) ?? []).length;
  return text.length === 0 ? 0 : letters / text.length;
}

function maxWordRepetitionRatio(text: string): number {
  const words = countWords(text).map(w => w.toLowerCase());
  if (words.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] ?? 0) + 1;
  return Math.max(...Object.values(freq)) / words.length;
}

function isOnlyNumbersAndSpaces(text: string): boolean {
  return /^[\d\s\-+().]+$/.test(text.trim());
}

function isRepetitiveChars(text: string): boolean {
  const stripped = text.replace(/\s/g, '');
  if (stripped.length === 0) return false;
  return new Set(stripped.toLowerCase()).size <= 2;
}

const SPAM_WORDS = new Set([
  'test', 'tes', 'coba', 'aaa', 'bbb', 'xxx', 'yyy', 'zzz',
  'asdf', 'qwerty', 'lorem', 'ipsum', 'dummy', 'sample',
  'contoh', 'example', 'blabla', 'haha', 'wkwk', 'lol',
]);

function containsOnlySpamWords(text: string): boolean {
  const words = countWords(text).map(w => w.toLowerCase());
  if (words.length === 0) return false;
  return words.every(w => SPAM_WORDS.has(w));
}

function isValidPhone(value: string): boolean {
  const clean = value.replace(/[\s\-]/g, '');
  if (!/^(\+62|62|08)\d+$/.test(clean)) return false;
  const digits = clean.replace(/^\+62|^62|^0/, '');
  return digits.length >= 7 && digits.length <= 13;
}

function isValidBankAccount(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 20;
}

function isValidEwallet(value: string): boolean {
  return isValidPhone(value);
}

function isValidTargetFormat(targetType: string, targetValue: string): boolean {
  switch (targetType) {
    case "phone":        return isValidPhone(targetValue);
    case "bank_account": return isValidBankAccount(targetValue);
    case "ewallet":      return isValidEwallet(targetValue);
    // Untuk qris, targetValue di titik ini adalah NMID yang SUDAH lolos
    // parseQrisPayload() (CRC + struktur TLV tervalidasi penuh) di route
    // handler sebelum checkSpam() dipanggil -- ini cuma sanity check
    // ringan atas bentuknya, bukan validasi berat kedua.
    case "qris":          return isValidNmidFormat(targetValue);
    default:             return false;
  }
}

function isSuspiciousNumber(targetType: string, targetValue: string): boolean {
  // bank_account: nomor rekening tidak punya pola "berurutan/sama semua"
  // yang bermakna. qris: targetValue (NMID) tidak pernah diketik user --
  // ia hasil decode mesin dari foto QR, jadi heuristik "diketik asal"
  // (dirancang untuk menangkap nomor HP/rekening ketikan iseng) tidak
  // relevan untuknya.
  if (targetType === "bank_account" || targetType === "qris") return false;
  const digits = targetValue.replace(/\D/g, '');
  // Semua digit sama: 088888888888
  if (new Set(digits).size === 1) return true;
  // Berurutan naik: 01234567890
  const isAscending = digits.split('').every((d, i, arr) =>
    i === 0 || parseInt(d) === parseInt(arr[i - 1]) + 1
  );
  if (isAscending && digits.length >= 6) return true;
  return false;
}

// ── Spam Check ─────────────────────────────────────────────────────────────

export interface SpamCheckInput {
  userId:      string;
  targetType:  string;
  targetValue: string;
  description: string;
  chronology?: string;
}

export interface SpamCheckResult {
  rejected: boolean;
  reason?:  string;
}

export async function checkSpam(input: SpamCheckInput): Promise<SpamCheckResult> {
  const { userId, targetType, targetValue, description, chronology } = input;
  const text = stripWhitespace(chronology ?? description);

  // 1. Format nomor invalid
  if (!isValidTargetFormat(targetType, targetValue)) {
    return { rejected: true, reason: "Format nomor tidak valid." };
  }

  // 2. Deskripsi terlalu pendek (setelah strip whitespace)
  if (text.length < 20) {
    return { rejected: true, reason: "Deskripsi terlalu singkat. Minimal 20 karakter." };
  }

  // 3. Hanya angka dan spasi
  if (isOnlyNumbersAndSpaces(text)) {
    return { rejected: true, reason: "Deskripsi tidak valid. Ceritakan kronologi kejadian." };
  }

  // 4. Karakter repetitif (aaaaaa, 111111)
  if (isRepetitiveChars(text)) {
    return { rejected: true, reason: "Deskripsi tidak valid. Isi dengan kronologi yang jelas." };
  }

  // 5. Hanya kata-kata spam
  if (containsOnlySpamWords(text)) {
    return { rejected: true, reason: "Deskripsi mengandung konten tidak valid." };
  }

  // 6. Rasio huruf terlalu rendah (< 40%)
  if (letterRatio(text) < 0.4) {
    return { rejected: true, reason: "Deskripsi tidak valid. Gunakan teks yang dapat dibaca." };
  }

  // 7. Unique words terlalu sedikit (< 5 kata unik)
  if (countUniqueWords(text) < 5) {
    return { rejected: true, reason: "Deskripsi terlalu repetitif. Ceritakan kejadian dengan lebih detail." };
  }

  // 8. Repetisi kata terlalu tinggi (> 50% kata sama)
  if (maxWordRepetitionRatio(text) > 0.5) {
    return { rejected: true, reason: "Deskripsi terlalu repetitif. Ceritakan kejadian dengan lebih detail." };
  }

  // 9. Duplikat dalam 24 jam (user + target sama)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [duplicate] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(
      eq(reports.userId, userId),
      eq(reports.targetValue, targetValue),
      gte(reports.createdAt, since),
    ))
    .limit(1);

  if (duplicate) {
    return { rejected: true, reason: "Laporan duplikat. Kamu sudah melaporkan nomor ini dalam 24 jam terakhir." };
  }

  // 10. Rate limit: max 5 laporan per user per hari
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reports)
    .where(and(
      eq(reports.userId, userId),
      gte(reports.createdAt, todayStart),
    ));

  if ((countRow?.count ?? 0) >= 5) {
    return { rejected: true, reason: "Batas laporan harian tercapai. Maksimal 5 laporan per hari." };
  }

  return { rejected: false };
}

// ── Completeness Check ─────────────────────────────────────────────────────

export interface CompletenessInput {
  userId:       string;
  description:  string;
  chronology:   string | null | undefined;
  category:     string | null | undefined;
  amount:       number | null | undefined;
  targetType:   string;
  targetValue:  string;
  evidenceUrls: string[];
}

export type ReportStatus = "verified" | "pending";

/**
 * User "terpercaya" = sudah pernah punya laporan berstatus verified
 * sebelumnya. Existence check (LIMIT 1), bukan full count, karena kita cuma
 * butuh tahu ada/tidaknya -- ditopang index reports_user_id_status_idx.
 */
async function isTrustedUser(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.userId, userId), eq(reports.status, "verified")))
    .limit(1);
  return !!row;
}

export async function checkCompleteness(input: CompletenessInput): Promise<ReportStatus> {
  const { userId, description, chronology, category, amount, targetType, targetValue, evidenceUrls } = input;

  // 1. User baru (akun < 1 jam) → auto pending
  const [user] = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user) {
    const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
    if (accountAgeMs < 60 * 60 * 1000) return "pending";
  }

  // 2. Harus ada minimal 1 evidence
  if (!evidenceUrls || evidenceUrls.length === 0) return "pending";

  // 3. Evidence minimal 50KB (dicek langsung dari R2 -- evidence baru selalu
  // disimpan di R2 sejak migrasi 14 Juli 2026, bukan lagi di disk lokal)
  const evidenceSizes = await Promise.all(evidenceUrls.map(url => getFileSizeFromR2(url)));
  const hasValidFile  = evidenceSizes.some(size => size >= MIN_FILE_SIZE_BYTES);
  if (!hasValidFile) return "pending";

  // 4. Deskripsi minimal 20 karakter (setelah strip)
  const text = stripWhitespace(chronology ?? description);
  if (text.length < 20) return "pending";

  // 5. Minimal kata unik: 5 untuk user terpercaya (sudah pernah verified
  // sebelumnya -- 5 adalah floor yang sudah wajib dipenuhi semua orang lewat
  // checkSpam() gerbang #7, bukan angka baru yang lebih longgar dari itu),
  // 8 untuk user lain.
  const trusted = await isTrustedUser(userId);
  const minUniqueWords = trusted ? 5 : 8;
  if (countUniqueWords(text) < minUniqueWords) return "pending";

  // 6. Nomor mencurigakan → pending
  if (isSuspiciousNumber(targetType, targetValue)) return "pending";

  // 7. Kronologi tidak boleh cuma berisi target value
  if (text.replace(targetValue, '').trim().length < 15) return "pending";

  // 8. Amount masuk akal jika diisi
  if (amount !== null && amount !== undefined && amount > 0 && amount < 1000) return "pending";

  // 9. Kategori harus diisi
  if (!category?.trim()) return "pending";

  // 10. Kronologi harus diisi
  if (!chronology?.trim()) return "pending";

  // 11. Nominal kerugian harus diisi
  if (!amount || amount <= 0) return "pending";

  return "verified";
}