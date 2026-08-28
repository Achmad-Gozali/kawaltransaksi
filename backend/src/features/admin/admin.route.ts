import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../core/db.js";
import { reports, users, evidence, articles } from "../../core/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdmin } from "../../core/auth.middleware.js";
import { deleteFile } from "../../core/storage.js";
import { sanitizeArticleHtml, sanitizePlainText } from "../../core/sanitize.js";
import { notifyReportVerified, toLiveReport } from "../../core/realtime.js";

// Sama seperti reports.route.ts/search.route.ts: endpoint publik read-only,
// cache pendek biar Cloudflare bisa menyerap traffic berulang tanpa
// membebani DB. HANYA dipasang di endpoint /articles/public* di bawah --
// jangan dipasang di endpoint admin (butuh preHandler: requireAdmin).
function withPublicCache(_req: FastifyRequest, reply: FastifyReply, payload: unknown, done: (err: Error | null, payload?: unknown) => void) {
  reply.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  done(null, payload);
}

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

    // Satu query: cross join dua subquery satu-baris (reports + users), tiap
    // tabel di-scan sekali dengan COUNT(*) FILTER. Dulu 6 query terpisah.
    const [row] = await db.execute(sql`
      SELECT
        r.total_reports, r.pending, r.verified, r.rejected,
        u.total_users, u.new_users
      FROM
        (SELECT
           COUNT(*)::int                                        AS total_reports,
           COUNT(*) FILTER (WHERE status = 'pending')::int       AS pending,
           COUNT(*) FILTER (WHERE status = 'verified')::int      AS verified,
           COUNT(*) FILTER (WHERE status = 'rejected')::int      AS rejected
         FROM reports) r,
        (SELECT
           COUNT(*)::int                                              AS total_users,
           COUNT(*) FILTER (WHERE created_at >= ${sevenDaysAgo})::int  AS new_users
         FROM users) u
    `);
    const d = row as unknown as Record<string, unknown>;

    return {
      data: {
        totalReports: Number(d.total_reports),
        totalUsers:   Number(d.total_users),
        pending:      Number(d.pending),
        verified:     Number(d.verified),
        rejected:     Number(d.rejected),
        newUsers:     Number(d.new_users),
      },
    };
  });

  // Agregat untuk tab Statistik -- semua GROUP BY dikerjakan di SQL, bukan
  // dengan menarik ribuan baris mentah ke browser lalu di-reduce di sana.
  // Bucket harian pakai zona Asia/Jakarta (WIB) supaya "hari ini" konsisten
  // dengan sisa aplikasi, bukan bergantung timezone browser admin.
  app.get("/analytics", { preHandler: requireAdmin }, async () => {
    const [typeRows, categoryRows, platformRows, trendRows, lossRows] = await Promise.all([
      db.execute(sql`
        SELECT target_type AS "targetType", COUNT(*)::int AS count
        FROM reports GROUP BY target_type
      `),
      db.execute(sql`
        SELECT COALESCE(NULLIF(category, ''), 'Lainnya') AS category, COUNT(*)::int AS count
        FROM reports GROUP BY COALESCE(NULLIF(category, ''), 'Lainnya')
      `),
      db.execute(sql`
        SELECT platform, COUNT(*)::int AS count
        FROM reports
        WHERE platform IS NOT NULL AND platform <> ''
        GROUP BY platform
      `),
      db.execute(sql`
        WITH days AS (
          SELECT generate_series(
            (now() AT TIME ZONE 'Asia/Jakarta')::date - INTERVAL '29 days',
            (now() AT TIME ZONE 'Asia/Jakarta')::date,
            INTERVAL '1 day'
          )::date AS d
        )
        SELECT
          to_char(days.d, 'YYYY-MM-DD')                                        AS date,
          COUNT(r.id)::int                                                     AS total,
          COUNT(r.id) FILTER (WHERE r.status = 'verified')::int                AS verified,
          COUNT(r.id) FILTER (WHERE r.status = 'pending')::int                 AS pending,
          COALESCE(SUM(r.amount) FILTER (WHERE r.amount IS NOT NULL), 0)::bigint AS loss
        FROM days
        LEFT JOIN reports r
          ON (r.created_at AT TIME ZONE 'Asia/Jakarta')::date = days.d
        GROUP BY days.d
        ORDER BY days.d
      `),
      db.execute(sql`
        SELECT
          COALESCE(SUM(amount), 0)::bigint                             AS "lossTotal",
          COUNT(*) FILTER (WHERE amount IS NOT NULL AND amount > 0)::int AS "lossReportCount"
        FROM reports
      `),
    ]);

    const lossAgg = (lossRows as any[])[0] ?? { lossTotal: 0, lossReportCount: 0 };

    return {
      data: {
        typeCounts: (typeRows as any[]).map((r) => ({ targetType: r.targetType, count: Number(r.count) })),
        categoryCounts: (categoryRows as any[]).map((r) => ({ category: r.category, count: Number(r.count) })),
        platformCounts: (platformRows as any[]).map((r) => ({ platform: r.platform, count: Number(r.count) })),
        dailyTrend: (trendRows as any[]).map((r) => ({
          date: r.date,
          total: Number(r.total),
          verified: Number(r.verified),
          pending: Number(r.pending),
          loss: Number(r.loss),
        })),
        lossTotal: Number(lossAgg.lossTotal),
        lossReportCount: Number(lossAgg.lossReportCount),
      },
    };
  });

  app.get("/activity", { preHandler: requireAdmin }, async () => {
    const LIMIT = 15; // ambil lebih banyak dari kebutuhan tampilan (biasanya 5), supaya setelah digabung & diurutkan tetap cukup

    // Laporan yang baru masuk
    const newReports = await db.execute(sql`
      SELECT id, target_value, created_at AS ts
      FROM reports
      ORDER BY created_at DESC
      LIMIT ${LIMIT}
    `);

    // Laporan yang statusnya berubah (verified/rejected) — pakai updated_at sebagai proxy waktu perubahan status.
    // Catatan: updated_at ikut berubah untuk update reports lain di masa depan; saat ini aman karena
    // satu-satunya endpoint yang men-touch updated_at adalah PATCH /reports/:id/status.
    const statusChanges = await db.execute(sql`
      SELECT id, target_value, status, updated_at AS ts
      FROM reports
      WHERE status IN ('verified', 'rejected') AND updated_at > created_at
      ORDER BY updated_at DESC
      LIMIT ${LIMIT}
    `);

    // Pengguna baru
    const newUsers = await db.execute(sql`
      SELECT id, email, created_at AS ts
      FROM users
      ORDER BY created_at DESC
      LIMIT ${LIMIT}
    `);

    // Artikel baru dipublikasikan
    const newArticles = await db.execute(sql`
      SELECT id, title, published_at AS ts
      FROM articles
      WHERE status = 'published' AND published_at IS NOT NULL
      ORDER BY published_at DESC
      LIMIT ${LIMIT}
    `);

    type ActivityItem = {
      type: "report_new" | "report_verified" | "report_rejected" | "user_new" | "article_published";
      id: string;
      label: string;
      ts: string;
    };

    const items: ActivityItem[] = [
      ...(newReports as any[]).map(r => ({
        type: "report_new" as const,
        id: r.id,
        label: `Laporan ID ${r.target_value} menunggu review`,
        ts: r.ts,
      })),
      ...(statusChanges as any[]).map(r => ({
        type: r.status === "verified" ? ("report_verified" as const) : ("report_rejected" as const),
        id: r.id,
        label: `Laporan ID ${r.target_value} telah ${r.status === "verified" ? "diverifikasi" : "ditolak"}`,
        ts: r.ts,
      })),
      ...(newUsers as any[]).map(u => ({
        type: "user_new" as const,
        id: u.id,
        label: `${u.email} telah mendaftar`,
        ts: u.ts,
      })),
      ...(newArticles as any[]).map(a => ({
        type: "article_published" as const,
        id: a.id,
        label: `"${a.title}"`,
        ts: a.ts,
      })),
    ]
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, LIMIT);

    return { data: items };
  });

  // ── REPORTS ────────────────────────────────────────────────────────────────
  app.get("/reports", { preHandler: requireAdmin }, async (req) => {
    const { status, targetType, page = "1", limit = "20", q = "" } = req.query as any;
    // Clamp: nilai non-numerik bikin LIMIT/OFFSET jadi NaN (query gagal -> 500),
    // dan limit tak terbatas memungkinkan satu request menarik seluruh tabel.
    const parsedPage  = Number.parseInt(String(page), 10);
    const parsedLimit = Number.parseInt(String(limit), 10);
    const pageNum     = Number.isFinite(parsedPage)  ? Math.min(Math.max(1, parsedPage), 10000) : 1;
    const limitNum    = Number.isFinite(parsedLimit) ? Math.min(Math.max(1, parsedLimit), 100)  : 20;
    const offset      = (pageNum - 1) * limitNum;
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
      LIMIT ${limitNum} OFFSET ${offset}
    `);
    return { data: rows };
  });

  app.patch("/reports/:id/status", { preHandler: requireAdmin }, async (req, reply) => {
    const { id }     = req.params as { id: string };
    const { status } = req.body as { status: "verified" | "rejected" };

    // Ambil status lama dulu -- guard supaya report_verified tidak double-fire
    // kalau admin men-set 'verified' pada laporan yang memang sudah 'verified'.
    const [before] = await db
      .select({ status: reports.status })
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);
    if (!before) return reply.status(404).send({ error: "Laporan tidak ditemukan." });

    const [updated]  = await db.update(reports)
      .set({ status, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    if (!updated) return reply.status(404).send({ error: "Laporan tidak ditemukan." });

    if (status === "verified" && before.status !== "verified") {
      notifyReportVerified(toLiveReport(updated)).catch((err) =>
        req.log.error({ err }, "realtime: gagal NOTIFY report_verified (admin)"),
      );
    }

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
    if (!updated) return reply.status(404).send({ error: "Pengguna tidak ditemukan." });
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

  app.get("/articles/public", { onSend: withPublicCache }, async (req) => {
    const { category, q = "", page = "1" } = req.query as any;
    // Number("abc") -> NaN membuat OFFSET NaN dan endpoint publik ini balas 500.
    const parsedPage = Number.parseInt(String(page), 10);
    const pageNum = Number.isFinite(parsedPage) ? Math.min(Math.max(1, parsedPage), 1000) : 1;
    const offset = (pageNum - 1) * 12;

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

  app.get("/articles/public/:slug", { onSend: withPublicCache }, async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const [article] = await db.select().from(articles)
      .where(eq(articles.slug, slug)).limit(1);
    if (!article || article.status !== "published")
      return reply.status(404).send({ error: "Artikel tidak ditemukan." });
    return { data: article };
  });

  app.get("/articles/sitemap", { onSend: withPublicCache }, async () => {
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
    if (!article) return reply.status(404).send({ error: "Artikel tidak ditemukan." });
    return { data: article };
  });

  app.post("/articles", { preHandler: requireAdmin }, async (req, reply) => {
    const { title, excerpt, content, thumbnail, category, status } = req.body as any;

    // Judul & excerpt jadi teks polos; konten disanitasi tapi tetap HTML.
    const cleanTitle   = sanitizePlainText(title);
    const cleanExcerpt = excerpt != null ? sanitizePlainText(excerpt) : null;
    const cleanContent = sanitizeArticleHtml(content);

    if (!cleanTitle)
      return reply.status(400).send({ error: "Judul artikel wajib diisi." });

    const slug = slugify(cleanTitle);
    if (!slug)
      return reply.status(400).send({ error: "Judul artikel harus mengandung huruf atau angka." });

    const [article] = await db.insert(articles).values({
      title: cleanTitle, slug, excerpt: cleanExcerpt, content: cleanContent,
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
    if (!existing) return reply.status(404).send({ error: "Artikel tidak ditemukan." });

    const thumbnailChanged = thumbnail !== undefined && thumbnail !== existing.thumbnail;
    if (thumbnailChanged) {
      await deleteFile(existing.thumbnail);
    }

    // Sanitasi hanya untuk field yang benar-benar dikirim; field yang tidak
    // dikirim tetap memakai nilai lama apa adanya (perilaku PATCH sebelumnya).
    const cleanTitle   = title   != null ? sanitizePlainText(title)      : null;
    const cleanExcerpt = excerpt != null ? sanitizePlainText(excerpt)    : null;
    const cleanContent = content != null ? sanitizeArticleHtml(content)  : null;

    if (title != null && !cleanTitle)
      return reply.status(400).send({ error: "Judul artikel tidak boleh kosong." });

    const [updated] = await db.update(articles).set({
      title:       cleanTitle   ?? existing.title,
      slug:        cleanTitle   ? slugify(cleanTitle) : existing.slug,
      excerpt:     cleanExcerpt ?? existing.excerpt,
      content:     cleanContent ?? existing.content,
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