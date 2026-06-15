import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

const ARTICLE_LIST_FIELDS   = 'id, title, slug, summary, total_reports, total_loss, top_category, published_at, cover_image, status';
const ARTICLE_DETAIL_FIELDS = 'id, title, slug, summary, content, status, cover_image, published_at, total_reports, total_loss, top_category, top_platform, top_bank, period_start, period_end, created_at';

function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

// ---------------------------------------------------------------------------
// GET /api/articles
// ---------------------------------------------------------------------------

app.get('/', async (c) => {
  const { data, error } = await getSupabase(c.env)
    .from('articles')
    .select(ARTICLE_LIST_FIELDS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[articles] fetch list error:', error.message);
    return c.json({ success: false, message: 'Gagal mengambil artikel.' }, 500);
  }

  return c.json({ success: true, data });
});

// ---------------------------------------------------------------------------
// GET /api/articles/:slug
// ---------------------------------------------------------------------------

app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  const { data, error } = await getSupabase(c.env)
    .from('articles')
    .select(ARTICLE_DETAIL_FIELDS)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    return c.json({ success: false, message: 'Artikel tidak ditemukan.' }, 404);
  }

  return c.json({ success: true, data });
});

export default app;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EDUCATION_THEMES: Record<string, string[]> = {
  'Jual Beli Online':     ['ciri-ciri penjual palsu di marketplace', 'cara aman belanja online', 'modus penipuan COD yang marak'],
  'Phishing / Soceng':    ['cara mengenali link phishing', 'modus social engineering terbaru', 'tips melindungi akun dari phishing'],
  'Investasi Bodong':     ['ciri-ciri investasi bodong', 'cara menghindari money game', 'tips sebelum berinvestasi online'],
  'Lowongan Kerja Palsu': ['cara mengenali lowongan kerja palsu', 'modus penipuan rekrutmen online', 'tips aman mencari kerja online'],
  'Penipuan Percintaan':  ['modus romance scam yang marak', 'cara mengenali akun palsu di media sosial', 'tips aman berkenalan online'],
  'Pinjaman Online':      ['ciri-ciri pinjol ilegal', 'cara melaporkan pinjol ilegal', 'tips aman meminjam uang online'],
  'default':              ['tips aman bertransaksi online', 'cara melindungi data pribadi di internet', 'modus penipuan online yang perlu diwaspadai'],
};

function getEducationAngle(topCategory: string | null, topPlatform: string | null): string {
  const themes = (topCategory && EDUCATION_THEMES[topCategory]) || EDUCATION_THEMES['default'];
  const theme  = themes[Math.floor(Math.random() * themes.length)];
  return topPlatform ? `${theme} khususnya yang terjadi di ${topPlatform}` : theme;
}

