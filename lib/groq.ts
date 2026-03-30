const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ✅ fix: pake model yang beneran ada & stabil di groq
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'llama-3.2-11b-vision-preview'; 

const TIMEOUT_MS = 25_000; // gua naikin ke 25 detik biar gak gampang timeout pas upload gambar

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

// helper: fetch dengan timeout
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

// helper: parse json biar lebih badak nangkep respon ai
function parseGroqJson<T>(content: string): T | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const target = jsonMatch ? jsonMatch[0] : content;
    return JSON.parse(target) as T;
  } catch (e) {
    console.error('parse error:', e);
    return null;
  }
}

/**
 * ✅ fix: analyze screenshot evidence pakai vision model + json mode
 */
export async function analyzeEvidenceImage(
  base64Image: string,
  mimeType: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('groq_api_key is not configured');

  const response = await fetchWithTimeout(
    GROQ_API_URL,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        // ✅ paksa mode json biar kaga ada teks sampah diluar kurung kurawal
        response_format: { type: "json_object" }, 
        messages: [
          {
            role: 'system',
            content: `kamu adalah ai forensik digital. analisis screenshot bukti penipuan ini.
respon harus dalam format json: 
{
  "authenticity_score": number,
  "is_likely_authentic": boolean,
  "summary": "string",
  "red_flags": ["string"],
  "scam_category_suggestion": "string atau null"
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
                text: 'analisis screenshot ini. apakah asli? apa red flags-nya?',
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.2,
      }),
    },
    TIMEOUT_MS
  );

  if (!response.ok) throw new Error(`api error: ${response.status}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const parsed = parseGroqJson<AnalysisResult>(content);

  return parsed ?? {
    authenticity_score: 50,
    is_likely_authentic: false,
    summary: 'gagal memproses data analisis gambar.',
    red_flags: [],
    scam_category_suggestion: null,
  };
}

/**
 * analyze chronology text for scam patterns
 */
export async function analyzeChronologyText(
  chronology: string
): Promise<TextAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('groq_api_key is not configured');

  const response = await fetchWithTimeout(
    GROQ_API_URL,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        response_format: { type: "json_object" }, // ✅ paksa mode json
        messages: [
          {
            role: 'system',
            content: `kamu adalah ai analis penipuan. analisis kronologi berikut dan berikan respon json:
{
  "risk_level": "low|medium|high",
  "analysis": "string",
  "suggested_category": "string atau null"
}`,
          },
          {
            role: 'user',
            content: `analisis kronologi: "${chronology.slice(0, 2000)}"`,
          },
        ],
        max_tokens: 512,
        temperature: 0.2,
      }),
    },
    TIMEOUT_MS
  );

  if (!response.ok) throw new Error(`api error: ${response.status}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const parsed = parseGroqJson<TextAnalysisResult>(content);

  return parsed ?? {
    risk_level: 'medium',
    analysis: 'gagal memproses data analisis teks.',
    suggested_category: null,
  };
}