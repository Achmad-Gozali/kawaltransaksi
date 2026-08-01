// @ts-nocheck
// Type-checking di-skip untuk file ini karena import mengarah ke folder
// dist/ (hasil build), yang tidak selalu tersedia/ter-update di lokal saat
// editor membuka file ini. Ini tidak mempengaruhi eksekusi runtime -- tsx
// tetap menjalankan file ini dengan benar; ini murni menghilangkan noise
// visual di editor.

/**
 * Script cron mingguan: kirim ringkasan laporan terverifikasi 7 hari
 * terakhir ke semua user terdaftar.
 *
 * Dijadwalkan jalan tiap Senin jam 08:00 WIB (lihat crontab di bawah).
 * Kalau tidak ada laporan verified dalam 7 hari terakhir, script berhenti
 * tanpa mengirim email apapun (skip, bukan kirim email kosong).
 *
 * Batasan Resend (Free plan) yang diperhitungkan di sini:
 *   - Batas harian: 100 email/hari  -> jumlah user sekarang < 100, aman
 *     dikirim sekaligus dalam 1 hari. Kalau nanti user > 100, script ini
 *     PERLU direvisi untuk menyebar pengiriman ke beberapa hari.
 *   - Rate limit: 10 request/detik -> diberi jeda 150ms antar pengiriman.
 *
 * Cara jalan manual (testing) di lokal (di luar container docker):
 *   cd backend && npx tsx --env-file=.env scripts/weekly-digest.ts
 * (--env-file wajib disertakan kalau dijalankan di luar container -- di dalam
 * container docker, env var sudah ter-set duluan oleh docker-compose, jadi
 * cukup seperti contoh crontab di bawah, tanpa perlu --env-file.)
 *
 * Contoh baris crontab (jalan tiap Senin jam 08:00 WIB):
 *   0 8 * * 1 cd /root/kawaltransaksi/backend && /usr/bin/docker compose exec -T backend npx tsx scripts/weekly-digest.ts >> /root/kawaltransaksi/logs/weekly-digest.log 2>&1
 */

import { db } from "../dist/core/db.js";
import { reports, users } from "../dist/core/schema.js";
import { and, eq, gte } from "drizzle-orm";
import { sendWeeklyDigestEmail, type WeeklyDigestCategoryCount } from "../dist/core/mailer.js";

const SEND_DELAY_MS = 150; // jeda antar email, aman di bawah rate limit 10/detik Resend

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`=== Weekly digest dimulai: ${new Date().toISOString()} ===`);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. Ambil semua laporan verified dalam 7 hari terakhir
  const recentReports = await db
    .select({ targetType: reports.targetType })
    .from(reports)
    .where(and(
      eq(reports.status, "verified"),
      gte(reports.createdAt, sevenDaysAgo),
    ));

  const totalReports = recentReports.length;

  if (totalReports === 0) {
    console.log("Tidak ada laporan verified baru dalam 7 hari terakhir. Skip, tidak ada email dikirim.");
    console.log(`=== Weekly digest selesai: ${new Date().toISOString()} ===`);
    return;
  }

  // 2. Hitung breakdown per kategori target
  const categoryCounts: WeeklyDigestCategoryCount = {
    phone: 0,
    bank_account: 0,
    ewallet: 0,
  };
  for (const report of recentReports) {
    categoryCounts[report.targetType as keyof WeeklyDigestCategoryCount]++;
  }

  console.log(`Total laporan verified minggu ini: ${totalReports}`);
  console.log("Breakdown:", categoryCounts);

  // 3. Ambil semua user terdaftar
  const allUsers = await db
    .select({ email: users.email, name: users.name })
    .from(users);

  console.log(`Mengirim ke ${allUsers.length} user...`);

  let sentCount = 0;
  let failedCount = 0;

  for (const user of allUsers) {
    try {
      await sendWeeklyDigestEmail(user.email, user.name, totalReports, categoryCounts);
      sentCount++;
    } catch (err) {
      failedCount++;
      console.error(`Gagal mengirim ke ${user.email}:`, err instanceof Error ? err.message : err);
    }
    // Jeda kecil antar pengiriman agar tidak menabrak rate limit Resend.
    await sleep(SEND_DELAY_MS);
  }

  console.log(`Selesai. Terkirim: ${sentCount}, Gagal: ${failedCount}`);
  console.log(`=== Weekly digest selesai: ${new Date().toISOString()} ===`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Weekly digest gagal total:", err);
    process.exit(1);
  });