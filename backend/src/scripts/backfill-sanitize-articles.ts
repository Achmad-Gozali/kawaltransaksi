/**
 * Script satu-kali (aman dijalankan ulang): bersihkan artikel LAMA yang
 * tersimpan di database SEBELUM sanitasi diterapkan di jalur tulis.
 *
 * Latar belakang:
 *   Endpoint POST/PATCH /api/admin/articles sekarang sudah menyanitasi
 *   title/excerpt/content lewat core/sanitize.ts. Tapi itu hanya berlaku
 *   untuk tulisan BARU -- baris yang sudah terlanjur tersimpan tetap mentah.
 *   Konten artikel dirender di frontend dengan dangerouslySetInnerHTML
 *   (app/(public)/artikel/[slug]/page.tsx), jadi baris lama yang mengandung
 *   tag script, atribut handler "on...", atau URL berskema javascript: masih
 *   bisa jadi stored XSS bagi pengunjung.
 *
 * KENAPA FILE INI ADA DI src/scripts/ DAN BUKAN scripts/:
 *   Image produksi backend hanya membawa hasil build (dist/) -- lihat
 *   backend/Dockerfile: yang di-COPY ke stage runtime adalah /app/dist,
 *   BUKAN /app/src. Script yang tinggal di scripts/ dan meng-import
 *   "../src/core/db.js" karena itu TIDAK bisa dijalankan di container
 *   produksi (module not found), kecuali src/ ikut di-mount -- dan
 *   mem-mount source ke container produksi hanya demi script sekali pakai
 *   bukan praktik yang baik.
 *
 *   Dengan menaruhnya di src/scripts/, tsc ikut meng-compile-nya
 *   (tsconfig: rootDir "./src", include "src/**\/*") menjadi
 *   dist/scripts/backfill-sanitize-articles.js. Semua import-nya ikut
 *   ter-resolve di dalam dist/, sehingga bisa dijalankan dengan `node` biasa
 *   di container produksi -- tanpa mount, tanpa butuh tsx di runtime.
 *
 *   CATATAN: file ini TIDAK pernah di-import oleh server (src/index.ts),
 *   jadi keberadaannya di dist tidak menambah apa pun ke jalur runtime API.
 *   Ia hanya ikut terbawa sebagai file yang siap dieksekusi manual.
 *
 * CARA PAKAI DI PRODUKSI (di dalam container, tanpa mount):
 *   1. DRY RUN dulu (default -- TIDAK mengubah database sama sekali):
 *        docker compose exec backend node dist/scripts/backfill-sanitize-articles.js
 *
 *   2. Kalau laporannya terlihat benar, jalankan sungguhan:
 *        docker compose exec backend node dist/scripts/backfill-sanitize-articles.js --execute
 *
 *   DATABASE_URL di container sudah di-set lewat docker-compose.yml, jadi
 *   tidak perlu --env-file.
 *
 * CARA PAKAI DI LOKAL:
 *   npx tsx --env-file=.env src/scripts/backfill-sanitize-articles.ts
 *   npx tsx --env-file=.env src/scripts/backfill-sanitize-articles.ts --execute
 *
 *   (--env-file wajib di lokal: import "./core/db.js" dievaluasi sebelum
 *   configDotenv() sempat jalan -- soal urutan evaluasi modul ES.)
 *
 *   Tambahkan --verbose untuk melihat diff lengkap tiap artikel (default
 *   hanya menampilkan beberapa contoh yang dipotong).
 *
 * SIFAT SCRIPT INI:
 *   - IDEMPOTENT. sanitize(sanitize(x)) === sanitize(x) sudah diverifikasi,
 *     jadi menjalankan ulang setelah sukses menghasilkan 0 perubahan.
 *   - Hanya meng-UPDATE baris yang isinya benar-benar berubah.
 *   - TIDAK menyentuh updated_at. Disengaja: ini pembersihan teknis, bukan
 *     penyuntingan konten. Kalau updated_at ikut berubah, seluruh artikel
 *     akan terlihat "baru diperbarui" di /articles/sitemap dan memberi sinyal
 *     palsu ke Google bahwa semua artikel berubah.
 *   - TIDAK menghapus baris apa pun.
 *   - Seluruh update dibungkus SATU transaksi: kalau ada satu yang gagal,
 *     semuanya dibatalkan.
 *
 * PENTING: backup database dulu sebelum menjalankan dengan --execute.
 */

import { configDotenv } from "dotenv";
configDotenv();

import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { db } from "../core/db.js";
import { articles } from "../core/schema.js";
import { sanitizeArticleHtml, sanitizePlainText } from "../core/sanitize.js";

const EXECUTE = process.argv.includes("--execute");
const VERBOSE = process.argv.includes("--verbose");

/** Pola yang menandakan perubahan ini benar-benar soal keamanan, bukan
 *  sekadar normalisasi entitas HTML (&quot; -> ", &eacute; -> e). */
const DANGEROUS_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "<script>",        re: /<\s*script\b/i },
  { label: "<iframe>",        re: /<\s*iframe\b/i },
  { label: "<object>/<embed>",re: /<\s*(object|embed)\b/i },
  { label: "<style>",         re: /<\s*style\b/i },
  { label: "handler on*=",    re: /\son[a-z]+\s*=/i },
  { label: "javascript: URL", re: /javascript\s*:/i },
  { label: "data:text/html",  re: /data\s*:\s*text\/html/i },
  { label: "<form>/<input>",  re: /<\s*(form|input|button)\b/i },
];

export function detectDangerous(html: string): string[] {
  return DANGEROUS_PATTERNS.filter((p) => p.re.test(html)).map((p) => p.label);
}

export type ArticleRow = {
  id: string; slug: string;
  title: string; excerpt: string | null; content: string;
};

