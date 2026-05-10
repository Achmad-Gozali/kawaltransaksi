import { Hono } from 'hono';
import { createClient } from "@supabase/supabase-js";
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, summary, total_reports, total_loss, top_category, published_at, cover_image, status")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);
  if (error) return c.json({ success: false, message: "Gagal mengambil artikel." }, 500);
  return c.json({ success: true, data });
});

app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error || !data) return c.json({ success: false, message: "Artikel tidak ditemukan." }, 404);
  return c.json({ success: true, data });
});

export default app;

const EDUCATION_THEMES: Record<string, string[]> = {
  "Jual Beli Online": ["ciri-ciri penjual palsu di marketplace", "cara aman belanja online", "modus penipuan COD yang marak"],
  "Phishing / Soceng": ["cara mengenali link phishing", "modus social engineering terbaru", "tips melindungi akun dari phishing"],
  "Investasi Bodong": ["ciri-ciri investasi bodong", "cara menghindari money game", "tips sebelum berinvestasi online"],
  "Lowongan Kerja Palsu": ["cara mengenali lowongan kerja palsu", "modus penipuan rekrutmen online", "tips aman mencari kerja online"],
  "Penipuan Percintaan": ["modus romance scam yang marak", "cara mengenali akun palsu di media sosial", "tips aman berkenalan online"],
  "Pinjaman Online": ["ciri-ciri pinjol ilegal", "cara melaporkan pinjol ilegal", "tips aman meminjam uang online"],
  "default": ["tips aman bertransaksi online", "cara melindungi data pribadi di internet", "modus penipuan online yang perlu diwaspadai"],
};

function getEducationAngle(topCategory: string | null, topPlatform: string | null): string {
  const themes = topCategory && EDUCATION_THEMES[topCategory]
    ? EDUCATION_THEMES[topCategory]
    : EDUCATION_THEMES["default"];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  const platformContext = topPlatform ? ` khususnya yang terjadi di ${topPlatform}` : '';
  return `${randomTheme}${platformContext}`;
}

export async function generateWeeklyArticle(env: Env): Promise<void> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 7);

  const { data: reports } = await supabase
    .from("reports")
    .select("category, platform, bank_name, target_type, loss_amount, status, created_at")
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString())
    .in("status", ["verified", "pending"]);

  if (!reports || reports.length === 0) {
    console.log("[CRON] Tidak ada laporan minggu ini, skip generate artikel.");
    return;
  }

  const totalReports = reports.length;
  const totalLoss = reports.reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0);

  const categoryCount: Record<string, number> = {};
  const platformCount: Record<string, number> = {};
  const bankCount: Record<string, number> = {};

  reports.forEach((r) => {
    if (r.category) categoryCount[r.category] = (categoryCount[r.category] ?? 0) + 1;
    if (r.platform) platformCount[r.platform] = (platformCount[r.platform] ?? 0) + 1;
    if (r.bank_name) bankCount[r.bank_name] = (bankCount[r.bank_name] ?? 0) + 1;
  });

  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
  const topPlatform = Object.entries(platformCount).sort((a, b) => b[1] - a[1])[0];
  const topBank = Object.entries(bankCount).sort((a, b) => b[1] - a[1])[0];

  const categoryList = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).map(([name, count]) => `- ${name}: ${count} laporan`).join("\n");
  const platformList = Object.entries(platformCount).sort((a, b) => b[1] - a[1]).map(([name, count]) => `- ${name}: ${count} laporan`).join("\n");
  const bankList = Object.entries(bankCount).sort((a, b) => b[1] - a[1]).map(([name, count]) => `- ${name}: ${count} rekening`).join("\n");

  const totalLossFormatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalLoss);
  const weekStr = `${periodStart.toLocaleDateString("id-ID", { day: "numeric", month: "long" })} – ${periodEnd.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;

  // ── Generate artikel laporan mingguan ─────────────────────────────────────
  const promptLaporan = `Kamu adalah analis keamanan digital dari platform KawalTransaksi, platform komunitas anti-penipuan Indonesia.

Berikut data laporan penipuan yang masuk minggu ${weekStr}:
Total laporan: ${totalReports}
Total kerugian: ${totalLossFormatted}

Kategori penipuan:
${categoryList || "- Tidak ada data"}

Platform yang digunakan penipu:
${platformList || "- Tidak ada data"}

Bank/e-wallet yang digunakan penipu:
${bankList || "- Tidak ada data"}

Tulis artikel analisis pola penipuan minggu ini dalam bahasa Indonesia yang mudah dipahami masyarakat umum.

Format artikel dalam Markdown:
## Ringkasan Minggu Ini
(2-3 kalimat ringkasan situasi minggu ini)

## Modus yang Paling Marak
(jelaskan pola yang ditemukan berdasarkan data, gunakan **bold** untuk kata kunci penting)

