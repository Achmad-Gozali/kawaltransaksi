import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artikel — KawalTransaksi',
  description: 'Tips keamanan, modus penipuan terbaru, dan panduan bertransaksi aman dari KawalTransaksi.',
  alternates: {
    canonical: 'https://kawaltransaksi.com/artikel',
  },
  openGraph: {
    title: 'Artikel — KawalTransaksi',
    description: 'Tips keamanan, modus penipuan terbaru, dan panduan bertransaksi aman dari KawalTransaksi.',
    url: 'https://kawaltransaksi.com/artikel',
    siteName: 'KawalTransaksi',
    locale: 'id_ID',
    type: 'website',
  },
};

export const revalidate = 300;

const BASE    = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function formatDateID(d: string) {
  try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

function readingTime(content?: string) {
  if (!content) return null;
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const mins  = Math.max(1, Math.round(words / 200));
  return `${mins} menit baca`;
}

async function getArticles() {
  try {
    const res = await fetch(`${BASE}/api/admin/articles/public`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return (await res.json()).data ?? [];
  } catch { return []; }
}

export default async function ArtikelPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Artikel & Edukasi</h1>
          <p className="text-slate-500 text-sm">Tips keamanan, modus penipuan terbaru, dan panduan bertransaksi aman.</p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">Belum ada artikel.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(articles as any[]).map((a) => {
              const publishedAt = a.published_at ?? a.publishedAt ?? a.created_at;
              const rt          = readingTime(a.content);
              const thumbUrl    = a.thumbnail;
              return (
                <Link key={a.id ?? a.slug} href={`/artikel/${a.slug}`}
                  className="group flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
                  {/* Thumbnail */}
                  {thumbUrl ? (
                    <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                      <Image
                        src={thumbUrl}
                        alt={a.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-slate-100 flex items-center justify-center">
                      <span className="text-5xl">📝</span>
                    </div>
                  )}

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4">
                    {a.category && (
                      <span className="inline-block text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full w-fit mb-3">
                        {a.category}
                      </span>
                    )}
                    <h2 className="text-base font-bold text-slate-900 mb-2 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-4 flex-1">
                        {a.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-auto pt-2">
                      <span>{formatDateID(publishedAt)}</span>
                      {rt && <><span>·</span><span>{rt}</span></>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}