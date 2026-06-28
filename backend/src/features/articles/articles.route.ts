import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { groqChat } from '../../core/groq';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

const ARTICLE_LIST_FIELDS   = 'id, title, slug, summary, total_reports, total_loss, top_category, published_at, cover_image, status';
const ARTICLE_DETAIL_FIELDS = 'id, title, slug, summary, content, status, cover_image, published_at, total_reports, total_loss, top_category, top_platform, top_bank, period_start, period_end, created_at';

function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

app.get('/', async (c) => {
  const { data, error } = await getSupabase((c.get('env') as any))
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

app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  const { data, error } = await getSupabase((c.get('env') as any))
    .from('articles')
    .select(ARTICLE_DETAIL_FIELDS)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data)
    return c.json({ success: false, message: 'Artikel tidak ditemukan.' }, 404);

  return c.json({ success: true, data });
});

export default app;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fixArticleFormat(raw: string): string {
  return raw
    .replace(/([^\n])\n(## )/g, '$1\n\n$2')
    .replace(/(## [^\n]+)\n([^\n])/g, '$1\n\n$2')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface ReportRow { category: string | null; platform: string | null; bank_name: string | null; loss_amount: number | string | null; }

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

  if (!reports?.length) {
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

  const content = await groqChat(`Kamu adalah analis keamanan digital dari KawalTransaksi, platform komunitas anti-penipuan Indonesia.

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

Panjang: 400-600 kata. Jangan gunakan asterisk bold (**teks**). Pisahkan setiap section dengan baris kosong.`, env.GROQ_API_KEY, { temperature: 0.7 });

  if (!content) {
    console.error('[cron] groq tidak return content, skip.');
    return;
  }

  const formatted   = fixArticleFormat(content);
  const summary     = formatted.replace(/^##.*$/gm, '').trim().split('\n').filter(Boolean)[0] ?? '';
  const startDay    = periodStart.getDate();
  const endDay      = periodEnd.getDate();
  const isSameMonth = periodStart.getMonth() === periodEnd.getMonth();
  const startLabel  = isSameMonth ? `${startDay}` : `${startDay} ${periodStart.toLocaleDateString('id-ID', { month: 'long' })}`;
  const endLabel    = periodEnd.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const title       = `Laporan Penipuan ${startLabel}-${endDay} ${endLabel}`;
  const slug        = `laporan-${startDay}-${endDay}-${periodEnd.toLocaleDateString('id-ID', { month: 'long' }).toLowerCase().replace(/ /g, '-')}-${periodEnd.getFullYear()}`;

  const { error } = await supabase.from('articles').upsert({
    title, slug,
    content:      formatted,
    summary,
    period_start: periodStart.toISOString(),
    period_end:   periodEnd.toISOString(),
    total_reports: totalReports,
    total_loss:   totalLoss,
    top_category: topCategory?.[0] ?? null,
    top_platform: topPlatform?.[0] ?? null,
    top_bank:     topBank?.[0]     ?? null,
    published_at: new Date().toISOString(),
    status:       'draft',
    cover_image:  null,
  }, { onConflict: 'slug' });

  if (error) console.error('[cron] gagal simpan artikel:', error.message);
  else console.log('[cron] artikel berhasil:', title);
}