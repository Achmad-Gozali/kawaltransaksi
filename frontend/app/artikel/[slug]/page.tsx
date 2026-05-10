import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import SidebarArtikel from './SidebarArtikel';

export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await (supabase
    .from('articles')
    .select('title, summary, cover_image')
    .eq('slug', slug)
    .single() as any);
  if (!data) return { title: 'Artikel tidak ditemukan - KawalTransaksi' };
  return {
    title: `${data.title} - KawalTransaksi`,
    description: data.summary,
    openGraph: data.cover_image ? { images: [data.cover_image] } : undefined,
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatLoss(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} menit baca`;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderContent(content: string) {
  const blocks = content.split('\n\n');
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={i} className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-10 mb-3">
          {trimmed.replace('## ', '')}
        </h2>
      );
    }

    if (trimmed.split('\n').every(line => line.trim().startsWith('- '))) {
      const items = trimmed.split('\n').filter(l => l.trim().startsWith('- '));
      return (
        <ul key={i} className="space-y-2 pl-5 my-2">
          {items.map((item, j) => (
            <li key={j} className="text-slate-700 text-sm sm:text-base leading-relaxed list-disc">
              {renderInline(item.replace(/^-\s*/, ''))}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={i} className="text-slate-700 text-sm sm:text-base leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  });
}

export default async function ArtikelDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await (supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single() as any);

  if (!article) notFound();

  const { data: others } = await (supabase
    .from('articles')
    .select('title, slug, published_at, cover_image')
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(4) as any);

  return (
    <main className="bg-white min-h-screen font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-12">

          <div className="flex-1 min-w-0">
            <Link href="/artikel" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors mb-6">
              ← Semua Artikel
            </Link>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {article.top_category && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">{article.top_category}</span>
              )}
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(article.published_at)}</span>
              <span className="text-slate-200">·</span>
              <span className="text-[10px] text-slate-400">{estimateReadTime(article.content)}</span>
              {(article.total_reports ?? 0) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{article.total_reports} laporan masuk</span>
              )}
              {(article.total_loss ?? 0) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">{formatLoss(article.total_loss!)}</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-900 mb-6 leading-tight">{article.title}</h1>

            {article.cover_image && (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-8">
                <Image src={article.cover_image} alt={article.title} fill className="object-cover" priority />
              </div>
            )}

            <div className="h-px bg-slate-100 mb-8" />

            <div className="space-y-5">
              {renderContent(article.content)}
            </div>

            <div className="mt-12 rounded-2xl overflow-hidden border border-slate-200">
              <div className="bg-slate-900 px-6 py-7 sm:px-8 sm:py-8">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Verifikasi Sebelum Bertransaksi</p>
                <p className="text-lg sm:text-xl font-black text-white leading-snug mb-2">Jangan jadi korban berikutnya.</p>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6 max-w-md">Periksa nomor HP atau rekening bank sebelum melakukan transfer. Database kami dibangun dari laporan nyata komunitas — gratis, tanpa registrasi.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/cek-nomor" className="flex-1 sm:flex-none text-center px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors uppercase tracking-widest">Cek Nomor HP</Link>
                  <Link href="/cek-rekening" className="flex-1 sm:flex-none text-center px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-colors uppercase tracking-widest">Cek Rekening Bank</Link>
                </div>
              </div>
            </div>
          </div>

          {others && others.length > 0 && (
            <aside className="hidden lg:block w-72 shrink-0">
              <SidebarArtikel articles={others} />
            </aside>
          )}

        </div>
      </div>
    </main>
  );
}