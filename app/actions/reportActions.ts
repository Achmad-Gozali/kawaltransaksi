"use server";

import { createClient } from "@/lib/supabase-server";
import { analyzeChronologyText } from "@/lib/groq";

/**
 * Submit a scam report to Supabase
 * Auto-verify jika AI confidence tinggi
 */
export async function submitReport(formData: {
  target_number: string;
  target_name: string;
  target_type: "phone" | "bank_account";
  category: string;
  chronology: string;
  evidence_url: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { success: false, error: "Anda harus login terlebih dahulu." };

  const cleanNumber = formData.target_number.replace(/[^0-9]/g, "");
  if (cleanNumber.length < 8 || cleanNumber.length > 16) {
    return { success: false, error: "Nomor target tidak valid (8-16 digit)." };
  }

  const trimmedChronology = formData.chronology?.trim() ?? "";
  if (trimmedChronology.length < 20) {
    return {
      success: false,
      error: "Kronologi terlalu pendek. Minimal 20 karakter.",
    };
  }

  // ===== AI AUTO-VERIFY =====
  let autoStatus: "pending" | "verified" = "pending";
  try {
    const aiResult = await analyzeChronologyText(trimmedChronology);
    const hasEvidence = !!formData.evidence_url;
    const detailedChronology = trimmedChronology.length >= 50;

    if (aiResult.risk_level === "high") {
      autoStatus = "verified";
    } else if (
      aiResult.risk_level === "medium" &&
      hasEvidence &&
      detailedChronology
    ) {
      autoStatus = "verified";
    }
  } catch (err) {
    console.error("AI auto-verify error (fallback to pending):", err);
  }

  // ✅ cast ke unknown dulu lalu any — ini pattern yang lebih aman
  // Root cause: manual Database type di types/database.ts tidak 100% match
  // dengan Supabase client generated types, jadi overload resolution gagal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("reports") as any).insert({
    reporter_id: user.id,
    target_number: cleanNumber,
    target_name: formData.target_name?.trim() || null,
    target_type: formData.target_type,
    category: formData.category,
    chronology: trimmedChronology,
    evidence_url: formData.evidence_url,
    status: autoStatus,
  });

  if (error) {
    console.error("Report insert error:", error);
    return {
      success: false,
      error: "Gagal mengirim laporan. Silakan coba lagi.",
    };
  }

  return { success: true, slug: cleanNumber, status: autoStatus };
}

/**
 * Upload evidence file to Supabase Storage
 */
export async function uploadEvidence(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Anda harus login." };

  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "File tidak ditemukan." };

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "Ukuran file melebihi 5MB." };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Format file tidak didukung. Gunakan JPG, PNG, atau WebP.",
    };
  }

  const ext = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("evidence")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Gagal mengupload file." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("evidence").getPublicUrl(fileName);
  return { success: true, url: publicUrl };
}

/**
 * AI Analysis - analyze evidence image via Groq
 */
export async function analyzeEvidence(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "File tidak ditemukan." };

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File terlalu besar untuk dianalisis." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const { analyzeEvidenceImage } = await import("@/lib/groq");
    const result = await analyzeEvidenceImage(base64, file.type);
    return { success: true, data: result };
  } catch (err) {
    console.error("AI analysis error:", err);
    return {
      success: false,
      error: "Gagal menganalisis bukti. Silakan coba lagi.",
    };
  }
}

/**
 * AI Analysis - analyze chronology text via Groq
 */
export async function analyzeChronology(chronology: string) {
  if (!chronology || chronology.trim().length < 20) {
    return {
      success: false,
      error: "Kronologi terlalu pendek untuk dianalisis.",
    };
  }

  try {
    const result = await analyzeChronologyText(chronology);
    return { success: true, data: result };
  } catch (err) {
    console.error("Chronology analysis error:", err);
    return { success: false, error: "Gagal menganalisis kronologi." };
  }
}