function fixArticleFormat(raw: string): string {
  return raw
    .replace(/([^\n])\n(## )/g, '$1\n\n$2')
    .replace(/(## [^\n]+)\n([^\n])/g, '$1\n\n$2')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface ReportRow    { category: string | null; platform: string | null; bank_name: string | null; loss_amount: number | string | null; }
interface GroqResponse { choices?: { message?: { content?: string } }[]; }

// ---------------------------------------------------------------------------
// generateWeeklyArticle — dipanggil oleh cron job
// ---------------------------------------------------------------------------

export async function generateWeeklyArticle(env: Env): Promise<void> {
  const supabase    = getSupabase(env);
  const periodEnd   = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 7);

  const { data: reports } = await supabase
    .from('reports')
    .select('category, platform, bank_name, loss_amount, status, created_at')
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString())
    .in('status', ['verified', 'pending']);

  if (!reports || reports.length === 0) {
    console.log('[cron] tidak ada laporan minggu ini, skip.');
    return;
  }

  const totalReports = reports.length;
  const totalLoss    = reports.reduce((sum, r: ReportRow) => sum + (Number(r.loss_amount) || 0), 0);

  const categoryCount: Record<string, number> = {};
  const platformCount: Record<string, number> = {};
  const bankCount:     Record<string, number> = {};

  for (const r of reports as ReportRow[]) {
    if (r.category) categoryCount[r.category] = (categoryCount[r.category] ?? 0) + 1;
    if (r.platform) platformCount[r.platform] = (platformCount[r.platform] ?? 0) + 1;
    if (r.bank_name) bankCount[r.bank_name]   = (bankCount[r.bank_name]   ?? 0) + 1;
  }

  const sorted = (obj: Record<string, number>) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]);

  const toList = (entries: [string, number][], suffix: string) =>
    entries.map(([name, count]) => `- ${name}: ${count} ${suffix}`).join('\n') || '- Tidak ada data';

  const topCategory = sorted(categoryCount)[0];
  const topPlatform = sorted(platformCount)[0];
  const topBank     = sorted(bankCount)[0];

  const totalLossFormatted = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(totalLoss);

  const weekStr = `${periodStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} - ${periodEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const groqHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.GROQ_API_KEY}`,
  };

  const groqFetch = async (prompt: string, temperature: number): Promise<string> => {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: groqHeaders,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature,
      }),
    });

    if (!res.ok) {
      console.error('[groq] request failed:', res.status, await res.text());
      return '';
    }

    const data = await res.json() as GroqResponse;
    return data.choices?.[0]?.message?.content ?? '';
  };

  // -- Artikel laporan mingguan ----------------------------------------------

  const rawLaporan = await groqFetch(`Kamu adalah analis keamanan digital dari KawalTransaksi, platform komunitas anti-penipuan Indonesia.

Data laporan penipuan minggu ${weekStr}:
- Total laporan: ${totalReports}
- Total kerugian: ${totalLossFormatted}

Kategori penipuan:
${toList(sorted(categoryCount), 'laporan')}

Platform yang digunakan penipu:
${toList(sorted(platformCount), 'laporan')}

Bank/e-wallet yang digunakan penipu:
${toList(sorted(bankCount), 'rekening')}

Tulis artikel analisis pola penipuan minggu ini dalam bahasa Indonesia yang mudah dipahami.

Gunakan format Markdown berikut, dengan baris kosong di antara setiap section:

## Ringkasan Minggu Ini

## Modus yang Paling Marak

## Platform yang Digunakan Penipu

## Tips Waspada
(gunakan format list dengan -)

## Penutup

Panjang: 400-600 kata. Jangan gunakan asterisk bold (**teks**). Pisahkan setiap section dengan baris kosong.`, 0.7);

  if (rawLaporan) {
    const content      = fixArticleFormat(rawLaporan);
    const summary      = content.replace(/^##.*$/gm, '').trim().split('\n').filter(Boolean)[0] ?? '';
    const startDay     = periodStart.getDate();
    const endDay       = periodEnd.getDate();
    const isSameMonth  = periodStart.getMonth() === periodEnd.getMonth();
    const startLabel   = isSameMonth ? `${startDay}` : `${startDay} ${periodStart.toLocaleDateString('id-ID', { month: 'long' })}`;
    const endMonthYear = periodEnd.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const title        = `Laporan Penipuan ${startLabel}-${endDay} ${endMonthYear}`;
    const slug         = `laporan-${startDay}-${endDay}-${periodEnd.toLocaleDateString('id-ID', { month: 'long' }).toLowerCase().replace(/ /g, '-')}-${periodEnd.getFullYear()}`;

    const { error } = await supabase.from('articles').upsert({
      title, slug, content, summary,
      period_start:   periodStart.toISOString(),
      period_end:     periodEnd.toISOString(),
      total_reports:  totalReports,
      total_loss:     totalLoss,
      top_category:   topCategory?.[0] ?? null,
      top_platform:   topPlatform?.[0] ?? null,
      top_bank:       topBank?.[0]     ?? null,
      published_at:   new Date().toISOString(),
      status:         'draft',
      cover_image:    null,
    }, { onConflict: 'slug' });

    if (error) console.error('[cron] gagal simpan artikel laporan:', error.message);
    else console.log('[cron] artikel laporan berhasil:', title);
  }

  // -- Artikel edukasi -------------------------------------------------------

  const educationAngle = getEducationAngle(topCategory?.[0] ?? null, topPlatform?.[0] ?? null);

  const rawEdukasi = await groqFetch(`Kamu adalah analis keamanan digital dari KawalTransaksi, platform komunitas anti-penipuan Indonesia.

Minggu ini modus terbanyak adalah "${topCategory?.[0] ?? 'penipuan online'}" via "${topPlatform?.[0] ?? 'media sosial'}".

Tulis artikel edukasi tentang: ${educationAngle}

Gunakan format Markdown berikut, dengan baris kosong di antara setiap section:

## Pendahuluan

## Bagaimana Modus Ini Bekerja

## Tanda-tanda yang Perlu Diwaspadai
(gunakan format list dengan -)

## Langkah Pencegahan
(gunakan format list dengan -)

## Apa yang Harus Dilakukan Jika Sudah Menjadi Korban

## Penutup

Panjang: 500-700 kata. Jangan gunakan asterisk bold (**teks**). Pisahkan setiap section dengan baris kosong.`, 0.8);

  if (rawEdukasi) {
    const content     = fixArticleFormat(rawEdukasi);
    const summary     = content.replace(/^##.*$/gm, '').trim().split('\n').filter(Boolean)[0] ?? '';
    const titleEdukasi = educationAngle.charAt(0).toUpperCase() + educationAngle.slice(1);
    const slugEdukasi  = `edukasi-${educationAngle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${periodEnd.getFullYear()}-${periodEnd.getMonth() + 1}-${periodEnd.getDate()}`;

    const { error } = await supabase.from('articles').upsert({
      title:         titleEdukasi,
      slug:          slugEdukasi,
      content,
      summary,
      period_start:  periodStart.toISOString(),
      period_end:    periodEnd.toISOString(),
      total_reports: null,
      total_loss:    null,
      top_category:  topCategory?.[0] ?? null,
      top_platform:  topPlatform?.[0] ?? null,
      top_bank:      null,
      published_at:  new Date().toISOString(),
      status:        'draft',
      cover_image:   null,
    }, { onConflict: 'slug' });

    if (error) console.error('[cron] gagal simpan artikel edukasi:', error.message);
    else console.log('[cron] artikel edukasi berhasil:', titleEdukasi);
  }
}