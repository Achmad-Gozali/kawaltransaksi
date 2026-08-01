import type { FastifyInstance } from "fastify";
import { db } from "../../core/db.js";
import { reports, evidence } from "../../core/schema.js";
import { eq, desc, count, and, sql } from "drizzle-orm";
import { requireAuth } from "../../core/auth.middleware.js";
import { saveFile, validateImageBuffer } from "../../core/storage.js";
import { checkSpam, checkCompleteness } from "../../core/robot.js";
import { verifyTurnstile } from "../../core/turnstile.js";

const MAX_FILES_PER_REQUEST = 10;

export async function reportsRoutes(app: FastifyInstance) {
  app.get("/public/recent", async () => {
    const data = await db
      .select()
      .from(reports)
      .where(sql`${reports.status} IN ('pending', 'verified')`)
      .orderBy(desc(reports.createdAt))
      .limit(6);
    return { data };
  });

  app.get("/public/stats", async () => {
    const [total] = await db.select({ count: count() }).from(reports);
    const [verified] = await db
      .select({ count: count() })
      .from(reports)
      .where(eq(reports.status, "verified"));
    const [lossRow] = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0)::bigint AS total_loss
      FROM reports WHERE status = 'verified' AND amount IS NOT NULL
    `);
    return {
      data: {
        total: total.count,
        verified: verified.count,
        totalLoss: Number((lossRow as any).total_loss ?? 0),
      },
    };
  });

  app.get("/public/stats-nomor", async () => {
    const [total] = await db
      .select({ count: count() })
      .from(reports)
      .where(eq(reports.targetType, "phone"));
    const [verified] = await db
      .select({ count: count() })
      .from(reports)
      .where(
        and(eq(reports.targetType, "phone"), eq(reports.status, "verified")),
      );
    const [lossRow] = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0)::bigint AS total_loss
      FROM reports WHERE target_type = 'phone' AND status = 'verified' AND amount IS NOT NULL
    `);
    return {
      data: {
        totalLaporan: total.count,
        totalNomor: verified.count,
        totalKerugian: Number((lossRow as any).total_loss ?? 0),
      },
    };
  });

  app.get("/public/stats-rekening", async () => {
    const [total] = await db
      .select({ count: count() })
      .from(reports)
      .where(eq(reports.targetType, "bank_account"));
    const [verified] = await db
      .select({ count: count() })
      .from(reports)
      .where(
        and(
          eq(reports.targetType, "bank_account"),
          eq(reports.status, "verified"),
        ),
      );
    const [lossRow] = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0)::bigint AS total_loss
      FROM reports WHERE target_type = 'bank_account' AND status = 'verified' AND amount IS NOT NULL
    `);
    return {
      data: {
        totalLaporan: total.count,
        totalRekening: verified.count,
        totalKerugian: Number((lossRow as any).total_loss ?? 0),
      },
    };
  });

  app.get("/public/leaderboard-nomor", async () => {
    const rows = await db.execute(sql`
      SELECT
        target_value AS target_number,
        COALESCE(bank_name, wallet_name) AS bank_name,
        COUNT(*)::int AS report_count
      FROM reports
      WHERE target_type = 'phone'
      AND status = 'verified'
      AND target_value IS NOT NULL
      GROUP BY target_value, COALESCE(bank_name, wallet_name)
      ORDER BY report_count DESC
      LIMIT 5
    `);
    return { data: rows };
  });

  app.get("/public/leaderboard-rekening", async () => {
    const rows = await db.execute(sql`
      SELECT
        target_value AS target_number,
        COALESCE(bank_name, wallet_name) AS bank_name,
        COUNT(*)::int AS report_count
      FROM reports
      WHERE target_type = 'bank_account'
      AND status = 'verified'
      AND target_value IS NOT NULL
      GROUP BY target_value, COALESCE(bank_name, wallet_name)
      ORDER BY report_count DESC
      LIMIT 5
    `);
    return { data: rows };
  });

  app.get("/public/bank/:name", async (req) => {
    const { name } = req.params as { name: string };
    const data = await db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.targetType, "bank_account"),
          sql`${reports.bankName} ILIKE ${"%" + name + "%"}`,
          eq(reports.status, "verified"),
        ),
      )
      .orderBy(desc(reports.createdAt))
      .limit(6);
    return { data: { primary: data, linked: [] } };
  });

  app.get("/public/ewallet/:name", async (req) => {
    const { name } = req.params as { name: string };
    const data = await db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.targetType, "ewallet"),
          sql`${reports.walletName} ILIKE ${"%" + name + "%"}`,
          eq(reports.status, "verified"),
        ),
      )
      .orderBy(desc(reports.createdAt))
      .limit(6);
    return { data: { primary: data, linked: [] } };
  });

  app.get("/public/check/:number", async (req) => {
    const { number } = req.params as { number: string };
    const data = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.targetValue, number),
        sql`${reports.status} IN ('pending', 'verified')`,
      ))
      .orderBy(desc(reports.createdAt));

    if (data.length === 0) return { data: { reports: [], linked: [] } };

    const allEvidence = await db
      .select()
      .from(evidence)
      .where(
        sql`${evidence.reportId} IN (${sql.join(
          data.map((r: typeof reports.$inferSelect) => sql`${r.id}`),
          sql`, `,
        )})`,
      );

    const evidenceMap = new Map<string, string[]>();
    allEvidence.forEach((e: typeof evidence.$inferSelect) => {
      if (!evidenceMap.has(e.reportId)) evidenceMap.set(e.reportId, []);
      evidenceMap.get(e.reportId)!.push(e.url);
    });

    const reportsWithEvidence = data.map((r: typeof reports.$inferSelect) => ({
      ...r,
      evidenceUrls: evidenceMap.get(r.id) ?? [],
    }));

    return { data: { reports: reportsWithEvidence, linked: [] } };
  });

  app.get("/public/blacklist/:number", async (req) => {
    const { number } = req.params as { number: string };
    const verified = await db
      .select()
      .from(reports)
      .where(
        and(eq(reports.targetValue, number), eq(reports.status, "verified")),
      );
    if (verified.length === 0)
      return { data: { blacklist: null, trend: null } };
    const level =
      verified.length >= 5
        ? "critical"
        : verified.length >= 3
          ? "high"
          : "medium";
    return {
      data: {
        blacklist: { level, unique_reporters: verified.length },
        trend: null,
      },
    };
  });

  app.get("/public/sitemap-targets", async () => {
    const rows = await db.execute(sql`
      SELECT
        target_value,
        MAX(created_at) AS last_reported
      FROM reports
      WHERE status IN ('verified', 'pending')
      GROUP BY target_value
      ORDER BY last_reported DESC
    `);
    return { data: rows };
  });

  app.get("/laporan-stats", async () => {
    const data = await db
      .select({
        bank_name: sql<string | null>`COALESCE(${reports.bankName}, ${reports.walletName})`,
        category: reports.category,
        status: reports.status,
        created_at: reports.createdAt,
      })
      .from(reports)
      .where(sql`${reports.status} IN ('verified', 'pending')`)
      .orderBy(desc(reports.createdAt))
      .limit(1000);
    return { data };
  });

  app.get("/laporan-publik", async (req) => {
    const {
      type = "all",
      sort = "latest",
      q = "",
      page = "1",
    } = req.query as {
      type?: string;
      sort?: string;
      q?: string;
      page?: string;
    };

    const pageNum = Math.max(1, parseInt(page));
    const perPage = 12;
    const offset = (pageNum - 1) * perPage;
    const sortDir = sort === "oldest" ? sql`ASC` : sql`DESC`;
    const typeFilter =
      type !== "all" ? sql`AND r.target_type = ${type}` : sql``;
    const searchFilter = q.trim()
      ? sql`AND (r.target_value ILIKE ${"%" + q.trim() + "%"} OR r.bank_name ILIKE ${"%" + q.trim() + "%"} OR r.wallet_name ILIKE ${"%" + q.trim() + "%"})`
      : sql``;

    const rows = await db.execute(sql`
      SELECT
        r.target_value                                        AS target_number,
        r.target_type,
        COALESCE(r.bank_name, r.wallet_name)                 AS bank_name,
        COUNT(*)::int                                        AS total,
        COUNT(*) FILTER (WHERE r.status = 'verified')::int   AS verified_count,
        COUNT(*) FILTER (WHERE r.status = 'pending')::int    AS pending_count,
        MAX(r.created_at)                                    AS latest_at,
        (SELECT rr.target_name FROM reports rr WHERE rr.target_value = r.target_value AND rr.status = 'verified' LIMIT 1) AS target_name,
        (SELECT rr.category FROM reports rr WHERE rr.target_value = r.target_value ORDER BY rr.created_at DESC LIMIT 1)   AS category
      FROM reports r
      WHERE 1=1 ${typeFilter} ${searchFilter}
      GROUP BY r.target_value, r.target_type, COALESCE(r.bank_name, r.wallet_name)
      ORDER BY latest_at ${sortDir}
      LIMIT ${perPage} OFFSET ${offset}
    `);

    const [countRow] = await db.execute(sql`
      SELECT COUNT(DISTINCT r.target_value)::int AS total_unique
      FROM reports r WHERE 1=1 ${typeFilter} ${searchFilter}
    `);

    return {
      data: { data: rows, total_unique: (countRow as any).total_unique ?? 0 },
    };
  });

  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);
    if (!report) return reply.status(404).send({ error: "Not found" });
    return { data: report };
  });

  app.post("/", {
    preHandler: requireAuth,
    config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
  }, async (req, reply) => {
    const {
      targetType,
      targetValue,
      targetName,
      bankName,
      walletName,
      amount,
      description,
      chronology,
      category,
      platform,
      incidentDate,
      hasOtherVictims,
      storeName,
      suspectCity,
      suspectPhotoUrl,
      socialMediaAccounts,
      linkUrl,
      reportedTo,
      evidenceUrls,
      turnstileToken,
    } = req.body as any;

    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid)
      return reply.status(400).send({ error: "Verifikasi keamanan tidak berhasil. Silakan coba kembali." });

    const cleanTargetValue = typeof targetValue === "string" ? targetValue.replace(/\D/g, "") : "";
    if (!cleanTargetValue)
      return reply.status(400).send({ error: "Nomor tujuan wajib diisi dan hanya boleh berisi angka." });

    const spamResult = await checkSpam({
      userId: req.user!.userId,
      targetType,
      targetValue: cleanTargetValue,
      description: description ?? "",
    });

    if (spamResult.rejected) {
      return reply.status(400).send({ error: spamResult.reason });
    }

    const status = await checkCompleteness({
      userId: req.user!.userId,
      description,
      chronology,
      category,
      amount,
      targetType,
      targetValue: cleanTargetValue,
      evidenceUrls: evidenceUrls ?? [],
    });

    const [report] = await db
      .insert(reports)
      .values({
        userId: req.user!.userId,
        targetType,
        targetValue: cleanTargetValue,
        targetName: targetName ?? null,
        bankName: bankName ?? null,
        walletName: walletName ?? null,
        amount: amount ?? null,
        description,
        chronology: chronology ?? null,
        category: category ?? null,
        platform: platform ?? null,
        incidentDate: incidentDate ? new Date(incidentDate) : null,
        hasOtherVictims: hasOtherVictims ?? null,
        storeName: storeName ?? null,
        suspectCity: suspectCity ?? null,
        suspectPhotoUrl: suspectPhotoUrl ?? null,
        socialMediaAccounts: socialMediaAccounts ?? null,
        linkUrl: linkUrl ?? null,
        reportedTo: reportedTo ?? null,
        status,
      })
      .returning();

    if (evidenceUrls?.length) {
      await db
        .insert(evidence)
        .values(
          evidenceUrls.map((url: string) => ({ reportId: report.id, url })),
        );
    }

    return { data: { ...report, robotStatus: status } };
  });

  app.post("/:id/evidence", {
    preHandler: requireAuth,
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);
    if (!report) return reply.status(404).send({ error: "Report not found" });
    if (report.userId !== req.user!.userId)
      return reply.status(403).send({ error: "Forbidden" });

    const parts = req.files();
    const saved: string[] = [];
    let fileCount = 0;

    for await (const part of parts) {
      fileCount++;
      if (fileCount > MAX_FILES_PER_REQUEST) {
        return reply.status(400).send({ error: `Maksimal ${MAX_FILES_PER_REQUEST} file per permintaan.` });
      }

      const buffer = await part.toBuffer();
      const validation = validateImageBuffer(buffer, part.mimetype);

      if (!validation.valid) {
        return reply.status(400).send({ error: validation.error });
      }

      const url = await saveFile(buffer, `evidence${validation.ext}`, "reports");
      await db.insert(evidence).values({ reportId: id, url });
      saved.push(url);
    }

    return { data: saved };
  });

  app.get("/my", { preHandler: requireAuth }, async (req) => {
    const data = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, req.user!.userId))
      .orderBy(desc(reports.createdAt));
    return { data };
  });
}