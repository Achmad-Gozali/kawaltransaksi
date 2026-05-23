import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { getSupabaseAdmin } from '../../core/supabase';
import { analyzeChronologyText, analyzeEvidenceImage, AnalysisResult } from '../../core/groq';
import { verifyTurnstile } from '../../core/turnstile';
import { sendReportCreatedEmail, sendNewReportAdminEmail, sendReportStatusChangedEmail } from '../../core/resend';
import type { Env } from '../../types';

const reports = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string };
}>();

// ── Konstanta ─────────────────────────────────────────────────────────────────

const THRESHOLD = {
  CHRONOLOGY_SCORE_MIN: 95,
  CHRONOLOGY_LENGTH_MIN: 300,
  PHOTO_AUTHENTICITY_MIN: 95,
  PHOTO_RELEVANCE_MIN: 95,
  PHOTO_REQUIRED: true,
  PHOTO_MIN_COUNT: 1,
};

const LIMITS = {
  TARGET_NUMBER: 32,
  TARGET_NAME: 100,
  BANK_NAME: 100,
  PLATFORM: 100,
  LINK_URL: 500,
  CHRONOLOGY_MIN: 20,
  CHRONOLOGY_MAX: 5000,
  SOCIAL_ACCOUNT: 100,
  SOCIAL_ACCOUNTS_COUNT: 10,
  LOSS_AMOUNT_MAX: 999_999_999_999,
  STORE_NAME: 150,
  ANALYZE_TEXT_PER_DAY: 5,
  ANALYZE_IMAGE_PER_DAY: 5,
};

const ALLOWED_STORAGE_HOSTNAMES = [
  "xcljigqrbwtqkiuraohr.supabase.co",
  "cdn.kawaltransaksi.com",
];

const MAX_EVIDENCE_FILES = 10;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_TARGET_TYPES = ["phone", "bank_account", "ewallet"] as const;

const VALID_CATEGORIES = [
  "Jual Beli Online", "Toko Online Palsu", "Barang Tidak Sesuai", "COD Palsu", "Dropship Fiktif",
  "Investasi Bodong", "Trading Palsu", "Arisan Online", "Pinjaman Online", "Koperasi Bodong",
  "Binary Option", "Kripto Palsu", "Money Game", "MLM Ilegal",
  "Phishing / Soceng", "Modus Kurir/APK", "Impersonasi", "SIM Swap", "Pencurian Data",
  "Lowongan Kerja Palsu", "Jasa Tidak Dikerjakan", "Freelance Palsu", "Kerja Online Palsu", "Joki / Titip Beli Palsu",
  "Rental / Sewa Fiktif", "Kos / Kontrakan Palsu", "Tiket Palsu",
  "Penipuan Percintaan", "Pinjam Uang Tidak Bayar", "Hadiah / Undian Palsu",
  "Donasi Palsu", "Pura-pura Kecelakaan", "Penipuan Umroh/Haji",
  "Lainnya",
] as const;

const VALID_PROVINCES = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
  "Jambi", "Bengkulu", "Sumatera Selatan", "Kepulauan Bangka Belitung",
  "Lampung", "Banten", "DKI Jakarta", "Jawa Barat", "Jawa Tengah",
  "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat",
  "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
  "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat",
  "Sulawesi Selatan", "Sulawesi Tenggara", "Maluku", "Maluku Utara",
  "Papua Barat", "Papua Barat Daya", "Papua", "Papua Pegunungan",
  "Papua Selatan", "Papua Tengah",
] as const;

// ── Helper functions ──────────────────────────────────────────────────────────

function isValidEvidenceUrl(url: unknown): boolean {
  if (typeof url !== "string" || url.trim() === "") return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_STORAGE_HOSTNAMES.includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function sanitizeEvidenceUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.filter(isValidEvidenceUrl).slice(0, MAX_EVIDENCE_FILES) as string[];
}

function isValidHttpUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url.trim()) return null;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? url.trim() : null;
  } catch {
    return null;
  }
}

