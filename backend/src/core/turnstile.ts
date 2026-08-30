const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  if (!token) return false;

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY!,
    response: token,
  });
  if (remoteIp) body.append("remoteip", remoteIp);

  try {
    // Timeout wajib: fetch Node tidak punya batas waktu default. Tanpa ini,
    // saat siteverify Cloudflare lambat/hang, SETIAP register/login/submit
    // laporan ikut menggantung -- koneksi & pool DB habis, seluruh API tumbang
    // gara-gara satu dependency eksternal. Fail-closed (return false) sudah
    // benar untuk cek keamanan. Pola sama dengan isPasswordBreached().
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}