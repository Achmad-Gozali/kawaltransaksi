import type { FastifyInstance } from "fastify";
import { db } from "../../core/db.js";
import { reports, users, evidence, articles } from "../../core/schema.js";
import { eq, desc, count, sql, gte } from "drizzle-orm";
import { requireAdmin } from "../../core/auth.middleware.js";
import { deleteFile } from "../../core/storage.js";

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function adminRoutes(app: FastifyInstance) {
  // ── STATS ──────────────────────────────────────────────────────────────────
  app.get("/stats", { preHandler: requireAdmin }, async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalReports] = await db.select({ count: count() }).from(reports);
    const [totalUsers]   = await db.select({ count: count() }).from(users);
    const [pending]      = await db.select({ count: count() }).from(reports).where(eq(reports.status, "pending"));
    const [verified]     = await db.select({ count: count() }).from(reports).where(eq(reports.status, "verified"));
    const [rejected]     = await db.select({ count: count() }).from(reports).where(eq(reports.status, "rejected"));
    const [newUsers]     = await db.select({ count: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo));

    return {
      data: {
        totalReports: totalReports.count,
        totalUsers:   totalUsers.count,
        pending:      pending.count,
        verified:     verified.count,
        rejected:     rejected.count,
        newUsers:     newUsers.count,
      },
    };
  });

  // ── REPORTS ────────────────────────────────────────────────────────────────
  app.get("/reports", { preHandler: requireAdmin }, async (req) => {
    const { status, targetType, page = "1", limit = "20", q = "" } = req.query as any;
    const offset       = (Number(page) - 1) * Number(limit);
    const statusFilter = status ? sql`AND r.status = ${status}` : sql``;
    const typeFilter   = targetType ? sql`AND r.target_type = ${targetType}` : sql``;
    const searchFilter = q.trim()
      ? sql`AND (r.target_value ILIKE ${"%" + q.trim() + "%"} OR r.category ILIKE ${"%" + q.trim() + "%"} OR u.email ILIKE ${"%" + q.trim() + "%"})`
      : sql``;

    const rows = await db.execute(sql`
      SELECT r.*,
        COALESCE(json_agg(e.url) FILTER (WHERE e.url IS NOT NULL), '[]') AS evidence_urls,
        u.name  AS user_name,
        u.email AS user_email
      FROM reports r
      LEFT JOIN evidence e ON e.report_id = r.id
      LEFT JOIN users u ON u.id = r.user_id
      WHERE 1=1 ${statusFilter} ${typeFilter} ${searchFilter}
      GROUP BY r.id, u.name, u.email
      ORDER BY r.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${offset}
    `);
    return { data: rows };
  });

  app.patch("/reports/:id/status", { preHandler: requireAdmin }, async (req, reply) => {
    const { id }     = req.params as { id: string };
    const { status } = req.body as { status: "verified" | "rejected" };
    const [updated]  = await db.update(reports)
      .set({ status, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    if (!updated) return reply.status(404).send({ error: "Not found" });
    return { data: updated };
  });

  app.delete("/reports/:id", { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const [existing] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!existing) return reply.status(404).send({ error: "Laporan tidak ditemukan." });

    // Hapus semua file evidence yang terkait sebelum hapus baris database,
    // supaya tidak ada file yatim (orphaned) tertinggal di storage.
    const relatedEvidence = await db.select().from(evidence).where(eq(evidence.reportId, id));
    for (const e of relatedEvidence) {
      await deleteFile(e.url);
    }
    if (existing.suspectPhotoUrl) {
      await deleteFile(existing.suspectPhotoUrl);
    }

    // evidence dihapus dulu (foreign key ke reports), baru laporan-nya sendiri
    await db.delete(evidence).where(eq(evidence.reportId, id));
    await db.delete(reports).where(eq(reports.id, id));

    return { message: "Laporan berhasil dihapus." };
  });

  // ── USERS ──────────────────────────────────────────────────────────────────
  app.get("/users", { preHandler: requireAdmin }, async () => {
    const data = await db.execute(sql`
      SELECT
        u.id, u.name, u.email, u.role, u.created_at,
        COUNT(r.id)::int AS report_count
      FROM users u
      LEFT JOIN reports r ON r.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    return { data };
  });

  app.patch("/users/:id/role", { preHandler: requireAdmin }, async (req, reply) => {
    const { id }   = req.params as { id: string };
    const { role } = req.body as { role: "user" | "admin" };
    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updated) return reply.status(404).send({ error: "Not found" });
    return { data: updated };
  });

  // ── ARTICLES ───────────────────────────────────────────────────────────────
  app.get("/articles", { preHandler: requireAdmin }, async (req) => {
    const { status, q = "" } = req.query as any;
    let query = db.select({
      id: articles.id, title: articles.title, slug: articles.slug,
      excerpt: articles.excerpt, thumbnail: articles.thumbnail,
      category: articles.category, status: articles.status,
      publishedAt: articles.publishedAt, createdAt: articles.createdAt,
    }).from(articles).orderBy(desc(articles.createdAt)).$dynamic();

    if (status) query = query.where(eq(articles.status, status));
    const data = await query;
    return { data };
  });

  app.get("/articles/public", async (req) => {
    const { category, q = "", page = "1" } = req.query as any;
    const offset = (Number(page) - 1) * 12;

    const catFilter = category ? sql`AND category = ${category}` : sql``;
    const qFilter   = q.trim() ? sql`AND (title ILIKE ${"%" + q.trim() + "%"} OR excerpt ILIKE ${"%" + q.trim() + "%"})` : sql``;

    const rows = await db.execute(sql`
      SELECT id, title, slug, excerpt, thumbnail, category, published_at, created_at
      FROM articles
      WHERE status = 'published' ${catFilter} ${qFilter}
      ORDER BY published_at DESC
      LIMIT 12 OFFSET ${offset}
    `);
    return { data: rows };
  });

  app.get("/articles/public/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const [article] = await db.select().from(articles)
      .where(eq(articles.slug, slug)).limit(1);
    if (!article || article.status !== "published")
      return reply.status(404).send({ error: "Artikel tidak ditemukan." });
    return { data: article };
  });

  app.get("/articles/sitemap", async () => {
    const rows = await db.execute(sql`
      SELECT slug, updated_at
      FROM articles
      WHERE status = 'published'
      ORDER BY updated_at DESC
    `);
    return { data: rows };
  });

  app.get("/articles/:id", { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!article) return reply.status(404).send({ error: "Not found" });
    return { data: article };
  });

  app.post("/articles", { preHandler: requireAdmin }, async (req) => {
    const { title, excerpt, content, thumbnail, category, status } = req.body as any;
    const slug = slugify(title);
    const [article] = await db.insert(articles).values({
      title, slug, excerpt: excerpt ?? null, content: content ?? "",
      thumbnail: thumbnail ?? null, category: category ?? "tips",
      status:      status ?? "draft",
      authorId:    req.user!.userId,
      publishedAt: status === "published" ? new Date() : null,
    }).returning();
    return { data: article };
  });

  app.patch("/articles/:id", { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { title, excerpt, content, thumbnail, category, status } = req.body as any;

    const [existing] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!existing) return reply.status(404).send({ error: "Not found" });

    const thumbnailChanged = thumbnail !== undefined && thumbnail !== existing.thumbnail;
    if (thumbnailChanged) {
      await deleteFile(existing.thumbnail);
    }

    const [updated] = await db.update(articles).set({
      title:       title       ?? existing.title,
      slug:        title       ? slugify(title) : existing.slug,
      excerpt:     excerpt     ?? existing.excerpt,
      content:     content     ?? existing.content,
      thumbnail:   thumbnail   ?? existing.thumbnail,
      category:    category    ?? existing.category,
      status:      status      ?? existing.status,
      publishedAt: status === "published" && !existing.publishedAt ? new Date() : existing.publishedAt,
      updatedAt:   new Date(),
    }).where(eq(articles.id, id)).returning();

    return { data: updated };
  });

  app.delete("/articles/:id", { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const [existing] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (existing?.thumbnail) {
      await deleteFile(existing.thumbnail);
    }

    await db.delete(articles).where(eq(articles.id, id));
    return { message: "Artikel dihapus." };
  });
}