function sanitizeText(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

function sanitizeChronology(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

function sanitizeArray(arr: string[]): string[] {
  return arr.map((s) => sanitizeText(s)).filter(Boolean);
}

function determineAutoStatus(params: {
  chronologyScore: number;
  chronologyLength: number;
  riskLevel: "low" | "medium" | "high";
  photoResult: AnalysisResult | null;
  hasPhoto: boolean;
  photoCount: number;
}): "pending" | "verified" {
  const { chronologyScore, chronologyLength, riskLevel, photoResult, hasPhoto, photoCount } = params;

  if (chronologyLength < THRESHOLD.CHRONOLOGY_LENGTH_MIN) return "pending";
  if (chronologyScore < THRESHOLD.CHRONOLOGY_SCORE_MIN) return "pending";
  if (riskLevel !== "high") return "pending";
  if (THRESHOLD.PHOTO_REQUIRED && !hasPhoto) return "pending";
  if (photoCount < THRESHOLD.PHOTO_MIN_COUNT) return "pending";

  if (hasPhoto && photoResult) {
    if (photoResult.authenticity_score < THRESHOLD.PHOTO_AUTHENTICITY_MIN) return "pending";
    if (photoResult.relevance_score < THRESHOLD.PHOTO_RELEVANCE_MIN) return "pending";
    if (!photoResult.has_concrete_evidence) return "pending";
    if (!photoResult.is_likely_authentic) return "pending";
    return "verified";
  }

  return "pending";
}

async function checkAnalyzeRateLimit(
  limiter: KVNamespace | undefined,
  userId: string,
  type: 'text' | 'image',
  maxPerDay: number
): Promise<{ blocked: boolean; count: number }> {
  if (!limiter) return { blocked: false, count: 0 };
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `analyze_${type}_${userId}_${today}`;
    const raw = await limiter.get(key);
    const count = raw ? parseInt(raw) : 0;
    if (count >= maxPerDay) return { blocked: true, count };
    await limiter.put(key, (count + 1).toString(), { expirationTtl: 86400 });
    return { blocked: false, count: count + 1 };
  } catch {
    return { blocked: false, count: 0 };
  }
}

async function checkReportRateLimit(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string
): Promise<{ blocked: boolean; reason?: string }> {
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

  const { data, error } = await supabase
    .from("reports")
    .select("created_at")
    .eq("reporter_id", userId)
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false });

  if (error) return { blocked: false };

  const now = Date.now();
  const oneHourAgo = now - 3600000;

  const hourCount = (data ?? []).filter(
    (r) => new Date(r.created_at).getTime() >= oneHourAgo
  ).length;

  const dayCount = (data ?? []).length;

  if (hourCount >= 3) {
    return { blocked: true, reason: "Terlalu banyak laporan dalam 1 jam. Coba lagi nanti." };
  }
  if (dayCount >= 10) {
    return { blocked: true, reason: "Batas laporan harian tercapai." };
  }

  return { blocked: false };
}

// ── [FIXED] runAiAnalysisAndUpdate — kirim email saat status berubah ke verified ──

async function runAiAnalysisAndUpdate(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  reportId: string,
  sanitizedChronology: string,
  evidenceUrls: string[],
  groqApiKey: string,
  resendApiKey: string,        // ← tambahan
  reporterEmail: string | null, // ← tambahan
  reporterName: string | null,  // ← tambahan
  targetNumber: string,         // ← tambahan
): Promise<void> {
  try {
    const hasPhoto = evidenceUrls.length > 0;
    const textResult = await analyzeChronologyText(sanitizedChronology, groqApiKey);

    let photoResult: AnalysisResult | null = null;
    if (hasPhoto && evidenceUrls[0]) {
      try {
        const imgRes = await fetch(evidenceUrls[0]);
        if (imgRes.ok) {
          const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
          const buffer = await imgRes.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          const base64 = btoa(binary);
          photoResult = await analyzeEvidenceImage(base64, contentType, groqApiKey);
        }
      } catch {
        photoResult = null;
      }
    }

    const autoStatus = determineAutoStatus({
      chronologyScore: textResult.chronology_score,
      chronologyLength: sanitizedChronology.length,
      riskLevel: textResult.risk_level,
      photoResult,
      hasPhoto,
      photoCount: evidenceUrls.length,
    });

    if (autoStatus === "verified") {
      await supabase
        .from("reports")
        .update({ status: "verified" })
        .eq("id", reportId);

      // [FIX] Kirim email notifikasi status verified ke user
      if (reporterEmail) {
        await sendReportStatusChangedEmail({
          to: reporterEmail,
          fullName: reporterName ?? "Pengguna",
          targetNumber,
          newStatus: "verified",
          reportUrl: `https://kawaltransaksi.com/check/${targetNumber}`,
          apiKey: resendApiKey,
        }).catch((err) => console.error("[EMAIL] Gagal kirim status verified:", err));
      }
    }
  } catch {
    // Fail silently — laporan tetap tersimpan dengan status "pending"
  }
}

