import { configDotenv } from "dotenv";
configDotenv();

import path from "path";
import { fileURLToPath } from "url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";

import { authRoutes } from "./features/auth/auth.route.js";
import { reportsRoutes } from "./features/reports/reports.route.js";
import { searchRoutes } from "./features/search/search.route.js";
import { adminRoutes } from "./features/admin/admin.route.js";
import { uploadRoutes } from "./features/upload/upload.route.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.FRONTEND_URL!,
  credentials: true,
});
await app.register(cookie, { secret: process.env.COOKIE_SECRET! });
await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, "../uploads");

await app.register(fastifyStatic, {
  root: uploadDir,
  prefix: "/uploads/",
});

await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(reportsRoutes, { prefix: "/api/reports" });
await app.register(searchRoutes, { prefix: "/api/search" });
await app.register(adminRoutes, { prefix: "/api/admin" });
await app.register(uploadRoutes, { prefix: "/api/upload" });

app.get("/health", async () => ({ status: "ok" }));

await app.listen({ port: Number(process.env.PORT) || 4000, host: "0.0.0.0" });