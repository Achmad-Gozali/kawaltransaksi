import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { getSupabaseAdmin } from '../lib/supabase';
import { analyzeChronologyText, analyzeEvidenceImage, AnalysisResult } from '../lib/groq';
import type { Env } from '../types';

const reports = new Hono<{ Bindings: Env; Variables: { userId: string; userEmail: string } }>();

const THRESHOLD = {
  CHRONOLOGY_SCORE_MIN: 90,
  CHRONOLOGY_LENGTH_MIN: 150,
  PHOTO_AUTHENTICITY_MIN: 90,
  PHOTO_RELEVANCE_MIN: 90,
};

// FIX: Whitelist target_type dan category
const VALID_TARGET_TYPES = ['phone', 'bank_account', 'ewallet'] as const;
const VALID_CATEGORIES = [
  'Jual Beli Online',
  'Investasi Bodong',
  'Pinjaman Online',
  'Phishing / Soceng',
  'Modus Kurir/APK',
  'Lainnya',
] as const;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeText(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;').trim();
}

function sanitizeChronology(input: string): string {
  return input.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '').trim();
}

function sanitizeArray(arr: string[]): string[] {
  return arr.map(s => sanitizeText(s)).filter(Boolean);
}

function determineAutoStatus(params: {
  chronologyScore: number;
  chronologyLength: number;
  riskLevel: 'low' | 'medium' | 'high';
  photoResult: AnalysisResult | null;
  hasPhoto: boolean;
}): 'pending' | 'verified' {
  const { chronologyScore, chronologyLength, riskLevel, photoResult, hasPhoto } = params;
  if (chronologyLength < THRESHOLD.CHRONOLOGY_LENGTH_MIN) return 'pending';
  if (chronologyScore < THRESHOLD.CHRONOLOGY_SCORE_MIN) return 'pending';
  if (riskLevel !== 'high') return 'pending';
  if (hasPhoto && photoResult) {
    if (photoResult.authenticity_score < THRESHOLD.PHOTO_AUTHENTICITY_MIN) return 'pending';
    if (photoResult.relevance_score < THRESHOLD.PHOTO_RELEVANCE_MIN) return 'pending';
    if (!photoResult.has_concrete_evidence) return 'pending';
    if (!photoResult.is_likely_authentic) return 'pending';
    return 'verified';
  }
  if (!hasPhoto && chronologyScore >= 95) return 'verified';
  return 'pending';
}

// ── POST /api/reports ─────────────────────────────────────────────────────────
reports.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const supabase = getSupabaseAdmin(c.env);

    // Rate limit: maks 10 laporan per hari
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { count: todayCount } = await supabase.from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('reporter_id', userId).gte('created_at', oneDayAgo);

    if ((todayCount ?? 0) >= 10) {
      return c.json({ success: false, message: 'Batas laporan harian tercapai.' }, 429);
    }

    // FIX: Validasi target_type dan category dengan whitelist
    if (!body.target_type || !VALID_TARGET_TYPES.includes(body.target_type)) {
      return c.json({
        success: false,
        message: `Jenis laporan tidak valid. Nilai yang diizinkan: ${VALID_TARGET_TYPES.join(', ')}.`,
      }, 400);
    }

    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return c.json({
        success: false,
        message: `Kategori tidak valid. Nilai yang diizinkan: ${VALID_CATEGORIES.join(', ')}.`,
      }, 400);
    }

    const cleanNumber = String(body.target_number).replace(/[^0-9]/g, '');
    const sanitizedChronology = sanitizeChronology(String(body.chronology));
    const sanitizedTargetName = body.target_name ? sanitizeText(String(body.target_name)) : null;
    const sanitizedBankName = body.bank_name ? sanitizeText(String(body.bank_name)) : null;
    const sanitizedPlatform = body.platform ? sanitizeText(String(body.platform)) : null;
    const sanitizedSocialAccounts = body.social_media_accounts
      ? sanitizeArray(body.social_media_accounts as string[]) : [];

    const evidenceUrls: string[] = body.evidence_urls?.length > 0
      ? body.evidence_urls : body.evidence_url ? [body.evidence_url] : [];
    const hasPhoto = evidenceUrls.length > 0;

    let autoStatus: 'pending' | 'verified' = 'pending';
    try {
      const textResult = await analyzeChronologyText(sanitizedChronology, c.env.GROQ_API_KEY);

      // FIX: Backend analisis foto sendiri dari URL storage
      // Sebelumnya percaya body.ai_photo_result dari client — bisa dimanipulasi
      let photoResult: AnalysisResult | null = null;
      if (hasPhoto && evidenceUrls[0]) {
        try {
          const imgRes = await fetch(evidenceUrls[0]);
          if (imgRes.ok) {
            const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg';
            const buffer = await imgRes.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            // Analisis dilakukan backend, bukan percaya skor dari client
            photoResult = await analyzeEvidenceImage(base64, contentType, c.env.GROQ_API_KEY);
          }
        } catch {
          // Gagal analisis foto → tetap pending, tidak throw
          photoResult = null;
        }
      }

      autoStatus = determineAutoStatus({
        chronologyScore: textResult.chronology_score,
        chronologyLength: sanitizedChronology.length,
        riskLevel: textResult.risk_level,
        photoResult,
        hasPhoto,
      });
    } catch { /* tetap pending */ }

    const { error } = await supabase.from('reports').insert({
      reporter_id: userId,
      target_number: cleanNumber,
      target_name: sanitizedTargetName,
      target_type: body.target_type,
      category: body.category,
      chronology: sanitizedChronology,
      evidence_url: evidenceUrls[0] || null,
      evidence_urls: evidenceUrls,
      status: autoStatus,
      bank_name: sanitizedBankName,
      loss_amount: body.loss_amount || null,
      incident_date: body.incident_date || null,
      platform: sanitizedPlatform,
      link_url: body.link_url || null,
      social_media_accounts: sanitizedSocialAccounts,
      has_other_victims: body.has_other_victims || null,
      reported_to: body.reported_to ?? [],
      suspect_photo_url: body.suspect_photo_url || null,
    });

    if (error) {
      console.error('Insert report error:', error.message);
      return c.json({ success: false, message: 'Gagal menyimpan laporan.' }, 500);
    }

    return c.json({ success: true, slug: cleanNumber, status: autoStatus }, 201);
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── POST /api/reports/analyze/image ──────────────────────────────────────────
reports.post('/analyze/image', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return c.json({ success: false, message: 'File tidak ditemukan.' }, 400);
    if (file.size > 5 * 1024 * 1024) return c.json({ success: false, message: 'Ukuran file melebihi 5MB.' }, 400);
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return c.json({ success: false, message: 'Tipe file tidak didukung.' }, 400);
    }
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const result = await analyzeEvidenceImage(base64, file.type, c.env.GROQ_API_KEY);
    return c.json({ success: true, data: result });
  } catch (err) {
    console.error('Analyze image error:', err);
    return c.json({ success: false, message: 'Sistem analisis sedang tidak tersedia.' }, 500);
  }
});