// ── POST /api/reports ─────────────────────────────────────────────────────────

reports.post("/", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const supabase = getSupabaseAdmin(c.env);

    if (!body.turnstile_token) {
      return c.json({ success: false, message: "Verifikasi CAPTCHA diperlukan." }, 400);
    }
    const turnstileValid = await verifyTurnstile(body.turnstile_token, c.env.TURNSTILE_SECRET_KEY);
    if (!turnstileValid) {
      return c.json({ success: false, message: "Verifikasi CAPTCHA gagal." }, 400);
    }

    const rawNumber = String(body.target_number ?? "").replace(/[^0-9]/g, "");
    if (rawNumber.length > LIMITS.TARGET_NUMBER) {
      return c.json({ success: false, message: `Nomor terlalu panjang. Maks ${LIMITS.TARGET_NUMBER} karakter.` }, 400);
    }
    if (body.target_name && String(body.target_name).length > LIMITS.TARGET_NAME) {
      return c.json({ success: false, message: `Nama pemilik terlalu panjang. Maks ${LIMITS.TARGET_NAME} karakter.` }, 400);
    }
    if (body.bank_name && String(body.bank_name).length > LIMITS.BANK_NAME) {
      return c.json({ success: false, message: `Nama bank terlalu panjang. Maks ${LIMITS.BANK_NAME} karakter.` }, 400);
    }
    if (body.platform && String(body.platform).length > LIMITS.PLATFORM) {
      return c.json({ success: false, message: `Nama platform terlalu panjang. Maks ${LIMITS.PLATFORM} karakter.` }, 400);
    }
    if (body.link_url && String(body.link_url).length > LIMITS.LINK_URL) {
      return c.json({ success: false, message: `URL terlalu panjang. Maks ${LIMITS.LINK_URL} karakter.` }, 400);
    }
    if (body.store_name && String(body.store_name).length > LIMITS.STORE_NAME) {
      return c.json({ success: false, message: `Nama toko terlalu panjang. Maks ${LIMITS.STORE_NAME} karakter.` }, 400);
    }
    if (body.suspect_city && !VALID_PROVINCES.includes(body.suspect_city)) {
      return c.json({ success: false, message: "Provinsi tidak valid." }, 400);
    }

    const chronologyRaw = String(body.chronology ?? "");
    if (chronologyRaw.trim().length < LIMITS.CHRONOLOGY_MIN) {
      return c.json({ success: false, message: `Kronologi minimal ${LIMITS.CHRONOLOGY_MIN} karakter.` }, 400);
    }
    if (chronologyRaw.length > LIMITS.CHRONOLOGY_MAX) {
      return c.json({ success: false, message: `Kronologi terlalu panjang. Maks ${LIMITS.CHRONOLOGY_MAX} karakter.` }, 400);
    }
    if (body.loss_amount && Number(body.loss_amount) > LIMITS.LOSS_AMOUNT_MAX) {
      return c.json({ success: false, message: "Nominal kerugian tidak valid." }, 400);
    }

    if (Array.isArray(body.social_media_accounts)) {
      if (body.social_media_accounts.length > LIMITS.SOCIAL_ACCOUNTS_COUNT) {
        return c.json({ success: false, message: `Maksimal ${LIMITS.SOCIAL_ACCOUNTS_COUNT} akun media sosial.` }, 400);
      }
      const tooLong = body.social_media_accounts.some(
        (s: unknown) => typeof s === "string" && s.length > LIMITS.SOCIAL_ACCOUNT
      );
      if (tooLong) {
        return c.json({ success: false, message: `Akun media sosial terlalu panjang. Maks ${LIMITS.SOCIAL_ACCOUNT} karakter per akun.` }, 400);
      }
    }

    if (!body.target_type || !VALID_TARGET_TYPES.includes(body.target_type)) {
      return c.json({ success: false, message: `Jenis laporan tidak valid.` }, 400);
    }
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return c.json({ success: false, message: `Kategori tidak valid.` }, 400);
    }

    const rateLimitResult = await checkReportRateLimit(supabase, userId);
    if (rateLimitResult.blocked) {
      return c.json({ success: false, message: rateLimitResult.reason }, 429);
    }

    const cleanNumberCheck = String(body.target_number).replace(/[^0-9]/g, "");
    const { count: duplicateCount } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("reporter_id", userId)
      .eq("target_number", cleanNumberCheck)
      .neq("status", "withdrawn");

    if ((duplicateCount ?? 0) > 0) {
      return c.json({ success: false, message: "Kamu sudah pernah melaporkan nomor ini sebelumnya." }, 409);
    }

    const cleanNumber = String(body.target_number).replace(/[^0-9]/g, "");
    const sanitizedTargetName = body.target_name ? sanitizeText(String(body.target_name)) : null;
    const sanitizedChronology = sanitizeChronology(String(body.chronology));
    const sanitizedBankName = body.bank_name ? sanitizeText(String(body.bank_name)) : null;
    const sanitizedPlatform = body.platform ? sanitizeText(String(body.platform)) : null;
    const sanitizedSocialAccounts = body.social_media_accounts ? sanitizeArray(body.social_media_accounts as string[]) : [];
    const sanitizedStoreName = body.store_name ? sanitizeText(String(body.store_name)) : null;
    const sanitizedSuspectCity = body.suspect_city ? sanitizeText(String(body.suspect_city)) : null;
    const sanitizedLinkUrl = isValidHttpUrl(body.link_url);

    const rawTargetNumbers = Array.isArray(body.target_numbers) ? body.target_numbers : [];
    const cleanTargetNumbers = rawTargetNumbers
      .map((item: unknown) => {
        if (typeof item === "object" && item !== null && "number" in item) {
          const obj = item as { number: string; type?: string; bank?: string; name?: string };
          const num = String(obj.number).replace(/[^0-9]/g, "");
          if (!num || num.length > LIMITS.TARGET_NUMBER) return null;
          return { number: num, type: obj.type ?? "phone", bank: obj.bank ?? null, name: obj.name ?? null };
        }
        const num = String(item).replace(/[^0-9]/g, "");
        if (!num || num.length > LIMITS.TARGET_NUMBER) return null;
        return { number: num, type: "phone", bank: null, name: null };
      })
      .filter(Boolean)
      .slice(0, 5);

    const primaryInList = cleanTargetNumbers.some((t: any) => t?.number === cleanNumber);
    if (!primaryInList) {
      cleanTargetNumbers.unshift({
        number: cleanNumber,
        type: body.target_type ?? "phone",
        bank: body.bank_name ?? null,
        name: sanitizedTargetName ?? null,
      });
    }

    const evidenceUrls = sanitizeEvidenceUrls(
      body.evidence_urls?.length > 0
        ? body.evidence_urls
        : body.evidence_url ? [body.evidence_url] : []
    );
    const suspectPhotoUrl = isValidEvidenceUrl(body.suspect_photo_url) ? (body.suspect_photo_url as string) : null;

    const { data: insertedReport, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: userId,
        target_number: cleanNumber,
        target_name: sanitizedTargetName,
        target_type: body.target_type,
        category: body.category,
        chronology: sanitizedChronology,
        evidence_url: evidenceUrls[0] || null,
        evidence_urls: evidenceUrls,
        status: "pending",
        bank_name: sanitizedBankName,
        loss_amount: body.loss_amount || null,
        incident_date: body.incident_date || null,
        platform: sanitizedPlatform,
        link_url: sanitizedLinkUrl,
        social_media_accounts: sanitizedSocialAccounts,
        has_other_victims: body.has_other_victims || null,
        reported_to: body.reported_to ?? [],
        suspect_photo_url: suspectPhotoUrl,
        target_numbers: cleanTargetNumbers,
        store_name: sanitizedStoreName,
        suspect_city: sanitizedSuspectCity,
      })
      .select("id")
      .single();

    if (error || !insertedReport) {
      console.error("[REPORTS] Insert error:", error?.message);
      return c.json({ success: false, message: "Gagal menyimpan laporan." }, 500);
    }

    const reportId = insertedReport.id;

    c.executionCtx.waitUntil(
      Promise.all([
        (async () => {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", userId)
              .single();

            const reportUrl = `https://kawaltransaksi.com/check/${cleanNumber}`;

            const emailPromises: Promise<void>[] = [];

            if (profile?.email) {
              emailPromises.push(
                sendReportCreatedEmail({
                  to: profile.email,
                  fullName: profile.full_name ?? "Pengguna",
                  targetNumber: cleanNumber,
                  category: body.category,
                  status: "pending",
                  reportUrl,
                  apiKey: c.env.RESEND_API_KEY,
                }).catch((err) => console.error("[EMAIL] Gagal kirim ke user:", err))
              );
            }

            if (c.env.ADMIN_EMAIL) {
              emailPromises.push(
                sendNewReportAdminEmail({
                  adminEmail: c.env.ADMIN_EMAIL,
                  reporterName: profile?.full_name ?? "Pengguna",
                  targetNumber: cleanNumber,
                  category: body.category,
                  status: "pending",
                  reportUrl: "https://kawaltransaksi.com/admin",
                  apiKey: c.env.RESEND_API_KEY,
                }).catch((err) => console.error("[EMAIL] Gagal kirim ke admin:", err))
              );
            }

            await Promise.all(emailPromises);

            // [FIX] Jalankan AI analysis setelah profile sudah diambil,
            // supaya bisa langsung passing email & nama tanpa query ulang
            await runAiAnalysisAndUpdate(
              supabase,
              reportId,
              sanitizedChronology,
              evidenceUrls,
              c.env.GROQ_API_KEY,
              c.env.RESEND_API_KEY,
              profile?.email ?? null,
              profile?.full_name ?? null,
              cleanNumber,
            );
          } catch (err) {
            console.error("[EMAIL] Error notifikasi:", err);
          }
        })(),
      ])
    );

    return c.json({ success: true, slug: cleanNumber, status: "pending" }, 201);
  } catch {
    return c.json({ success: false, message: "Terjadi kesalahan server." }, 500);
  }
});

