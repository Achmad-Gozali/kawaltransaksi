import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../core/db.js";
import { reports, publicReportColumns } from "../../core/schema.js";
import { eq, and, desc } from "drizzle-orm";

// Sama seperti reports.route.ts: endpoint publik read-only, cache pendek
// biar Cloudflare bisa menyerap traffic berulang tanpa membebani DB.
function withPublicCache(_req: FastifyRequest, reply: FastifyReply, payload: unknown, done: (err: Error | null, payload?: unknown) => void) {
  reply.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  done(null, payload);
}

export async function searchRoutes(app: FastifyInstance) {
  app.get("/nomor/:value", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    onSend: withPublicCache,
  }, async (req, reply) => {
    const { value } = req.params as { value: string };

    const data = await db.select(publicReportColumns).from(reports)
      .where(and(eq(reports.targetType, "phone"), eq(reports.targetValue, value)))
      .orderBy(desc(reports.createdAt));

    return { data, total: data.length };
  });

  app.get("/rekening/:bank/:value", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    onSend: withPublicCache,
  }, async (req, reply) => {
    const { bank, value } = req.params as { bank: string; value: string };

    const data = await db.select(publicReportColumns).from(reports)
      .where(and(
        eq(reports.targetType, "bank_account"),
        eq(reports.bankName, bank),
        eq(reports.targetValue, value)
      ))
      .orderBy(desc(reports.createdAt));

    return { data, total: data.length };
  });

  app.get("/ewallet/:wallet/:value", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    onSend: withPublicCache,
  }, async (req, reply) => {
    const { wallet, value } = req.params as { wallet: string; value: string };

    const data = await db.select(publicReportColumns).from(reports)
      .where(and(
        eq(reports.targetType, "ewallet"),
        eq(reports.walletName, wallet),
        eq(reports.targetValue, value)
      ))
      .orderBy(desc(reports.createdAt));

    return { data, total: data.length };
  });
}