// ── POST /api/reports/analyze/text ───────────────────────────────────────────
reports.post('/analyze/text', authMiddleware, async (c) => {
  try {
    const { chronology } = await c.req.json();
    if (!chronology || typeof chronology !== 'string' || chronology.trim().length < 20) {
      return c.json({ success: false, message: 'Kronologi terlalu singkat.' }, 400);
    }
    const sanitized = sanitizeChronology(chronology);
    const result = await analyzeChronologyText(sanitized, c.env.GROQ_API_KEY);
    return c.json({ success: true, data: result });
  } catch {
    return c.json({ success: false, message: 'Sistem analisis sedang tidak tersedia.' }, 500);
  }
});

// ── POST /api/reports/withdraw ────────────────────────────────────────────────
reports.post('/withdraw', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { reportId } = await c.req.json();

    // FIX: Validasi UUID reportId
    if (!reportId || !UUID_REGEX.test(reportId)) {
      return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);
    const { data: report, error: fetchError } = await supabase.from('reports')
      .select('id, status, reporter_id').eq('id', reportId).eq('reporter_id', userId).single();
    if (fetchError || !report) return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);
    if (report.status === 'withdrawn') return c.json({ success: false, message: 'Laporan sudah dalam status revisi.' }, 400);
    const { error } = await supabase.from('reports').update({ status: 'withdrawn' })
      .eq('id', reportId).eq('reporter_id', userId);
    if (error) throw error;
    return c.json({ success: true, message: 'Laporan berhasil ditarik.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

// ── PUT /api/reports/:reportId ────────────────────────────────────────────────
reports.put('/:reportId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const reportId = c.req.param('reportId');

    // FIX: Validasi UUID reportId
    if (!UUID_REGEX.test(reportId)) {
      return c.json({ success: false, message: 'ID laporan tidak valid.' }, 400);
    }

    const body = await c.req.json();
    const supabase = getSupabaseAdmin(c.env);
    const { data: report, error: fetchError } = await supabase.from('reports')
      .select('id, status, reporter_id').eq('id', reportId).eq('reporter_id', userId).single();
    if (fetchError || !report) return c.json({ success: false, message: 'Laporan tidak ditemukan.' }, 404);
    if (report.status !== 'withdrawn') {
      return c.json({ success: false, message: 'Hanya laporan "Sedang Direvisi" yang dapat diedit.' }, 400);
    }
    const sanitizedData = {
      target_name: body.target_name ? sanitizeText(String(body.target_name)) : null,
      category: body.category,
      chronology: sanitizeChronology(String(body.chronology)),
      bank_name: body.bank_name ? sanitizeText(String(body.bank_name)) : null,
      loss_amount: body.loss_amount || null,
      incident_date: body.incident_date || null,
      platform: body.platform ? sanitizeText(String(body.platform)) : null,
      link_url: body.link_url || null,
      social_media_accounts: body.social_media_accounts
        ? sanitizeArray(body.social_media_accounts as string[]) : [],
      has_other_victims: body.has_other_victims || null,
      reported_to: body.reported_to ?? [],
      evidence_urls: body.evidence_urls ?? [],
      evidence_url: body.evidence_url || null,
      suspect_photo_url: body.suspect_photo_url || null,
      status: 'pending',
    };
    const { error } = await supabase.from('reports').update(sanitizedData)
      .eq('id', reportId).eq('reporter_id', userId);
    if (error) throw error;
    return c.json({ success: true, message: 'Laporan berhasil diperbarui.' });
  } catch {
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default reports;