// ── POST /api/reports/analyze/image ──────────────────────────────────────────

reports.post("/analyze/image", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");

    const { blocked, count } = await checkAnalyzeRateLimit(
      c.env.LIMITER,
      userId,
      'image',
      LIMITS.ANALYZE_IMAGE_PER_DAY
    );
    if (blocked) {
      return c.json({
        success: false,
        message: `Batas analisis foto tercapai (${LIMITS.ANALYZE_IMAGE_PER_DAY}x per hari). Coba lagi besok.`,
      }, 429);
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return c.json({ success: false, message: "File tidak ditemukan." }, 400);
    if (file.size > 5 * 1024 * 1024) return c.json({ success: false, message: "Ukuran file melebihi 5MB." }, 400);
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return c.json({ success: false, message: "Tipe file tidak didukung." }, 400);
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    const result = await analyzeEvidenceImage(base64, file.type, c.env.GROQ_API_KEY);
    return c.json({ success: true, data: result, remaining: LIMITS.ANALYZE_IMAGE_PER_DAY - count });
  } catch (err) {
    console.error("[REPORTS] Analyze image error:", err);
    return c.json({ success: false, message: "Sistem analisis sedang tidak tersedia." }, 500);
  }
});

// ── POST /api/reports/analyze/text ───────────────────────────────────────────

