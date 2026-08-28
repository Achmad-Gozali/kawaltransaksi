import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../core/db.js";
import { reports, evidence, publicReportColumns } from "../../core/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "../../core/auth.middleware.js";
import { saveFile, validateImageBuffer, isOwnStorageUrl } from "../../core/storage.js";
import { checkSpam, checkCompleteness, looksLikeQrisNmid } from "../../core/robot.js";
import { verifyTurnstile } from "../../core/turnstile.js";
import { parseQrisPayload } from "../../core/qris.js";
import {
  registerStreamClient,
  unregisterStreamClient,
  isStreamAtCapacity,
  notifyReportSubmitted,
  notifyReportVerified,
  toLiveReport,
} from "../../core/realtime.js";

const MAX_FILES_PER_REQUEST = 10;

// Endpoint publik di bawah ini (read-only, tidak butuh auth, tidak
// personalized) dipanggil berulang oleh frontend (halaman cek nomor/rekening
// di-hit banyak pengunjung + bot/crawler) padahal datanya baru berubah kalau
// admin memverifikasi laporan (hitungan jam/hari, bukan detik). Cache publik
// singkat ini membiarkan Cloudflare menyerap sebagian besar traffic berulang
// tanpa membebani DB, sementara data tetap terasa real-time untuk keperluan
// cek sebelum transaksi.
const PUBLIC_CACHE = "public, max-age=30, stale-while-revalidate=60";
function withPublicCache(_req: FastifyRequest, reply: FastifyReply, payload: unknown, done: (err: Error | null, payload?: unknown) => void) {
  reply.header("Cache-Control", PUBLIC_CACHE);
  done(null, payload);
}

// Rate limit per-IP untuk endpoint lookup "cek" (nomor/rekening/e-wallet/QRIS),
// mengikuti pola di search.route.ts (10 request/menit). Mencegah scraping massal
// database lewat hit langsung ke API publik.
//
// allowList: request SSR dari container frontend (fetch ke http://backend:4000)
// TIDAK lewat nginx sehingga tidak punya header X-Forwarded-For -- itu adalah
// trafik render halaman yang sah dan tidak boleh dibatasi per-"IP frontend".
// Trafik dari luar (browser -> Cloudflare -> nginx -> API) selalu membawa
// X-Forwarded-For, dan di situlah limit per-IP berlaku (req.ip sudah memakai
// leftmost X-Forwarded-For karena trustProxy: true). Frontend meneruskan
// X-Forwarded-For asli pengunjung saat SSR halaman /check, /cek-rekening/[bank],
// dan /cek-nomor/cek-ewallet/[wallet] -- lihat core/http.ts.
const publicCheckRateLimit = {
  max: 10,
  timeWindow: "1 minute",
  allowList: (req: FastifyRequest) => !req.headers["x-forwarded-for"],
  errorResponseBuilder: (_req: FastifyRequest, context: { ttl: number }) => ({
    statusCode: 429,
    error: `Terlalu banyak permintaan pengecekan. Coba lagi dalam ${Math.ceil(context.ttl / 1000)} detik.`,
  }),
};

// Statistik per targetType (phone/bank_account/qris) untuk endpoint /public/stats-*.
// Satu query: total laporan tipe itu (semua status), jumlah verified, dan total
// kerugian dari yang verified. SUM mengabaikan NULL, jadi identik dengan versi
// lama yang punya "AND amount IS NOT NULL" eksplisit.
async function targetTypeStats(targetType: "phone" | "bank_account" | "qris") {
  const [row] = await db.execute(sql`
    SELECT
      COUNT(*)::int                                                  AS total,
      COUNT(*) FILTER (WHERE status = 'verified')::int               AS verified,
      COALESCE(SUM(amount) FILTER (WHERE status = 'verified'), 0)::bigint AS total_loss
    FROM reports
    WHERE target_type = ${targetType}
  `);
  const r = row as unknown as Record<string, unknown>;
  return {
    totalLaporan: Number(r.total),
    verified: Number(r.verified),
    totalKerugian: Number(r.total_loss),
  };
}

