import { Hono } from 'hono';
import type { Env } from '../types';

const search = new Hono<{ Bindings: Env }>();

async function verifyTurnstile(token: string, secretKey: string): Promise<boolean> {
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
}

// ── POST /api/search/verify-turnstile ────────────────────────────────────────
search.post('/verify-turnstile', async (c) => {
  try {
    const { token } = await c.req.json();

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return c.json({ success: false, message: 'Token tidak ditemukan.' }, 400);
    }

    const isValid = await verifyTurnstile(token, c.env.TURNSTILE_SECRET_KEY);
    if (!isValid) {
      return c.json({ success: false, message: 'Verifikasi keamanan gagal.' }, 400);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('[SEARCH ROUTE ERROR]:', err);
    return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
  }
});

export default search;