reports.post("/analyze/text", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");

    const { blocked, count } = await checkAnalyzeRateLimit(
      c.env.LIMITER,
      userId,
      'text',
      LIMITS.ANALYZE_TEXT_PER_DAY
    );
    if (blocked) {
      return c.json({
        success: false,
        message: `Batas analisis kronologi tercapai (${LIMITS.ANALYZE_TEXT_PER_DAY}x per hari). Coba lagi besok.`,
      }, 429);
    }

    const { chronology } = await c.req.json();

    if (!chronology || typeof chronology !== "string" || chronology.trim().length < 20) {
      return c.json({ success: false, message: "Kronologi terlalu singkat." }, 400);
    }
    if (chronology.length > 5000) {
      return c.json({ success: false, message: "Kronologi terlalu panjang. Maks 5000 karakter." }, 400);
    }

    const sanitized = sanitizeChronology(chronology);
    const result = await analyzeChronologyText(sanitized, c.env.GROQ_API_KEY);
    return c.json({ success: true, data: result, remaining: LIMITS.ANALYZE_TEXT_PER_DAY - count });
  } catch {
    return c.json({ success: false, message: "Sistem analisis sedang tidak tersedia." }, 500);
  }
});

// ── POST /api/reports/withdraw ────────────────────────────────────────────────