## Platform yang Digunakan Penipu
(analisis kenapa platform ini dipilih penipu)

## Tips Waspada
(3-4 tips spesifik, gunakan format list dengan -)

## Penutup
(ajakan untuk selalu cek nomor sebelum transaksi)

Panjang artikel: 400-600 kata. Gunakan bahasa informatif tapi mudah dipahami.`;

  const groqResLaporan = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: promptLaporan }], max_tokens: 1500, temperature: 0.7 }),
  });

  if (groqResLaporan.ok) {
    const groqData = (await groqResLaporan.json()) as any;
    const content = groqData.choices?.[0]?.message?.content ?? "";
    if (content) {
      const startDay = periodStart.getDate();
      const endDay = periodEnd.getDate();
      const endMonthYear = periodEnd.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      const startMonth = periodStart.toLocaleDateString("id-ID", { month: "long" });
      const isSameMonth = periodStart.getMonth() === periodEnd.getMonth();
      const startLabel = isSameMonth ? `${startDay}` : `${startDay} ${startMonth}`;
      const title = `Laporan Penipuan ${startLabel}–${endDay} ${endMonthYear}`;
      const endMonthSlug = periodEnd.toLocaleDateString("id-ID", { month: "long" }).toLowerCase().replace(/ /g, "-");
      const slug = `laporan-${startDay}-${endDay}-${endMonthSlug}-${periodEnd.getFullYear()}`;
      const summary = content.replace(/^##.*$/gm, '').replace(/\*\*/g, '').trim().split('\n').filter(Boolean)[0] ?? "";

      await supabase.from("articles").upsert({
        title, slug, content, summary,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        total_reports: totalReports,
        total_loss: totalLoss,
        top_category: topCategory?.[0] ?? null,
        top_platform: topPlatform?.[0] ?? null,
        top_bank: topBank?.[0] ?? null,
        published_at: new Date().toISOString(),
        status: 'draft',
        cover_image: null,
      }, { onConflict: "slug" });

      console.log(`[CRON] Artikel laporan berhasil di-generate: ${title}`);
    }
  }

  // ── Generate artikel edukasi (opsi C) ────────────────────────────────────
  const educationAngle = getEducationAngle(topCategory?.[0] ?? null, topPlatform?.[0] ?? null);

  const promptEdukasi = `Kamu adalah analis keamanan digital dari platform KawalTransaksi, platform komunitas anti-penipuan Indonesia.

Minggu ini, modus penipuan yang paling banyak dilaporkan adalah "${topCategory?.[0] ?? 'penipuan online'}" dan platform yang paling sering digunakan penipu adalah "${topPlatform?.[0] ?? 'media sosial'}".

Tulis artikel edukasi yang informatif tentang: ${educationAngle}

Format artikel dalam Markdown:
## Pendahuluan
(2-3 kalimat pembuka yang menarik perhatian pembaca)

## Bagaimana Modus Ini Bekerja
(jelaskan langkah-langkah modus penipuan ini dengan detail, gunakan **bold** untuk kata kunci penting)

## Tanda-tanda yang Perlu Diwaspadai
(4-5 tanda bahaya, gunakan format list dengan -)

## Langkah Pencegahan
(4-5 langkah konkret yang bisa dilakukan, gunakan format list dengan -)

## Apa yang Harus Dilakukan Jika Sudah Menjadi Korban
(panduan singkat)

## Penutup
(ajakan untuk selalu cek nomor di KawalTransaksi sebelum transaksi)

Panjang artikel: 500-700 kata. Gunakan bahasa yang informatif, mudah dipahami, dan engaging.`;

  const groqResEdukasi = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: promptEdukasi }], max_tokens: 1500, temperature: 0.8 }),
  });

  if (groqResEdukasi.ok) {
    const groqData = (await groqResEdukasi.json()) as any;
    const content = groqData.choices?.[0]?.message?.content ?? "";
    if (content) {
      const titleEdukasi = `${educationAngle.charAt(0).toUpperCase() + educationAngle.slice(1)}`;
      const slugEdukasi = `edukasi-${educationAngle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${periodEnd.getFullYear()}-${periodEnd.getMonth() + 1}-${periodEnd.getDate()}`;
      const summaryEdukasi = content.replace(/^##.*$/gm, '').replace(/\*\*/g, '').trim().split('\n').filter(Boolean)[0] ?? "";

      await supabase.from("articles").upsert({
        title: titleEdukasi,
        slug: slugEdukasi,
        content,
        summary: summaryEdukasi,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        total_reports: null,
        total_loss: null,
        top_category: topCategory?.[0] ?? null,
        top_platform: topPlatform?.[0] ?? null,
        top_bank: null,
        published_at: new Date().toISOString(),
        status: 'draft',
        cover_image: null,
      }, { onConflict: "slug" });

      console.log(`[CRON] Artikel edukasi berhasil di-generate: ${titleEdukasi}`);
    }
  }
}