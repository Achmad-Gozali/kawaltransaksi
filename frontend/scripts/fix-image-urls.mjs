/**
 * Script sekali-pakai untuk memperbaiki bug URL gambar pasca migrasi ke Cloudflare R2.
 *
 * Root cause: kode lama menggabung `${API_URL}${path}` dengan asumsi `path` selalu
 * berupa path relatif (misal "/uploads/reports/xxx.jpg"). Setelah migrasi R2,
 * kolom-kolom itu (evidence.url, suspectPhotoUrl, thumbnail) sekarang berisi URL
 * lengkap (misal "https://img.kawaltransaksi.com/reports/xxx.jpg"), sehingga hasil
 * gabungan jadi rusak: "https://api.kawaltransaksi.comhttps://img.kawaltransaksi.com/...".
 *
 * Script ini menambahkan helper resolveImageUrl() ke tiap file (kalau belum ada)
 * dan mengganti semua pemakaian `${API_URL}${x}` / `${process.env.NEXT_PUBLIC_API_URL}${x}`
 * menjadi `resolveImageUrl(x)`.
 *
 * CARA PAKAI (dari folder frontend/):
 *   node scripts/fix-image-urls.mjs           -> dry run, tampilkan apa yang akan diubah
 *   node scripts/fix-image-urls.mjs --execute  -> benar-benar tulis perubahan ke file
 */

import fs from 'fs';
import path from 'path';

const EXECUTE = process.argv.includes('--execute');

const HELPER_CODE = `
// Sebagian data lama (path relatif "/uploads/...") berdampingan dengan data baru
// (URL R2 lengkap "https://img.kawaltransaksi.com/...") pasca migrasi storage.
// Fungsi ini menangani keduanya supaya gambar tetap tampil benar untuk data manapun.
function resolveImageUrl(p) {
  if (!p) return null;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  return \`\${API_URL}\${p}\`;
}
`.trim();

const targets = [
  {
    file: 'features/admin/tabs/ArtikelTab.tsx',
    replacements: [
      { from: /\$\{API_URL\}\$\{a\.thumbnail\}/g, to: 'resolveImageUrl(a.thumbnail)', unwrapTemplateLiteral: true },
      { from: /\$\{API_URL\}\$\{data\.data\.url\}/g, to: 'resolveImageUrl(data.data.url)', unwrapTemplateLiteral: true },
    ],
  },
  {
    file: 'features/admin/tabs/LaporanTab.tsx',
    replacements: [
      { from: /\$\{API_URL\}\$\{suspectPhoto\}/g, to: 'resolveImageUrl(suspectPhoto)', unwrapTemplateLiteral: true },
      { from: /\$\{API_URL\}\$\{url\}/g, to: 'resolveImageUrl(url)', unwrapTemplateLiteral: true },
    ],
  },
  {
    file: 'features/check/components/NumberCard.tsx',
    replacements: [
      { from: /return `\$\{process\.env\.NEXT_PUBLIC_API_URL\}\$\{url\}`;/g, to: 'return resolveImageUrl(url);', isReturnStatement: true },
    ],
    helperUsesProcessEnv: true,
  },
  {
    file: 'features/check/components/ReportList.tsx',
    replacements: [
      { from: /return `\$\{process\.env\.NEXT_PUBLIC_API_URL\}\$\{url\}`;/g, to: 'return resolveImageUrl(url);', isReturnStatement: true },
    ],
    helperUsesProcessEnv: true,
  },
];

function buildHelper(usesProcessEnv) {
  if (!usesProcessEnv) return HELPER_CODE;
  return HELPER_CODE.replace('${API_URL}', '${process.env.NEXT_PUBLIC_API_URL}');
}

function processFile(target) {
  const filePath = path.resolve(target.file);
  if (!fs.existsSync(filePath)) {
    console.log(`  [SKIP] File tidak ditemukan: ${target.file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  let changedCount = 0;

  for (const rep of target.replacements) {
    const matches = content.match(rep.from);
    if (!matches) continue;
    changedCount += matches.length;

    if (rep.unwrapTemplateLiteral) {
      // Ganti dalam konteks template literal: src={`${API_URL}${x}`} -> src={resolveImageUrl(x)}
      // Cari pola pembungkus `...` di sekitar match dan buang backtick-nya kalau match adalah isi penuh literal.
      content = content.replace(
        new RegExp('`' + rep.from.source + '`', 'g'),
        rep.to
      );
      // fallback: kalau tidak ada backtick pembungkus persis (jarang), replace polos
      content = content.replace(rep.from, rep.to);
    } else {
      content = content.replace(rep.from, rep.to);
    }
  }

  if (changedCount === 0) {
    console.log(`  [SKIP] Tidak ada pola cocok di: ${target.file}`);
    return;
  }

  const hasHelper = content.includes('function resolveImageUrl(');
  if (!hasHelper) {
    const helper = buildHelper(target.helperUsesProcessEnv);
    // Sisipkan helper setelah baris import terakhir
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) lastImportIdx = i;
    }
    lines.splice(lastImportIdx + 1, 0, '', helper);
    content = lines.join('\n');
  }

  console.log(`  [${EXECUTE ? 'FIXED' : 'WOULD FIX'}] ${target.file} — ${changedCount} pola diganti, helper ${hasHelper ? 'sudah ada' : 'ditambahkan'}`);

  if (EXECUTE && content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

console.log(`\n=== Fix Image URLs (${EXECUTE ? 'EXECUTE' : 'DRY RUN'}) ===\n`);
for (const target of targets) {
  processFile(target);
}
console.log(`\n${EXECUTE ? 'Selesai. Cek hasil dengan npm run build.' : 'Ini dry run. Jalankan dengan --execute untuk menulis perubahan.'}\n`);
