import 'dotenv/config';
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import cron from "node-cron";
import { kv } from "./core/redis";
import { getSupabaseAdmin } from "./core/supabase";
import { logSuspiciousIp, autoBlacklistIfAbuse } from "./core/abuse";
import type { Env } from "./types";


import authRoutes from "./features/auth/auth.route";
import reportsRoutes from "./features/reports/reports.route";
import adminRoutes from "./features/admin/admin.route";
import searchRoutes from "./features/search/search.route";
import articlesRoutes, {
  generateWeeklyArticle,
} from "./features/articles/articles.route";
import uploadRoutes from "./features/upload/upload.route";
import feedbackRoutes from "./features/feedback/feedback.route";
import apiPublicRoutes from "./features/api-public/api-public.route";
import developerRoutes from "./features/developer/developer.route";
import robotRoutes, { runScheduler } from "./features/robot/robot.route";
import appealRoutes from "./features/robot/appeal-system";
import { runConfidenceDecay } from "./features/robot/blacklist-engine";
import { detectTrends } from "./features/robot/trend-detector";
import { detectThreats } from "./features/robot/threat-detector";

export { logSuspiciousIp, autoBlacklistIfAbuse };

const env: Env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY ?? "",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "",
  FRONTEND_URL_CLONE: process.env.FRONTEND_URL_CLONE ?? "",
  NODE_ENV: process.env.NODE_ENV ?? "production",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "",
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ?? "",
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY ?? "",
  HEALTH_SECRET: process.env.HEALTH_SECRET ?? "",
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? "",
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? "",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? "",
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ?? "",
  ADMIN_IP_WHITELIST: process.env.ADMIN_IP_WHITELIST ?? "",
  ABSTRACT_API_KEY: process.env.ABSTRACT_API_KEY ?? "",
  RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY ?? "",
  LIMITER: kv,
};

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://kawaltransaksi.com",
        "https://www.kawaltransaksi.com",
        env.FRONTEND_URL,
        env.FRONTEND_URL_CLONE,
      ].filter(Boolean);
      if (!origin) return "*";
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Internal-Key",
      "X-API-Key",
      "Idempotency-Key",
      "X-Request-Timestamp",
    ],
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  await next();
  const h = c.res.headers;
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("X-XSS-Protection", "1; mode=block");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  h.set("Cache-Control", "no-store");
});

// IP helper
const getIp = (c: any): string => {
  return (
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
    c.req.header("X-Real-IP") ??
    "anonymous"
  );
};

// Origin validator
app.use("/api/auth/*", async (c, next) => {
  if (c.req.method === "OPTIONS") return next();
  const internalKey = c.req.header("X-Internal-Key");
  if (internalKey && internalKey === env.INTERNAL_API_KEY) return next();
  const origin = c.req.header("Origin") || c.req.header("Referer") || "";
  if (!origin.trim()) return next();
  const allowed = [
    "http://localhost:3000",
    "https://kawaltransaksi.com",
    "https://www.kawaltransaksi.com",
    env.FRONTEND_URL,
  ].filter(Boolean);
  if (!allowed.some((a) => origin.startsWith(a)))
    return c.json({ success: false, message: "Akses ditolak." }, 403);
  return next();
});

// Blacklist check
app.use("/api/*", async (c, next) => {
  const ip = getIp(c);
  if (ip === "anonymous" || ip === "127.0.0.1") return next();
  const path = new URL(c.req.url).pathname;
  if (path.startsWith("/api/admin/blacklist")) return next();
  const blocked = await kv.get(`blacklist_${ip}`);
  if (blocked)
    return c.json(
      { success: false, message: "Akses Anda telah diblokir sementara." },
      403,
    );
  return next();
});

// Admin IP whitelist
app.use("/api/admin/*", async (c, next) => {
  const internalKey = c.req.header("X-Internal-Key");
  if (internalKey && internalKey === env.INTERNAL_API_KEY) return next();
  return next();
});

app.get("/health", (c) => {
  const token = c.req.header("X-Health-Token");
  if (!token || token !== env.HEALTH_SECRET)
    return c.json(
      { success: false, message: "Endpoint tidak ditemukan." },
      404,
    );
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/robots.txt", (c) => c.text("User-agent: *\nAllow: /\n"));

// Inject env ke semua route via middleware
app.use("*", async (c, next) => {
  c.set("env", env);
  c.set("limiter", kv);
  await next();
});

app.route("/api/auth", authRoutes);
app.route("/api/reports", reportsRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/search", searchRoutes);
app.route("/api/articles", articlesRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/feedback", feedbackRoutes);
app.route("/api/v1", apiPublicRoutes);
app.route("/api/developer", developerRoutes);
app.route("/api/robot", robotRoutes);
app.route("/api/appeals", appealRoutes);

app.notFound((c) =>
  c.json({ success: false, message: "Endpoint tidak ditemukan." }, 404),
);
app.onError((err, c) => {
  console.error("[ERROR]:", err.message);
  return c.json({ success: false, message: "Terjadi kesalahan server." }, 500);
});

// Cron jobs
cron.schedule("0 23 * * 0", () =>
  generateWeeklyArticle(env).catch(console.error),
);
cron.schedule("*/30 * * * *", () => runScheduler(getSupabaseAdmin(env)).catch(console.error));
cron.schedule("*/15 * * * *", () => {
  Promise.all([
    detectTrends(getSupabaseAdmin(env)).catch(console.error),
    detectThreats(kv, getSupabaseAdmin(env)).catch(console.error),
  ]);
});
cron.schedule("0 19 * * *", async () => {
  // cleanup handled in route
});

const PORT = parseInt(process.env.PORT ?? "4000");
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});

export default app;
