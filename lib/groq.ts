const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ✅ pake model yang paling pinter buat gambar mad
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'llama-3.2-90b-vision-preview'; 

const TIMEOUT_MS = 30_000; // gua kasih 30 detik biar lega

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

// parse json sakti
function parseGroqJson<T>(content: string): T | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const target = jsonMatch ? jsonMatch[0] : content;
    return JSON.parse(target) as T;
  } catch (e) {
    console.error('failed to parse ai response:', content);
    return null;
  }
}

/**
 * analisis gambar mad
 */
export async function analyzeEvidenceImage(base64Image: string, mimeType: string): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('api key kaga ada di .env mad');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: `kamu adalah ai forensik. analisis gambar dan berikan output dalam format JSON.`
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
                text: 'analisis screenshot ini dalam format JSON: { "authenticity_score": number, "is_likely_authentic": boolean, "summary": string, "red_flags": array, "scam_category_suggestion": string }',
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errBody = await response.text();
      // ✅ LIAT DI CONSOLE LU: ini bakal ngebocorin kenapa groq nolak
      console.error('--- GROQ API ERROR ---', response.status, errBody);
      throw new Error(`groq error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return parseGroqJson<AnalysisResult>(content) ?? {
      authenticity_score: 50,
      is_likely_authentic: false,
      summary: 'gagal memproses data analisis.',
      red_flags: [],
      scam_category_suggestion: null,
    };
  } catch (err) {
    console.error('analysis execution failed:', err);
    throw err;
  }
}

/**
 * analisis teks mad
 */
export async function analyzeChronologyText(chronology: string): Promise<TextAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('api key kaga ada mad');

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: `kamu adalah ai analis penipuan. berikan output dalam format JSON.`
          },
          {
            role: 'user',
            content: `analisis kronologi ini dalam format JSON { "risk_level": "low|medium|high", "analysis": string, "suggested_category": string }: "${chronology}"`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`api error: ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return parseGroqJson<TextAnalysisResult>(content) ?? {
      risk_level: 'medium',
      analysis: 'gagal analisis teks.',
      suggested_category: null,
    };
  } catch (err) {
    console.error('text analysis failed:', err);
    throw err;
  }
}