export async function reportsRoutes(app: FastifyInstance) {
  // ── Stream realtime (SSE) ────────────────────────────────────────────────
  // Publik, tanpa auth. Dipakai bersama oleh homepage + halaman kategori;
  // frontend yang memfilter event per targetType. rateLimit dimatikan supaya
  // reconnect dari jaringan mobile tidak kena limit (lihat juga allowList di
  // index.ts + `limit_req off` di nginx untuk path ini).
  app.get("/stream", { config: { rateLimit: false } }, (req, reply) => {
    // Tolak lebih awal kalau proses ini sudah melayani MAX_STREAM_CLIENTS
    // koneksi -- sebelum hijack & sebelum didaftarkan. Klien EventSource akan
    // mencoba reconnect otomatis (server tetap kirim `retry: 3000` untuk yang
    // berhasil), jadi 503 di sini aman sebagai backpressure.
    if (isStreamAtCapacity()) {
      return reply
        .status(503)
        .header("Retry-After", "30")
        .send({ error: "Koneksi realtime penuh. Coba lagi sebentar." });
    }

    const origin = process.env.FRONTEND_URL ?? "*";
    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
    });
    reply.raw.write("retry: 3000\n\n");
    reply.raw.write(": connected\n\n");

    registerStreamClient(reply.raw);
    req.raw.on("close", () => unregisterStreamClient(reply.raw));
  });

  app.get("/public/recent", { onSend: withPublicCache }, async () => {
    const data = await db
      .select(publicReportColumns)
      .from(reports)
      .where(sql`${reports.status} IN ('pending', 'verified')`)
      .orderBy(desc(reports.createdAt))
      .limit(6);
    return { data };
  });

  app.get("/public/stats", { onSend: withPublicCache }, async () => {
    // Satu query: total laporan (semua status), jumlah verified, dan total
    // kerugian dari laporan verified. Dulu 3 query terpisah.
    const [row] = await db.execute(sql`
      SELECT
        COUNT(*)::int                                                  AS total,
        COUNT(*) FILTER (WHERE status = 'verified')::int               AS verified,
        COALESCE(SUM(amount) FILTER (WHERE status = 'verified'), 0)::bigint AS total_loss
      FROM reports
    `);
    const r = row as unknown as Record<string, unknown>;
    return {
      data: {
        total: Number(r.total),
        verified: Number(r.verified),
        totalLoss: Number(r.total_loss),
      },
    };
  });

  app.get("/public/stats-nomor", { onSend: withPublicCache }, async () => {
    const s = await targetTypeStats("phone");
    return { data: { totalLaporan: s.totalLaporan, totalNomor: s.verified, totalKerugian: s.totalKerugian } };
  });

  app.get("/public/stats-rekening", { onSend: withPublicCache }, async () => {
    const s = await targetTypeStats("bank_account");
    return { data: { totalLaporan: s.totalLaporan, totalRekening: s.verified, totalKerugian: s.totalKerugian } };
  });

  app.get("/public/stats-qris", { onSend: withPublicCache }, async () => {
    const s = await targetTypeStats("qris");
    return { data: { totalLaporan: s.totalLaporan, totalQris: s.verified, totalKerugian: s.totalKerugian } };
  });

  app.get("/public/leaderboard-nomor", { onSend: withPublicCache }, async () => {
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

  app.get("/public/leaderboard-rekening", { onSend: withPublicCache }, async () => {
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

  app.get("/public/bank/:name", { config: { rateLimit: publicCheckRateLimit }, onSend: withPublicCache }, async (req) => {
    const { name } = req.params as { name: string };
    const data = await db
      .select(publicReportColumns)
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

  app.get("/public/ewallet/:name", { config: { rateLimit: publicCheckRateLimit }, onSend: withPublicCache }, async (req) => {
    const { name } = req.params as { name: string };
    const data = await db
      .select(publicReportColumns)
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

  app.get("/public/check/:number", { config: { rateLimit: publicCheckRateLimit }, onSend: withPublicCache }, async (req) => {
    const { number } = req.params as { number: string };
    const data = await db
      .select(publicReportColumns)
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
          data.map((r) => sql`${r.id}`),
          sql`, `,
        )})`,
      );

    const evidenceMap = new Map<string, string[]>();
    allEvidence.forEach((e: typeof evidence.$inferSelect) => {
      if (!evidenceMap.has(e.reportId)) evidenceMap.set(e.reportId, []);
      evidenceMap.get(e.reportId)!.push(e.url);
    });

    const reportsWithEvidence = data.map((r) => ({
      ...r,
      evidenceUrls: evidenceMap.get(r.id) ?? [],
    }));

    return { data: { reports: reportsWithEvidence, linked: [] } };
  });

  app.get("/public/blacklist/:number", { config: { rateLimit: publicCheckRateLimit }, onSend: withPublicCache }, async (req) => {
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

  app.get("/public/sitemap-targets", { onSend: withPublicCache }, async () => {
    // Hanya target dengan >=1 laporan TERVERIFIKASI yang masuk sitemap /check/*.
    // Halaman /laporan-publik sengaja di-gate (perlu login), jadi /check/{slug}
    // adalah satu-satunya jalur publik ke laporan -- dan hanya yang terverifikasi
    // yang layak di-index (pending = tuduhan belum divalidasi).
    // Tanpa LIMIT: seluruh target terverifikasi ikut. Google membatasi 50.000
    // URL/sitemap; kalau mendekati itu, pindah ke sitemap index + pagination.
    const rows = await db.execute(sql`
      SELECT
        target_value,
        MAX(created_at) AS last_reported
      FROM reports
      WHERE status = 'verified'
      GROUP BY target_value
      ORDER BY last_reported DESC
    `);
    return { data: rows };
  });

  app.get("/laporan-stats", { onSend: withPublicCache }, async () => {
    // Dulu: tarik <=1000 baris mentah tiap kunjungan lalu hitung tren/kategori/
    // platform di JS (dan `.length` jadi salah begitu laporan >1000). Sekarang
    // semua agregasi dikerjakan Postgres; payload turun dari ribuan baris jadi
    // beberapa puluh. StatsChart hanya memetakan label + slice top-N.
    //
    // Cutoff 7/30 hari direplikasi persis dari StatsChart lama:
    // `new Date(now); setDate(-N); setHours(0,0,0,0)` di zona server. Container
    // frontend & Postgres sama-sama UTC, jadi pakai setUTC* di sini.
    const nowD = new Date();
    const cutoff = (days: number) => {
      const d = new Date(nowD);
      d.setUTCDate(d.getUTCDate() - days);
      d.setUTCHours(0, 0, 0, 0);
      return d.toISOString();
    };
    const c7 = cutoff(7);
    const c30 = cutoff(30);

    // Tren harian: bucket per tanggal WIB (UTC+7), seluruh riwayat. Jumlah baris
    // = jumlah hari aktif, bukan jumlah laporan. StatsChart yang membangun
    // deret hari (termasuk hari nol) dan melihat angka dari sini.
    const dailyRows = await db.execute(sql`
      SELECT to_char((created_at + interval '7 hours')::date, 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS count
      FROM reports
      WHERE status IN ('verified', 'pending')
      GROUP BY 1
      ORDER BY 1
    `);

    const [totalsRow] = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= ${c7})::int  AS c7,
        COUNT(*) FILTER (WHERE created_at >= ${c30})::int AS c30,
        COUNT(*)::int                                     AS call
      FROM reports
      WHERE status IN ('verified', 'pending')
    `);

    const categoryRows = await db.execute(sql`
      SELECT category AS name,
        COUNT(*) FILTER (WHERE created_at >= ${c7})::int  AS v7,
        COUNT(*) FILTER (WHERE created_at >= ${c30})::int AS v30,
        COUNT(*)::int                                     AS vall
      FROM reports
      WHERE status IN ('verified', 'pending') AND category IS NOT NULL
      GROUP BY category
    `);

    const platformRows = await db.execute(sql`
      SELECT target_type,
        COALESCE(bank_name, wallet_name) AS bank_name,
        COUNT(*) FILTER (WHERE created_at >= ${c7})::int  AS v7,
        COUNT(*) FILTER (WHERE created_at >= ${c30})::int AS v30,
        COUNT(*)::int                                     AS vall
      FROM reports
      WHERE status IN ('verified', 'pending')
      GROUP BY target_type, COALESCE(bank_name, wallet_name)
    `);

    const pickCats = (key: "v7" | "v30" | "vall") =>
      (categoryRows as unknown as Record<string, unknown>[])
        .map((r) => ({ name: String(r.name), value: Number(r[key]) }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

    const pickPlatforms = (key: "v7" | "v30" | "vall") =>
      (platformRows as unknown as Record<string, unknown>[])
        .map((r) => ({
          target_type: String(r.target_type),
          bank_name: (r.bank_name as string | null) ?? null,
          value: Number(r[key]),
        }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value);

    const t = totalsRow as unknown as Record<string, unknown>;
    return {
      data: {
        total: Number(t.call),
        daily: (dailyRows as unknown as Record<string, unknown>[]).map((r) => ({
          date: String(r.date),
          count: Number(r.count),
        })),
        ranges: {
          "7":   { total: Number(t.c7),   categories: pickCats("v7"),   platforms: pickPlatforms("v7") },
          "30":  { total: Number(t.c30),  categories: pickCats("v30"),  platforms: pickPlatforms("v30") },
          "all": { total: Number(t.call), categories: pickCats("vall"), platforms: pickPlatforms("vall") },
        },
      },
    };
  });

  app.get("/laporan-publik", { onSend: withPublicCache }, async (req) => {
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

    // parseInt("abc") -> NaN, dan Math.max(1, NaN) tetap NaN, sehingga OFFSET
    // NaN membuat query gagal dan endpoint publik ini balas 500. Batasi juga
    // batas atasnya supaya ?page=99999999 tidak jadi OFFSET raksasa yang
    // memaksa Postgres scan lalu buang jutaan baris.
    const parsedPage = Number.parseInt(page, 10);
    const pageNum = Number.isFinite(parsedPage) ? Math.min(Math.max(1, parsedPage), 1000) : 1;
    const perPage = 12;
    const offset = (pageNum - 1) * perPage;
    const sortDir = sort === "oldest" ? sql`ASC` : sql`DESC`;
    const typeFilter =
      type !== "all" ? sql`AND r.target_type = ${type}` : sql``;
    const searchFilter = q.trim()
      ? sql`AND (r.target_value ILIKE ${"%" + q.trim() + "%"} OR r.bank_name ILIKE ${"%" + q.trim() + "%"} OR r.wallet_name ILIKE ${"%" + q.trim() + "%"})`
      : sql``;

    // Dulu: dua subquery berkorelasi (target_name, category) di SELECT list
    // sebuah query GROUP BY -- di-evaluasi per baris hasil. Sekarang: agregasi
    // di CTE `grouped`, ambil satu halaman di `page`, lalu target_name/category
    // di-resolve set-based lewat DISTINCT ON yang di-join hanya ke 12 baris
    // halaman itu. Semantik pemilihan dipertahankan persis:
    //  - target_name : satu target_name dari laporan verified untuk target_value
    //    itu (tanpa ORDER BY tertentu di versi lama -> tetap "salah satu").
    //  - category    : kategori dari laporan TERBARU untuk target_value itu.
    // Keduanya di-key ke target_value saja (bukan grup type+bank), sama seperti
    // subquery lama.
    const rows = await db.execute(sql`
      WITH grouped AS (
        SELECT
          r.target_value                                      AS target_number,
          r.target_type,
          COALESCE(r.bank_name, r.wallet_name)               AS bank_name,
          COUNT(*)::int                                      AS total,
          COUNT(*) FILTER (WHERE r.status = 'verified')::int AS verified_count,
          COUNT(*) FILTER (WHERE r.status = 'pending')::int  AS pending_count,
          MAX(r.created_at)                                  AS latest_at
        FROM reports r
        WHERE 1=1 ${typeFilter} ${searchFilter}
        GROUP BY r.target_value, r.target_type, COALESCE(r.bank_name, r.wallet_name)
      ),
      page AS (
        SELECT * FROM grouped
        ORDER BY latest_at ${sortDir}
        LIMIT ${perPage} OFFSET ${offset}
      ),
      name_pick AS (
        SELECT DISTINCT ON (rr.target_value) rr.target_value, rr.target_name
        FROM reports rr
        JOIN page p ON p.target_number = rr.target_value
        WHERE rr.status = 'verified'
        ORDER BY rr.target_value
      ),
      cat_pick AS (
        SELECT DISTINCT ON (rr.target_value) rr.target_value, rr.category
        FROM reports rr
        JOIN page p ON p.target_number = rr.target_value
        ORDER BY rr.target_value, rr.created_at DESC
      )
      SELECT
        p.target_number, p.target_type, p.bank_name,
        p.total, p.verified_count, p.pending_count, p.latest_at,
        n.target_name,
        c.category
      FROM page p
      LEFT JOIN name_pick n ON n.target_value = p.target_number
      LEFT JOIN cat_pick  c ON c.target_value = p.target_number
      ORDER BY p.latest_at ${sortDir}
    `);

    const [countRow] = await db.execute(sql`
      SELECT COUNT(DISTINCT r.target_value)::int AS total_unique
      FROM reports r WHERE 1=1 ${typeFilter} ${searchFilter}
    `);

    return {
      data: { data: rows, total_unique: (countRow as any).total_unique ?? 0 },
    };
  });

  app.get("/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);
    if (!report) return reply.status(404).send({ error: "Laporan tidak ditemukan." });
    if (report.userId !== req.user!.userId && req.user!.role !== "admin")
      return reply.status(403).send({ error: "Anda tidak memiliki akses ke laporan ini." });
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
      qrisPayload,
    } = req.body as any;

    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid)
      return reply.status(400).send({ error: "Verifikasi keamanan gagal. Coba lagi." });

    // Bukti hanya boleh berupa file yang memang di-upload lewat endpoint upload
    // kita (URL R2 sendiri). URL eksternal ditolak -- lihat isOwnStorageUrl().
    const rawEvidenceUrls: unknown = evidenceUrls;
    const cleanEvidenceUrls: string[] = Array.isArray(rawEvidenceUrls)
      ? rawEvidenceUrls.filter(isOwnStorageUrl)
      : [];
    if (Array.isArray(rawEvidenceUrls) && cleanEvidenceUrls.length !== rawEvidenceUrls.length)
      return reply.status(400).send({ error: "Bukti yang dikirim tidak valid. Coba unggah ulang lampiran Anda." });
    if (cleanEvidenceUrls.length > MAX_FILES_PER_REQUEST)
      return reply.status(400).send({ error: `Maksimal ${MAX_FILES_PER_REQUEST} bukti per laporan.` });

    // suspectPhotoUrl juga dirender di halaman publik -- berlaku aturan sama.
    if (suspectPhotoUrl != null && !isOwnStorageUrl(suspectPhotoUrl))
      return reply.status(400).send({ error: "Foto terduga pelaku tidak valid. Coba unggah ulang." });

    // ── QRIS: server adalah satu-satunya sumber kebenaran ──────────────────
    // targetValue/targetName yang dikirim client (kalau ada) diabaikan total.
    // NMID/nama merchant/kota merchant SELALU berasal dari parseQrisPayload()
    // atas payload EMV mentah -- lihat core/qris.ts untuk alasannya. Foto QRIS
    // asli wajib jadi evidence (tidak ada jalur manual tanpa foto untuk tipe ini).
    let cleanTargetValue: string;
    let resolvedTargetName: string | null;
    let resolvedMerchantCity: string | null = null;

    if (targetType === "qris") {
      if (cleanEvidenceUrls.length === 0)
        return reply.status(400).send({ error: "Foto QRIS asli wajib dilampirkan sebagai bukti." });

      const parsed = parseQrisPayload(qrisPayload);
      if (!parsed.valid)
        return reply.status(400).send({ error: parsed.error ?? "Payload QRIS tidak valid." });

      cleanTargetValue = parsed.nmid!;
      resolvedTargetName = parsed.merchantName!;
      resolvedMerchantCity = parsed.merchantCity!;
    } else {
      // Dicek atas nilai MENTAH sebelum \D di-strip: NMID QRIS ("IDxxxxxxxx")
      // yang dikirim sebagai phone/bank/ewallet = pelapor salah pilih kategori.
      // Tolak dengan arahan spesifik, bukan pesan generik "Format tidak valid".
      if (looksLikeQrisNmid(targetValue))
        return reply.status(400).send({
          error: "Ini sepertinya kode QRIS (NMID). Pilih kategori 'QRIS' dan unggah foto QRIS-nya.",
        });

      cleanTargetValue = typeof targetValue === "string" ? targetValue.replace(/\D/g, "") : "";
      if (!cleanTargetValue)
        return reply.status(400).send({ error: "Nomor tujuan wajib diisi dan hanya boleh berupa angka." });
      resolvedTargetName = targetName ?? null;
    }

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
      evidenceUrls: cleanEvidenceUrls,
    });

    const report = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(reports)
        .values({
          userId: req.user!.userId,
          targetType,
          targetValue: cleanTargetValue,
          targetName: resolvedTargetName,
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
          merchantCity: resolvedMerchantCity,
          suspectPhotoUrl: suspectPhotoUrl ?? null,
          socialMediaAccounts: socialMediaAccounts ?? null,
          linkUrl: linkUrl ?? null,
          reportedTo: reportedTo ?? null,
          status,
        })
        .returning();

      if (cleanEvidenceUrls.length) {
        await tx
          .insert(evidence)
          .values(
            cleanEvidenceUrls.map((url: string) => ({ reportId: inserted.id, url })),
          );
      }

      return inserted;
    });

    // Realtime: selalu emit `submitted`; kalau checkCompleteness() sudah
    // menetapkan `verified` di transaksi yang sama, emit `verified` juga.
    // Counter "LAPORAN" di frontend hanya bereaksi ke `submitted` dan counter
    // "TERVERIFIKASI"/kerugian hanya ke `verified`, jadi satu laporan
    // auto-verified tidak terhitung dobel.
    notifyReportSubmitted(report.targetType).catch((err) =>
      app.log.error({ err }, "realtime: gagal NOTIFY report_submitted"),
    );
    if (report.status === "verified") {
      notifyReportVerified(toLiveReport(report)).catch((err) =>
        app.log.error({ err }, "realtime: gagal NOTIFY report_verified"),
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
    if (!report) return reply.status(404).send({ error: "Laporan tidak ditemukan." });
    if (report.userId !== req.user!.userId)
      return reply.status(403).send({ error: "Anda tidak memiliki akses ke laporan ini." });

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