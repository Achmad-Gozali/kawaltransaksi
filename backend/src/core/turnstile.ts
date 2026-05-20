export async function verifyTurnstile(token: string, secretKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token }),
    });
    const data = await res.json() as { success: boolean; 'error-codes'?: string[] };
    if (!data.success) {
      console.error('[TURNSTILE ERROR]:', data['error-codes']);
    }
    return data.success;
  } catch (err) {
    console.error('[TURNSTILE] Fetch error:', err);
    return false;
  }
}