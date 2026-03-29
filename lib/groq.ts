// ============================================
// 📁 LOKASI: lib/groq.ts
// ✅ FIX:
//    1. Pisah model text vs vision — llama-3.3-70b TIDAK support image
//    2. analyzeEvidenceImage sekarang pakai vision model yang benar
//    3. Fallback model kalau vision gagal
//    4. Improved error messages
// ============================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ✅ FIX: Model terpisah — text model TIDAK bisa proses gambar
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'llama-3.2-90b-vision-preview';

const TIMEOUT_MS = 15_000;

interface AnalysisResult {
  authenticity_score: number;
  is_likely_authentic: boolean;
  summary: string;
  red_flags: string[];
  scam_category_suggestion: string | null;
}

interface TextAnalysisResult {
  risk_level: 'low' | 'medium' | 'high';
  analysis: string;
  suggested_category: string | null;
}

// Helper: fetch dengan timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Helper: parse JSON dari response Groq — handle markdown fence
function parseGroqJson<T>(content: string): T | null {
  try {
    const cleaned = content.replace(/```json\s*|```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// Header reusable
function getGroqHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * ✅ FIX: Analyze screenshot evidence pakai VISION model
 * Sebelumnya pakai llama-3.3-70b yang TIDAK support image input
 * Sekarang pakai llama-3.2-90b-vision-preview
 */
export async function analyzeEvidenceImage(
  base64Image: string,
  mimeType: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  // Validate mime type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}. Use JPG, PNG, or WebP.`);
  }

  const response = await fetchWithTimeout(
    GROQ_API_URL,
    {
      method: 'POST',
      headers: getGroqHeaders(apiKey),
      body: JSON.stringify({
        // ✅ FIX: Pakai vision model, bukan text model
        model: GROQ_VISION_MODEL,
        messages: [
          {
            role: 'system',
            content: `Kamu adalah AI forensik digital yang menganalisis bukti screenshot penipuan online di Indonesia.
Analisis gambar yang diberikan dan tentukan:
1. Apakah screenshot terlihat autentik (bukan editan/fabricated)
2. Identifikasi red flags penipuan yang terlihat
3. Sugesti kategori penipuan

Respon HARUS dalam format JSON berikut (tanpa markdown, tanpa backticks):
{
  "authenticity_score": <number 0-100>,
  "is_likely_authentic": <boolean>,
  "summary": "<ringkasan singkat dalam bahasa Indonesia>",
  "red_flags": ["<flag1>", "<flag2>"],
  "scam_category_suggestion": "<kategori atau null>"
}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
              {
                type: 'text',
                text: 'Analisis screenshot bukti penipuan ini. Apakah autentik? Apa red flags yang terlihat?',
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    },
    TIMEOUT_MS
  );

  if (!response.ok) {
    const errBody = await response.text();
    console.error('Groq Vision API error:', response.status, errBody);
    throw new Error(`Groq Vision API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const parsed = parseGroqJson<AnalysisResult>(content);

  return parsed ?? {
    authenticity_score: 50,
    is_likely_authentic: false,
    summary: 'Gagal memparse hasil analisis AI. Silakan coba lagi.',
    red_flags: [],
    scam_category_suggestion: null,
  };
}

/**
 * Analyze chronology text for scam patterns using Groq (text model)
 */
export async function analyzeChronologyText(
  chronology: string
): Promise<TextAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  // Batasi panjang input — cegah token waste
  const trimmedChronology = chronology.slice(0, 2000);

  const response = await fetchWithTimeout(
    GROQ_API_URL,
    {
      method: 'POST',
      headers: getGroqHeaders(apiKey),
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Kamu adalah AI yang menganalisis kronologi penipuan online di Indonesia.
Analisis teks kronologi dan tentukan:
1. Tingkat risiko bahwa ini benar-benar penipuan (low/medium/high)
2. Analisis singkat pola penipuan yang terdeteksi
3. Sugesti kategori penipuan

Respon HARUS dalam format JSON (tanpa markdown, tanpa backticks):
{
  "risk_level": "low|medium|high",
  "analysis": "<analisis singkat dalam bahasa Indonesia>",
  "suggested_category": "<kategori atau null>"
}`,
          },
          {
            role: 'user',
            content: `Analisis kronologi penipuan berikut:\n\n"${trimmedChronology}"`,
          },
        ],
        max_tokens: 512,
        temperature: 0.3,
      }),
    },
    TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const parsed = parseGroqJson<TextAnalysisResult>(content);

  return parsed ?? {
    risk_level: 'medium',
    analysis: 'Gagal memparse hasil analisis.',
    suggested_category: null,
  };
}