reports.post("/withdraw", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const { reportId } = await c.req.json();

    if (!reportId || !UUID_REGEX.test(reportId)) {
      return c.json({ success: false, message: "ID laporan tidak valid." }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("id, status, reporter_id, target_number")
      .eq("id", reportId)
      .eq("reporter_id", userId)
      .single();

    if (fetchError || !report) return c.json({ success: false, message: "Laporan tidak ditemukan." }, 404);
    if (report.status === "withdrawn") return c.json({ success: false, message: "Laporan sudah dalam status revisi." }, 400);

    const { error } = await supabase
      .from("reports")
      .update({ status: "withdrawn" })
      .eq("id", reportId)
      .eq("reporter_id", userId);

    if (error) throw error;

    // [FIX] Kirim email notifikasi status withdrawn ke user
    c.executionCtx.waitUntil(
      (async () => {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", userId)
            .single();

          if (profile?.email) {
            await sendReportStatusChangedEmail({
              to: profile.email,
              fullName: profile.full_name ?? "Pengguna",
              targetNumber: report.target_number,
              newStatus: "withdrawn",
              reportUrl: `https://kawaltransaksi.com/dashboard/laporan/${reportId}`,
              apiKey: c.env.RESEND_API_KEY,
            }).catch((err) => console.error("[EMAIL] Gagal kirim status withdrawn:", err));
          }
        } catch (err) {
          console.error("[EMAIL] Error notifikasi withdraw:", err);
        }
      })()
    );

    return c.json({ success: true, message: "Laporan berhasil ditarik." });
  } catch {
    return c.json({ success: false, message: "Terjadi kesalahan server." }, 500);
  }
});

// ── PUT /api/reports/:reportId ────────────────────────────────────────────────

