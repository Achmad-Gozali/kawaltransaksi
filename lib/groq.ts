const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ✅ FIX: Ganti model ke llama-3.3-70b-versatile (stable & tersedia di Groq)
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ✅ Timeout 15 detik — cegah server action hang kalau Groq lambat/down
const TIMEOUT_MS = 15_000;

interface AnalysisResult {
  authenticity_score: number;
  is_likely_authentic: boolean;
  summary: string;
  red_flags: string[];
  scam_category_suggestion: string | null;
}

// ✅ Helper: fetch dengan timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ✅ Helper: parse JSON dari response Groq — handle markdown fence
function parseGroqJson<T>(content: string): T | null {
  try {
    const cleaned = content.replace(/```json\s*|```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// ✅ Header reusable
function getGroqHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Analyze uploaded screenshot evidence using Groq vision model
 */
export async function analyzeEvidenceImage(
  base64Image: string,
  mimeType: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const response = await fetchWithTimeout(
    GROQ_API_URL,
    {
      method: 'POST',
      headers: getGroqHeaders(apiKey),
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `Kamu adalah AI forensik digital yang menganalisis bukti screenshot penipuan online.
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
    throw new Error(`Groq API error: ${response.status} - ${errBody}`);
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
 * Analyze chronology text for scam patterns using Groq
 */
export async function analyzeChronologyText(
  chronology: string
): Promise<{ risk_level: 'low' | 'medium' | 'high'; analysis: string; suggested_category: string | null }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  // ✅ Batasi panjang input — cegah token waste
  const trimmedChronology = chronology.slice(0, 2000);

  const response = await fetchWithTimeout(
    GROQ_API_URL,
    {
      method: 'POST',
      headers: getGroqHeaders(apiKey),
      body: JSON.stringify({
        model: GROQ_MODEL,
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
  const parsed = parseGroqJson<{ risk_level: 'low' | 'medium' | 'high'; analysis: string; suggested_category: string | null }>(content);

  return parsed ?? {
    risk_level: 'medium',
    analysis: 'Gagal memparse hasil analisis.',
    suggested_category: null,
  };
}