/**
 * Script migrasi satu-kali: pindahkan semua file dari uploads/ lokal ke Cloudflare R2,
 * lalu update semua referensi URL di database (evidence.url, reports.suspect_photo_url,
 * articles.thumbnail) supaya menunjuk ke R2, bukan path lokal lagi.
 *
 * CARA PAKAI:
 *   1. Jalankan dulu dalam mode DRY RUN (default) untuk lihat apa yang akan terjadi,
 *      TANPA benar-benar upload atau ubah database:
 *        npx tsx scripts/migrate-to-r2.ts
 *
 *   2. Kalau hasil dry run terlihat benar, jalankan sungguhan dengan flag --execute:
 *        npx tsx scripts/migrate-to-r2.ts --execute
 *
 * PENTING: backup database dulu sebelum menjalankan dengan --execute.
 * Script ini TIDAK menghapus file lokal di uploads/ — itu langkah terpisah,
 * dilakukan manual setelah dipastikan semua foto tampil normal dari R2.
 */

import { configDotenv } from "dotenv";
configDotenv();

import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../src/core/db.js";
import { evidence, reports, articles } from "../src/core/schema.js";
import { eq, isNotNull, like } from "drizzle-orm";

const EXECUTE = process.argv.includes("--execute");
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function contentTypeFromExt(ext: string): string {
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

interface MigrationResult {
  oldUrl: string;
  newUrl: string;
  key: string;
}

async function uploadFileToR2(localPath: string, key: string): Promise<void> {
  const buffer = await fs.readFile(localPath);
  const ext = path.extname(localPath);
  if (EXECUTE) {
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentTypeFromExt(ext),
      })
    );
  }
}

/**
 * Konversi path/URL lama (misal "/uploads/reports/abc.jpg") jadi R2 key ("reports/abc.jpg")
 * dan path lokal absolut untuk dibaca dari disk.
 */
function resolveOldPath(oldUrl: string): { localPath: string; key: string } | null {
  if (!oldUrl.startsWith("/uploads/")) return null;
  const relative = oldUrl.slice("/uploads/".length); // contoh: "reports/abc.jpg"
  return {
    localPath: path.join(UPLOAD_DIR, relative),
    key: relative,
  };
}

async function migrateUrl(oldUrl: string | null): Promise<MigrationResult | null> {
  if (!oldUrl) return null;
  if (oldUrl.startsWith(R2_PUBLIC_URL)) return null; // sudah di-migrasi sebelumnya, skip

  const resolved = resolveOldPath(oldUrl);
  if (!resolved) {
    console.warn(`  [SKIP] URL tidak dikenali formatnya: ${oldUrl}`);
    return null;
  }

  const { localPath, key } = resolved;

  try {
    await fs.access(localPath);
  } catch {
    console.warn(`  [SKIP] File tidak ditemukan di disk: ${localPath}`);
    return null;
  }

  await uploadFileToR2(localPath, key);
  const newUrl = `${R2_PUBLIC_URL}/${key}`;
  return { oldUrl, newUrl, key };
}

async function main() {
  console.log(`\n=== Migrasi ke Cloudflare R2 ${EXECUTE ? "(EXECUTE MODE)" : "(DRY RUN)"} ===\n`);
  if (!EXECUTE) {
    console.log("Mode DRY RUN — tidak ada file yang di-upload atau database yang diubah.");
    console.log("Jalankan ulang dengan --execute setelah memastikan hasil di bawah sudah benar.\n");
  }

  let uploaded = 0;
  let skipped = 0;
  let dbUpdated = 0;

  // ── 1. Evidence laporan ──────────────────────────────────────────────────
  console.log("--- Evidence (bukti laporan) ---");
  const allEvidence = await db.select().from(evidence);
  for (const e of allEvidence) {
    console.log(`Evidence ${e.id}: ${e.url}`);
    const result = await migrateUrl(e.url);
    if (result) {
      console.log(`  -> ${result.newUrl}`);
      uploaded++;
      if (EXECUTE) {
        await db.update(evidence).set({ url: result.newUrl }).where(eq(evidence.id, e.id));
        dbUpdated++;
      }
    } else {
      skipped++;
    }
  }

  // ── 2. Foto tersangka di reports ─────────────────────────────────────────
  console.log("\n--- Foto tersangka (reports.suspect_photo_url) ---");
  const reportsWithPhoto = await db
    .select()
    .from(reports)
    .where(isNotNull(reports.suspectPhotoUrl));
  for (const r of reportsWithPhoto) {
    console.log(`Report ${r.id}: ${r.suspectPhotoUrl}`);
    const result = await migrateUrl(r.suspectPhotoUrl);
    if (result) {
      console.log(`  -> ${result.newUrl}`);
      uploaded++;
      if (EXECUTE) {
        await db.update(reports).set({ suspectPhotoUrl: result.newUrl }).where(eq(reports.id, r.id));
        dbUpdated++;
      }
    } else {
      skipped++;
    }
  }

  // ── 3. Thumbnail artikel ──────────────────────────────────────────────────
  console.log("\n--- Thumbnail artikel ---");
  const articlesWithThumbnail = await db
    .select()
    .from(articles)
    .where(isNotNull(articles.thumbnail));
  for (const a of articlesWithThumbnail) {
    console.log(`Artikel ${a.id} (${a.title}): ${a.thumbnail}`);
    const result = await migrateUrl(a.thumbnail);
    if (result) {
      console.log(`  -> ${result.newUrl}`);
      uploaded++;
      if (EXECUTE) {
        await db.update(articles).set({ thumbnail: result.newUrl }).where(eq(articles.id, a.id));
        dbUpdated++;
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n=== Ringkasan ===`);
  console.log(`File berhasil di-${EXECUTE ? "upload" : "cek (dry run)"}: ${uploaded}`);
  console.log(`File di-skip (sudah R2 / tidak ditemukan / format asing): ${skipped}`);
  if (EXECUTE) {
    console.log(`Baris database ter-update: ${dbUpdated}`);
    console.log(`\nSelesai. Cek beberapa foto secara manual di browser untuk memastikan semua tampil normal`);
    console.log(`sebelum menghapus folder uploads/ lokal.`);
  } else {
    console.log(`\nIni baru DRY RUN. Jalankan lagi dengan --execute untuk benar-benar migrasi.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Migrasi gagal:", err);
  process.exit(1);
});