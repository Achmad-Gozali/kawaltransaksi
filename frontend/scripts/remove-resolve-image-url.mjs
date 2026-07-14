/**
 * Script sekali-pakai untuk MENGHAPUS helper resolveImageUrl/resolveEvidenceUrl
 * dan mengganti semua pemanggilannya menjadi field mentah langsung.
 *
 * Konteks: sebelumnya kita menambahkan resolveImageUrl() sebagai jaring pengaman
 * untuk mendukung path relatif lama ("/uploads/...") berdampingan dengan URL R2
 * baru. Sekarang semua data di database sudah 100% migrasi ke R2 (dikonfirmasi
 * lewat query database), jadi jaring pengaman itu tidak diperlukan lagi — field
 * seperti a.thumbnail, suspectPhoto, url sekarang SELALU berisi URL R2 lengkap.
 *
 * CARA PAKAI (dari folder frontend/):
 *   node scripts/remove-resolve-image-url.mjs            -> dry run
 *   node scripts/remove-resolve-image-url.mjs --execute   -> tulis perubahan
 */

import fs from 'fs';
import path from 'path';

const EXECUTE = process.argv.includes('--execute');

// Regex untuk match seluruh function declaration resolveImageUrl / resolveEvidenceUrl,
// termasuk yang punya type annotation TypeScript maupun yang polos (parameter tanpa tipe).
// Non-greedy sampai closing brace pertama di kolom 0 (function top-level, bukan nested).
const HELPER_FN_REGEX = /\/\/[^\n]*\n(?:\/\/[^\n]*\n)*function resolve(?:ImageUrl|EvidenceUrl)\([^)]*\)[^{]*\{[\s\S]*?\n\}\n\n?/g;

const targets = [
  {
    file: 'app/(public)/artikel/page.tsx',
    callReplacements: [
      { from: /resolveImageUrl\(a\.thumbnail\)/g, to: 'a.thumbnail' },
    ],
  },
  {
    file: 'app/(public)/artikel/[slug]/page.tsx',
    callReplacements: [
      { from: /resolveImageUrl\(article\.thumbnail\)/g, to: 'article.thumbnail' },
      { from: /resolveImageUrl\(a\.thumbnail\)/g, to: 'a.thumbnail' },
    ],
  },
  {
    file: 'features/admin/tabs/ArtikelTab.tsx',
    callReplacements: [
      { from: /resolveImageUrl\(a\.thumbnail\)\s*\?\?\s*undefined/g, to: 'a.thumbnail ?? undefined' },
      { from: /resolveImageUrl\(a\.thumbnail\)/g, to: 'a.thumbnail' },
      { from: /resolveImageUrl\(data\.data\.url\)/g, to: 'data.data.url' },
    ],
  },
  {
    file: 'features/admin/tabs/LaporanTab.tsx',
    callReplacements: [
      { from: /resolveImageUrl\(suspectPhoto\)\s*\?\?\s*''/g, to: "suspectPhoto ?? ''" },
      { from: /resolveImageUrl\(suspectPhoto\)/g, to: 'suspectPhoto' },
      { from: /resolveImageUrl\(url\)\s*\?\?\s*'#'/g, to: "url ?? '#'" },
      { from: /resolveImageUrl\(url\)\s*\?\?\s*''/g, to: "url ?? ''" },
      { from: /resolveImageUrl\(url\)/g, to: 'url' },
    ],
  },
  {
    file: 'features/check/components/NumberCard.tsx',
    callReplacements: [
      { from: /resolveEvidenceUrl\(suspectPhotoUrl\)\s*\?\?\s*''/g, to: "suspectPhotoUrl ?? ''" },
      { from: /resolveEvidenceUrl\(suspectPhotoUrl\)/g, to: 'suspectPhotoUrl' },
    ],
    removeSecondHelper: true, // file ini punya resolveImageUrl DAN resolveEvidenceUrl
  },
  {
    file: 'features/check/components/ReportList.tsx',
    callReplacements: [
      { from: /resolveEvidenceUrl\(url\)\s*\?\?\s*''/g, to: "url ?? ''" },
      { from: /resolveEvidenceUrl\(url\)/g, to: 'url' },
    ],
    removeSecondHelper: true,
  },
];

function processFile(target) {
  const filePath = path.resolve(target.file);
  if (!fs.existsSync(filePath)) {
    console.log(`  [SKIP] File tidak ditemukan: ${target.file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  let callsChanged = 0;
  for (const rep of target.callReplacements) {
    const matches = content.match(rep.from);
    if (matches) {
      callsChanged += matches.length;
      content = content.replace(rep.from, rep.to);
    }
  }

  if (callsChanged === 0) {
    console.log(`  [SKIP] Tidak ada pemanggilan cocok di: ${target.file}`);
    return;
  }

  console.log(`  [${EXECUTE ? 'FIXED' : 'WOULD FIX'}] ${target.file} — ${callsChanged} pemanggilan diganti. ` +
    `INGAT: hapus definisi function resolveImageUrl/resolveEvidenceUrl manual di file ini (sekarang sudah tidak dipakai).`);

  if (EXECUTE && content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

console.log(`\n=== Remove resolveImageUrl helpers (${EXECUTE ? 'EXECUTE' : 'DRY RUN'}) ===\n`);
for (const target of targets) {
  processFile(target);
}
console.log(`\n${EXECUTE ? 'Selesai. Jalankan npm run build untuk verifikasi.' : 'Ini dry run. Jalankan dengan --execute untuk menulis perubahan.'}\n`);
