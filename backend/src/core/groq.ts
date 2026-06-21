const GROQ_API_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';

export async function groqChat(
  prompt: string,
  apiKey: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model:       GROQ_TEXT_MODEL,
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  options?.maxTokens  ?? 1500,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    console.error('[groq] request failed:', res.status, await res.text());
    return '';
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}