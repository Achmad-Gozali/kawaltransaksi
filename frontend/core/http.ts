import { headers } from "next/headers";

/**
 * Header untuk fetch server-side (SSR) ke backend internal.
 *
 * Saat SSR, halaman memanggil backend lewat BACKEND_INTERNAL_URL
 * (http://backend:4000) yang TIDAK melewati nginx/Cloudflare, sehingga
 * request sampai ke backend tanpa X-Forwarded-For dan `req.ip` di backend
 * menjadi IP container frontend -- sama untuk semua pengunjung.
 *
 * Untuk endpoint yang dibatasi rate limit per-IP (mis. /api/reports/public/check),
 * kita teruskan X-Forwarded-For asli pengunjung supaya limit berlaku per orang,
 * bukan mematikan seluruh situs sekaligus. Dipakai bareng trustProxy: true di
 * backend (leftmost X-Forwarded-For dipakai sebagai req.ip).
 */
export async function forwardedClientHeaders(): Promise<Record<string, string>> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for") ?? h.get("x-real-ip");
    return xff ? { "x-forwarded-for": xff } : {};
  } catch {
    return {};
  }
}
