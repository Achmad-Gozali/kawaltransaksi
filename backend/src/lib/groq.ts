const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export interface AnalysisResult {
  authenticity_score: number;
  relevance_score: number;
  has_concrete_evidence: boolean;
  is_likely_authentic: boolean;
  summary: string;
  red_flags: string[];
  scam_category_suggestion: string | null;
}

export interface TextAnalysisResult {
  risk_level: 'low' | 'medium' | 'high';
  chronology_score: number;
  analysis: string;
  suggested_category: string | null;
}

function parseGroqJson<T>(content: string): T | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const target = jsonMatch ? jsonMatch[0] : content;
    return JSON.parse(target) as T;
  } catch {
    return null;
  }
}

export async function analyzeEvidenceImage(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<AnalysisResult> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `kamu adalah ahli forensik digital bukti penipuan online. tugasmu: audit screenshot untuk dua hal berbeda, yaitu KEASLIAN visual dan RELEVANSI sebagai bukti penipuan.

## panduan penilaian KEASLIAN (authenticity_score 0-100):
- gambar asli tanpa editan = 85-100. ada indikasi editan ringan = 40-84. jelas palsu = 0-39.

## panduan penilaian RELEVANSI (relevance_score 0-100):
- SANGAT RELEVAN (80-100): screenshot chat berisi negosiasi/permintaan uang, struk transfer bank.
- CUKUP RELEVAN (40-79): profil akun penipu, tangkapan layar iklan palsu.
- TIDAK RELEVAN (0-39): halaman error, screenshot acak yang tidak berkaitan.

## format output json:
{
  "authenticity_score": <number 0-100>,
  "relevance_score": <number 0-100>,
  "has_concrete_evidence": <true|false>,
  "is_likely_authentic": <true jika authenticity_score >= 60>,
  "summary": "<kesimpulan forensik tegas, maksimal 2 kalimat>",
  "red_flags": ["<temuan teknis spesifik>"],
  "scam_category_suggestion": "<kategori modus penipuan atau null>"
}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
            { type: 'text', text: 'lakukan audit forensik pada screenshot ini.' },
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? '';

  return parseGroqJson<AnalysisResult>(content) ?? {
    authenticity_score: 40,
    relevance_score: 0,
    has_concrete_evidence: false,
    is_likely_authentic: false,
    summary: 'gagal memproses analisis gambar.',
    red_flags: ['analisis tidak dapat diselesaikan'],
    scam_category_suggestion: null,
  };
}

export async function analyzeChronologyText(
  chronology: string,
  apiKey: string
): Promise<TextAnalysisResult> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_TEXT_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `kamu adalah investigator fraud siber berpengalaman. analisis kronologi penipuan dan berikan penilaian risk level dan skor kualitas laporan.

## panduan penilaian risk_level:
- "high": modus jelas, ada nominal kerugian, ada identitas penipu, ada platform transaksi.
- "medium": modus cukup jelas tapi beberapa detail masih kurang.
- "low": kronologi sangat singkat atau tidak ada indikasi penipuan yang kuat.

## format output json:
{
  "risk_level": "<low|medium|high>",
  "chronology_score": <number 0-100>,
  "analysis": "<analisis tegas dan ringkas, 3-4 kalimat>",
  "suggested_category": "<kategori spesifik atau null>"
}`,
        },
        {
          role: 'user',
          content: `analisis kronologi berikut: "${chronology}"`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? '';

  return parseGroqJson<TextAnalysisResult>(content) ?? {
    risk_level: 'low',
    chronology_score: 0,
    analysis: 'gagal memproses teks.',
    suggested_category: null,
  };
}