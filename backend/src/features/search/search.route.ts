import type { FastifyInstance } from "fastify";
import { db } from "../../core/db";
import { reports } from "../../core/schema";
import { eq, and, desc } from "drizzle-orm";

export async function searchRoutes(app: FastifyInstance) {
  app.get("/nomor/:value", async (req, reply) => {
    const { value } = req.params as { value: string };

    const data = await db.select().from(reports)
      .where(and(eq(reports.targetType, "phone"), eq(reports.targetValue, value)))
      .orderBy(desc(reports.createdAt));

    return { data, total: data.length };
  });

  app.get("/rekening/:bank/:value", async (req, reply) => {
    const { bank, value } = req.params as { bank: string; value: string };

    const data = await db.select().from(reports)
      .where(and(
        eq(reports.targetType, "bank_account"),
        eq(reports.bankName, bank),
        eq(reports.targetValue, value)
      ))
      .orderBy(desc(reports.createdAt));

    return { data, total: data.length };
  });

  app.get("/ewallet/:wallet/:value", async (req, reply) => {
    const { wallet, value } = req.params as { wallet: string; value: string };

    const data = await db.select().from(reports)
      .where(and(
        eq(reports.targetType, "ewallet"),
        eq(reports.walletName, wallet),
        eq(reports.targetValue, value)
      ))
      .orderBy(desc(reports.createdAt));

    return { data, total: data.length };
  });
}