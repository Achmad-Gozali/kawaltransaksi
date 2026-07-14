import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const BASE    = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// Thumbnail di database sekarang berisi URL R2 lengkap (https://img.kawaltransaksi.com/...)
// hasil migrasi, tapi fungsi ini tetap mendukung path relatif lama (/uploads/...) untuk jaga-jaga
// kalau ada data yang belum sempat ter-migrasi atau sumber lain di masa depan.
function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
}

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

async function getArticle(slug: string) {
  try {
    const res = await fetch(`${BASE}/api/admin/articles/public/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()).data ?? null;
  } catch { return null; }
}

async function getRecentArticles(excludeSlug: string) {
  try {
    const res = await fetch(`${BASE}/api/admin/articles/public`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()).data ?? [];
    return data.filter((a: any) => a.slug !== excludeSlug).slice(0, 4);
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article  = await getArticle(slug);
  if (!article) return { title: 'Artikel tidak ditemukan' };
  const thumbUrl = resolveImageUrl(article.thumbnail);
  return {
    title:       `${article.title} — KawalTransaksi`,
    description: article.excerpt ?? undefined,
    openGraph:   { images: thumbUrl ? [thumbUrl] : [] },
  };
}

export default async function ArtikelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, recents] = await Promise.all([getArticle(slug), getRecentArticles(slug)]);
  if (!article) notFound();

  const publishedAt = article.published_at ?? article.publishedAt;
  const updatedAt   = article.updated_at ?? article.updatedAt ?? publishedAt;
  const rt          = readingTime(article.content);
  const thumbUrl    = resolveImageUrl(article.thumbnail);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: thumbUrl ? [thumbUrl] : undefined,
    datePublished: publishedAt ?? undefined,
    dateModified: updatedAt ?? undefined,
    articleSection: article.category ?? undefined,
    publisher: {
      "@type": "Organization",
      name: "KawalTransaksi",
      logo: {
        "@type": "ImageObject",
        url: "https://kawaltransaksi.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://kawaltransaksi.com/artikel/${slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
          <div className="flex gap-12 items-start">

            {/* ── Main content ── */}
            <article className="flex-1 min-w-0">
              {article.category && (
                <span className="inline-block text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full mb-4">
                  {article.category}
                </span>
              )}

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug mb-4">
                {article.title}
              </h1>

              <div className="flex items-center gap-3 text-sm text-slate-400 mb-8">
                {publishedAt && <span>{formatDateID(publishedAt)}</span>}
                {rt && <><span>·</span><span>{rt}</span></>}
              </div>

              {thumbUrl && (
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-8 bg-slate-100">
                  <Image
                    src={thumbUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                </div>
              )}

              {article.excerpt && (
                <p className="text-base text-slate-600 leading-relaxed mb-8">
                  {article.excerpt}
                </p>
              )}

              <div
                className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-slate-200 prose-blockquote:text-slate-500 prose-blockquote:not-italic prose-strong:text-slate-900 prose-li:text-slate-700"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Artikel Lainnya */}
              {recents.length > 0 && (
                <div className="mt-16">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Artikel Lainnya</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {recents.slice(0, 3).map((a: any) => {
                      const pub = a.published_at ?? a.publishedAt ?? a.created_at;
                      const art = readingTime(a.content);
                      const rThumbUrl = resolveImageUrl(a.thumbnail);
                      return (
                        <Link key={a.slug} href={`/artikel/${a.slug}`}
                          className="group flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
                          {rThumbUrl ? (
                            <div className="relative w-full h-36 bg-slate-100 overflow-hidden">
                              <Image src={rThumbUrl} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                            </div>
                          ) : (
                            <div className="w-full h-36 bg-slate-100 flex items-center justify-center">
                              <span className="text-3xl">📝</span>
                            </div>
                          )}
                          <div className="p-3">
                            {a.category && (
                              <span className="inline-block text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full mb-2">
                                {a.category}
                              </span>
                            )}
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors mb-2">
                              {a.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <span>{formatDateID(pub)}</span>
                              {art && <><span>·</span><span>{art}</span></>}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>

            {/* ── Sidebar sticky ── */}
            {recents.length > 0 && (
              <aside className="hidden lg:block w-64 shrink-0 self-start sticky top-28">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Artikel Terbaru</p>
                <div className="space-y-4">
                  {recents.map((a: any) => {
                    const pub = a.published_at ?? a.publishedAt ?? a.created_at;
                    const art = readingTime(a.content);
                    const sThumbUrl = resolveImageUrl(a.thumbnail);
                    return (
                      <Link key={a.slug} href={`/artikel/${a.slug}`} className="flex gap-3 group">
                        {sThumbUrl ? (
                          <div className="relative w-16 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <Image src={sThumbUrl} alt={a.title} fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="w-16 h-14 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                            <span className="text-lg">📝</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-emerald-700 transition-colors leading-snug">
                            {a.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                            <span>{formatDateID(pub)}</span>
                            {art && <><span>·</span><span>{art}</span></>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <Link href="/artikel" className="block mt-5 text-sm text-emerald-600 hover:text-emerald-700 transition-colors">
                  Lihat semua artikel →
                </Link>
              </aside>
            )}

          </div>
        </div>
      </div>
    </>
  );
}