reports.put("/:reportId", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const reportId = c.req.param("reportId");

    if (!UUID_REGEX.test(reportId)) {
      return c.json({ success: false, message: "ID laporan tidak valid." }, 400);
    }

    const body = await c.req.json();

    const chronologyRaw = String(body.chronology ?? "");
    if (chronologyRaw.trim().length < LIMITS.CHRONOLOGY_MIN) {
      return c.json({ success: false, message: `Kronologi minimal ${LIMITS.CHRONOLOGY_MIN} karakter.` }, 400);
    }
    if (chronologyRaw.length > LIMITS.CHRONOLOGY_MAX) {
      return c.json({ success: false, message: `Kronologi terlalu panjang. Maks ${LIMITS.CHRONOLOGY_MAX} karakter.` }, 400);
    }
    if (body.target_name && String(body.target_name).length > LIMITS.TARGET_NAME) {
      return c.json({ success: false, message: `Nama pemilik terlalu panjang. Maks ${LIMITS.TARGET_NAME} karakter.` }, 400);
    }
    if (body.bank_name && String(body.bank_name).length > LIMITS.BANK_NAME) {
      return c.json({ success: false, message: `Nama bank terlalu panjang. Maks ${LIMITS.BANK_NAME} karakter.` }, 400);
    }
    if (body.platform && String(body.platform).length > LIMITS.PLATFORM) {
      return c.json({ success: false, message: `Nama platform terlalu panjang. Maks ${LIMITS.PLATFORM} karakter.` }, 400);
    }
    if (body.link_url && String(body.link_url).length > LIMITS.LINK_URL) {
      return c.json({ success: false, message: `URL terlalu panjang. Maks ${LIMITS.LINK_URL} karakter.` }, 400);
    }
    if (body.store_name && String(body.store_name).length > LIMITS.STORE_NAME) {
      return c.json({ success: false, message: `Nama toko terlalu panjang. Maks ${LIMITS.STORE_NAME} karakter.` }, 400);
    }
    if (body.suspect_city && !VALID_PROVINCES.includes(body.suspect_city)) {
      return c.json({ success: false, message: "Provinsi tidak valid." }, 400);
    }
    if (Array.isArray(body.social_media_accounts)) {
      if (body.social_media_accounts.length > LIMITS.SOCIAL_ACCOUNTS_COUNT) {
        return c.json({ success: false, message: `Maksimal ${LIMITS.SOCIAL_ACCOUNTS_COUNT} akun media sosial.` }, 400);
      }
      const tooLong = body.social_media_accounts.some(
        (s: unknown) => typeof s === "string" && s.length > LIMITS.SOCIAL_ACCOUNT
      );
      if (tooLong) {
        return c.json({ success: false, message: `Akun media sosial terlalu panjang. Maks ${LIMITS.SOCIAL_ACCOUNT} karakter per akun.` }, 400);
      }
    }

    const supabase = getSupabaseAdmin(c.env);
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("id, status, reporter_id, target_number")
      .eq("id", reportId)
      .eq("reporter_id", userId)
      .single();

    if (fetchError || !report) return c.json({ success: false, message: "Laporan tidak ditemukan." }, 404);
    if (report.status !== "withdrawn") {
      return c.json({ success: false, message: 'Hanya laporan "Sedang Direvisi" yang dapat diedit.' }, 400);
    }

    const editedEvidenceUrls = sanitizeEvidenceUrls(body.evidence_urls);
    const editedSuspectPhotoUrl = isValidEvidenceUrl(body.suspect_photo_url) ? (body.suspect_photo_url as string) : null;
    const editedLinkUrl = isValidHttpUrl(body.link_url);

    const { error } = await supabase
      .from("reports")
      .update({
        target_name: body.target_name ? sanitizeText(String(body.target_name)) : null,
        category: body.category,
        chronology: sanitizeChronology(String(body.chronology)),
        bank_name: body.bank_name ? sanitizeText(String(body.bank_name)) : null,
        loss_amount: body.loss_amount || null,
        incident_date: body.incident_date || null,
        platform: body.platform ? sanitizeText(String(body.platform)) : null,
        link_url: editedLinkUrl,
        social_media_accounts: body.social_media_accounts ? sanitizeArray(body.social_media_accounts as string[]) : [],
        has_other_victims: body.has_other_victims || null,
        reported_to: body.reported_to ?? [],
        evidence_urls: editedEvidenceUrls,
        evidence_url: editedEvidenceUrls[0] || null,
        suspect_photo_url: editedSuspectPhotoUrl,
        store_name: body.store_name ? sanitizeText(String(body.store_name)) : null,
        suspect_city: body.suspect_city ? sanitizeText(String(body.suspect_city)) : null,
        status: "pending",
      })
      .eq("id", reportId)
      .eq("reporter_id", userId);

    if (error) throw error;

    // [FIX] Kirim email notifikasi status pending (resubmit) ke user
    c.executionCtx.waitUntil(
      (async () => {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", userId)
            .single();

          if (profile?.email) {
            await sendReportStatusChangedEmail({
              to: profile.email,
              fullName: profile.full_name ?? "Pengguna",
              targetNumber: report.target_number,
              newStatus: "pending",
              reportUrl: `https://kawaltransaksi.com/dashboard/laporan/${reportId}`,
              apiKey: c.env.RESEND_API_KEY,
            }).catch((err) => console.error("[EMAIL] Gagal kirim status pending:", err));
          }
        } catch (err) {
          console.error("[EMAIL] Error notifikasi resubmit:", err);
        }
      })()
    );

    return c.json({ success: true, message: "Laporan berhasil diperbarui." });
  } catch {
    return c.json({ success: false, message: "Terjadi kesalahan server." }, 500);
  }
});

export default reports;