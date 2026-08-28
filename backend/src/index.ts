import { configDotenv } from "dotenv";
configDotenv();

import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";

import { authRoutes } from "./features/auth/auth.route.js";
import { reportsRoutes } from "./features/reports/reports.route.js";
import { searchRoutes } from "./features/search/search.route.js";
import { adminRoutes } from "./features/admin/admin.route.js";
import { uploadRoutes } from "./features/upload/upload.route.js";
import { qrisRoutes } from "./features/qris/qris.route.js";
import { initRealtime, closeRealtime } from "./core/realtime.js";

const app = Fastify({ logger: true, trustProxy: true });

// SSE stream realtime: koneksi hidup lama + reconnect otomatis dari klien.
// Dikecualikan dari kedua rate limiter global supaya badai reconnect
// (jaringan mobile tidak stabil) tidak menutup akses. Lihat juga
// `config: { rateLimit: false }` di route-nya dan `limit_req off` di nginx.
const isStreamPath = (req: { url: string }) =>
  req.url.split("?")[0] === "/api/reports/stream";

await app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});
await app.register(cors, {
  origin: process.env.FRONTEND_URL!,
  credentials: true,
  exposedHeaders: ["Retry-After"],
});
await app.register(cookie, { secret: process.env.COOKIE_SECRET! });
await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

// ── Burst protection (lapis 1) ───────────────────────────────────────────
// Mendeteksi lonjakan request cepat dari satu sumber (pola pentest/bot),
// terpisah dari rate limit per-menit/jam yang sudah ada di masing-masing
// route (misal /login 5x/15menit). Window sangat pendek (5 detik) supaya
// user normal -- termasuk yang membuka banyak tab atau halaman yang fetch
// beberapa endpoint sekaligus -- tidak pernah kena, tapi lonjakan otomatis
// (ratusan request dalam hitungan detik) langsung ditolak sebelum sempat
// membebani nginx/upstream seperti insiden sebelumnya.
await app.register(rateLimit, {
  global: true,
  max: 20,
  timeWindow: "5 seconds",
  nameSpace: "burst-",
  allowList: isStreamPath,
  errorResponseBuilder: (_req, context) => ({
    statusCode: 429,
    error: `Terlalu banyak permintaan dalam waktu singkat. Coba lagi dalam ${Math.ceil(context.ttl / 1000)} detik.`,
  }),
});

// ── Rate limit umum (lapis 2) ─────────────────────────────────────────────
// Berlaku untuk semua endpoint yang TIDAK mendefinisikan rate limit sendiri
// (misal endpoint di auth.route.ts yang sudah punya config.rateLimit
// masing-masing -- itu tetap dipakai, bukan digantikan oleh yang ini).
await app.register(rateLimit, {
  global: true,
  max: 50,
  timeWindow: "1 minute",
  nameSpace: "general-",
  allowList: isStreamPath,
  errorResponseBuilder: (_req, context) => ({
    statusCode: 429,
    error: `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(context.ttl / 1000)} detik.`,
  }),
});

// Catatan: registrasi @fastify/static untuk /uploads/ SUDAH DIHAPUS.
// Semua file (evidence, thumbnail, foto) sekarang dilayani langsung dari
// Cloudflare R2 lewat https://img.kawaltransaksi.com, bukan dari VPS lagi.

await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(reportsRoutes, { prefix: "/api/reports" });
await app.register(searchRoutes, { prefix: "/api/search" });
await app.register(adminRoutes, { prefix: "/api/admin" });
await app.register(uploadRoutes, { prefix: "/api/upload" });
await app.register(qrisRoutes, { prefix: "/api/qris" });

app.get("/health", async () => ({ status: "ok" }));

// api.kawaltransaksi.com murni API, tidak ada konten untuk diindeks --
// tutup total dari crawler, jangan cuma andalkan "tidak ada yang link ke sini".
app.get("/robots.txt", async (_req, reply) => {
  reply.type("text/plain").send("User-agent: *\nDisallow: /\n");
});

// ── Error handler global ──────────────────────────────────────────────────
// Fastify secara default menyertakan `error.message` mentah di body respons
// untuk error yang tidak terduga (mis. error driver Postgres, exception dari
// dependency internal) -- ini bisa membocorkan detail implementasi (nama
// kolom/constraint, dsb) ke klien. Untuk error dengan statusCode >= 500 (atau
// tanpa statusCode sama sekali, yaitu exception yang tidak sengaja terlempar
// dari handler), log detail lengkapnya di server tapi balas klien dengan
// pesan generik. Error yang sudah punya statusCode < 500 (mis. dari
// @fastify/rate-limit atau validasi bawaan Fastify) tetap diteruskan apa
// adanya karena pesannya memang ditujukan untuk klien.
app.setErrorHandler((error: FastifyError, req, reply) => {
  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) {
    req.log.error(error);
    reply.status(statusCode).send({ error: "Server kami sedang bermasalah. Coba lagi beberapa saat lagi." });
    return;
  }
  reply.status(statusCode).send({ error: error.message });
});

// Realtime (LISTEN Postgres + broadcast SSE). Setelah semua route terdaftar.
await initRealtime(app);

// Tutup semua koneksi SSE saat server ditutup, kalau tidak `app.close()`
// menggantung menunggu socket yang tidak akan pernah selesai sendiri --
// bikin `docker compose restart` macet sampai timeout.
app.addHook("onClose", async () => {
  await closeRealtime();
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    app.log.info(`${signal} diterima, menutup server...`);
    app
      .close()
      .then(() => process.exit(0))
      .catch((err) => {
        app.log.error({ err }, "gagal menutup server dengan rapi");
        process.exit(1);
      });
  });
}

await app.listen({ port: Number(process.env.PORT) || 4000, host: "0.0.0.0" });