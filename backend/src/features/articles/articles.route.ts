import { Hono } from 'hono';
import sql from '../../core/db';
import { groqChat } from '../../core/groq';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    const data = await sql`
      SELECT id, title, slug, summary, total_reports, total_loss, top_category, published_at, cover_image, status
      FROM articles
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 20
    `;
    return c.json({ success: true, data });
  } catch (err) {
    console.error('[articles] fetch list error:', err);
    return c.json({ success: false, message: 'Gagal mengambil artikel.' }, 500);
  }
});

app.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const [data] = await sql`
      SELECT id, title, slug, summary, content, status, cover_image, published_at, total_reports, total_loss, top_category, top_platform, top_bank, period_start, period_end, created_at
      FROM articles
      WHERE slug = ${slug} AND status = 'published'
      LIMIT 1
    `;
    if (!data) return c.json({ success: false, message: 'Artikel tidak ditemukan.' }, 404);
    return c.json({ success: true, data });
  } catch (err) {
    console.error('[articles] fetch detail error:', err);
    return c.json({ success: false, message: 'Gagal mengambil artikel.' }, 500);
  }
});

export default app;

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
  const periodEnd   = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 7);

  const reports = await sql<ReportRow[]>`
    SELECT category, platform, bank_name, loss_amount
    FROM reports
    WHERE created_at >= ${periodStart.toISOString()}
      AND created_at <= ${periodEnd.toISOString()}
      AND status IN ('verified', 'pending')
  `;

  if (!reports?.length) {
    console.log('[cron] tidak ada laporan minggu ini, skip.');
    return;
  }

  const totalReports = reports.length;
  const totalLoss    = reports.reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0);

  const categoryCount: Record<string, number> = {};
  const platformCount: Record<string, number> = {};
  const bankCount:     Record<string, number> = {};

  for (const r of reports) {
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

  const content = await groqChat(`Kamu adalah analis keamanan digital dari KawalTransaksi.
Data laporan penipuan minggu ${weekStr}:
- Total laporan: ${totalReports}
- Total kerugian: ${totalLossFormatted}
Kategori: ${toList(sorted(categoryCount), 'laporan')}
Platform: ${toList(sorted(platformCount), 'laporan')}
Bank/e-wallet: ${toList(sorted(bankCount), 'rekening')}
Tulis artikel analisis dalam bahasa Indonesia, format Markdown, 400-600 kata.`, env.GROQ_API_KEY, { temperature: 0.7 });

  if (!content) return;

  const formatted   = fixArticleFormat(content);
  const summary     = formatted.replace(/^##.*$/gm, '').trim().split('\n').filter(Boolean)[0] ?? '';
  const startDay    = periodStart.getDate();
  const endDay      = periodEnd.getDate();
  const endLabel    = periodEnd.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const title       = `Laporan Penipuan ${startDay}-${endDay} ${endLabel}`;
  const slug        = `laporan-${startDay}-${endDay}-${periodEnd.toLocaleDateString('id-ID', { month: 'long' }).toLowerCase().replace(/ /g, '-')}-${periodEnd.getFullYear()}`;

  await sql`
    INSERT INTO articles (title, slug, content, summary, period_start, period_end, total_reports, total_loss, top_category, top_platform, top_bank, published_at, status, cover_image)
    VALUES (${title}, ${slug}, ${formatted}, ${summary}, ${periodStart.toISOString()}, ${periodEnd.toISOString()}, ${totalReports}, ${totalLoss}, ${topCategory?.[0] ?? null}, ${topPlatform?.[0] ?? null}, ${topBank?.[0] ?? null}, ${new Date().toISOString()}, 'draft', null)
    ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, summary = EXCLUDED.summary, total_reports = EXCLUDED.total_reports, total_loss = EXCLUDED.total_loss, updated_at = NOW()
  `;

  console.log('[cron] artikel berhasil:', title);
}