export type Change = {
  id: string; slug: string;
  fields: string[];
  dangerous: string[];
  before: string; after: string;
  next: { title: string; excerpt: string | null; content: string };
};

/**
 * Bagian murni (tanpa database) dari backfill: hitung baris mana yang berubah
 * dan bagaimana bentuknya. Dipisah supaya bisa diuji tanpa menyentuh database.
 */
export function computeChanges(rows: ArticleRow[]): Change[] {
  const changes: Change[] = [];

  for (const r of rows) {
    const nextTitle   = sanitizePlainText(r.title);
    const nextExcerpt = r.excerpt != null ? sanitizePlainText(r.excerpt) : null;
    const nextContent = sanitizeArticleHtml(r.content);

    const fields: string[] = [];
    if (nextTitle !== r.title)     fields.push("title");
    if (nextExcerpt !== r.excerpt) fields.push("excerpt");
    if (nextContent !== r.content) fields.push("content");
    if (fields.length === 0) continue;

    changes.push({
      id: r.id,
      slug: r.slug,
      fields,
      dangerous: detectDangerous(`${r.title} ${r.excerpt ?? ""} ${r.content}`),
      before: r.content,
      after: nextContent,
      next: { title: nextTitle, excerpt: nextExcerpt, content: nextContent },
    });
  }

  return changes;
}

function preview(s: string, max = 160): string {
  const oneLine = s.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? oneLine.slice(0, max) + "..." : oneLine;
}

async function main() {
  console.log("=".repeat(72));
  console.log(EXECUTE
    ? "MODE: --execute  (database AKAN diubah)"
    : "MODE: DRY RUN    (tidak ada perubahan database)");
  console.log("=".repeat(72) + "\n");

  const rows = await db.select({
    id:      articles.id,
    slug:    articles.slug,
    title:   articles.title,
    excerpt: articles.excerpt,
    content: articles.content,
  }).from(articles);

  console.log(`Total artikel di database: ${rows.length}\n`);

  const changes = computeChanges(rows);

  const risky    = changes.filter((c) => c.dangerous.length > 0);
  const cosmetic = changes.filter((c) => c.dangerous.length === 0);

  console.log(`Artikel yang akan berubah : ${changes.length} / ${rows.length}`);
  console.log(`  - mengandung pola bahaya: ${risky.length}  <-- ini alasan utama backfill`);
  console.log(`  - hanya normalisasi      : ${cosmetic.length}  (mis. &quot; -> ", entitas dirapikan; tampilan sama)\n`);

  if (risky.length > 0) {
    console.log("-".repeat(72));
    console.log("ARTIKEL DENGAN POLA BERBAHAYA");
    console.log("-".repeat(72));
    for (const c of risky) {
      console.log(`\n[${c.slug}] (${c.id})`);
      console.log(`  field berubah : ${c.fields.join(", ")}`);
      console.log(`  terdeteksi    : ${c.dangerous.join(", ")}`);
      console.log(`  SEBELUM       : ${preview(c.before, VERBOSE ? 100000 : 200)}`);
      console.log(`  SESUDAH       : ${preview(c.after,  VERBOSE ? 100000 : 200)}`);
    }
    console.log();
  }

  if (cosmetic.length > 0) {
    console.log("-".repeat(72));
    console.log(`PERUBAHAN KOSMETIK (${cosmetic.length}) -- contoh ${VERBOSE ? "semua" : "maks 3"}`);
    console.log("-".repeat(72));
    for (const c of (VERBOSE ? cosmetic : cosmetic.slice(0, 3))) {
      console.log(`\n[${c.slug}] field: ${c.fields.join(", ")}`);
      console.log(`  SEBELUM: ${preview(c.before)}`);
      console.log(`  SESUDAH: ${preview(c.after)}`);
    }
    console.log();
  }

  if (changes.length === 0) {
    console.log("Tidak ada yang perlu diubah. Semua artikel sudah bersih.\n");
    return;
  }

  if (!EXECUTE) {
    console.log("=".repeat(72));
    console.log("DRY RUN selesai. TIDAK ada perubahan yang ditulis ke database.");
    console.log("Jalankan ulang dengan --execute untuk menerapkan.");
    console.log("=".repeat(72));
    return;
  }

  // Satu transaksi: kalau ada satu update gagal, semuanya dibatalkan.
  // updated_at sengaja TIDAK diikutkan (lihat catatan di header file).
  let updated = 0;
  await db.transaction(async (tx) => {
    for (const c of changes) {
      await tx.update(articles).set({
        title:   c.next.title,
        excerpt: c.next.excerpt,
        content: c.next.content,
      }).where(eq(articles.id, c.id));
      updated++;
    }
  });

  console.log("=".repeat(72));
  console.log(`SELESAI. ${updated} artikel diperbarui.`);
  console.log("Jalankan ulang script ini (tanpa --execute) untuk memverifikasi:");
  console.log("hasilnya harus 0 artikel yang akan berubah.");
  console.log("=".repeat(72));
}

// Hanya jalan kalau file ini dieksekusi langsung, bukan saat di-import
// (mis. oleh test). Tanpa penjaga ini, sekadar meng-import fungsi murni di
// atas akan ikut menjalankan backfill -- termasuk koneksi database.
//
// pathToFileURL() dipakai (bukan merangkai string "file://" sendiri) supaya
// benar di semua platform: path Windows seperti C:\a\b harus jadi
// file:///C:/a/b, sedangkan perangkaian manual menghasilkan file://c/a/b
// yang tidak pernah cocok sehingga script diam-diam tidak jalan.
const entry = process.argv[1];
const isDirectRun = entry !== undefined && import.meta.url === pathToFileURL(entry).href;

if (isDirectRun) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("\nGAGAL:", err);
      process.exit(1);
    });
}
