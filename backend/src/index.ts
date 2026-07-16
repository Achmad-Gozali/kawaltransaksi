import { configDotenv } from "dotenv";
configDotenv();

import Fastify from "fastify";
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

const app = Fastify({ logger: true, trustProxy: true });

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
await app.register(rateLimit, {
  global: true,
  max: 50,
  timeWindow: "1 minute",
  errorResponseBuilder: (_req, context) => ({
    statusCode: 429,
    error: "Too Many Requests",
    message: `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(context.ttl / 1000)} detik.`,
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

app.get("/health", async () => ({ status: "ok" }));

await app.listen({ port: Number(process.env.PORT) || 4000, host: "0.0.0.0" });