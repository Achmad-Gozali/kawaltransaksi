import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { safeJsonLd } from "@/core/utils";

const BASE    = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const SITE_URL = 'https://kawaltransaksi.com';

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

function stripHtml(html?: string) {
  return (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// excerpt boleh kosong/undefined dari DB -> pakai 155 karakter pertama konten
// (tanpa tag HTML) sebagai fallback untuk <meta description> & JSON-LD.
function deriveExcerpt(article: { excerpt?: string | null; content?: string | null }): string | undefined {
  const raw = article.excerpt?.trim();
  if (raw) return raw;
  const text = stripHtml(article.content ?? '');
  if (!text) return undefined;
  return text.length > 155 ? `${text.slice(0, 155).trimEnd()}…` : text;
}

// Gambar di konten TipTap (dangerouslySetInnerHTML) tidak lazy secara default.
// Sisipkan loading="lazy" + decoding="async" pada <img> yang belum punya.
function lazyifyContentImages(html?: string): string {
  return (html ?? '').replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async"');
}

async function getArticle(slug: string) {
  try {
    const res = await fetch(`${BASE}/api/admin/articles/public/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()).data ?? null;
  } catch { return null; }
}

async function getRecentArticles(excludeSlug: string) {
  try {
    const res = await fetch(`${BASE}/api/admin/articles/public`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = (await res.json()).data ?? [];
    return data.filter((a: any) => a.slug !== excludeSlug).slice(0, 4);
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article  = await getArticle(slug);

  if (!article) {
    return {
      title: 'Artikel tidak ditemukan - KawalTransaksi',
      robots: { index: false, follow: false },
    };
  }

  const thumbUrl = article.thumbnail;
  const url = `${SITE_URL}/artikel/${slug}`;
  const title = `${article.title} - KawalTransaksi`;
  const description = deriveExcerpt(article);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: 'KawalTransaksi',
      locale: 'id_ID',
      images: thumbUrl ? [{ url: thumbUrl }] : undefined,
      publishedTime: article.published_at ?? article.publishedAt ?? undefined,
      modifiedTime: article.updated_at ?? article.updatedAt ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: thumbUrl ? [thumbUrl] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ArtikelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, recents] = await Promise.all([getArticle(slug), getRecentArticles(slug)]);
  if (!article) notFound();

  const publishedAt = article.published_at ?? article.publishedAt;
  const updatedAt   = article.updated_at ?? article.updatedAt ?? publishedAt;
  const rt          = readingTime(article.content);
  const thumbUrl    = article.thumbnail;
  const excerpt     = deriveExcerpt(article);
  const contentHtml = lazyifyContentImages(article.content);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: excerpt,
    image: thumbUrl ? [thumbUrl] : undefined,
    datePublished: publishedAt ?? undefined,
    dateModified: updatedAt ?? undefined,
    articleSection: article.category ?? undefined,
    // DB punya kolom author_id, tapi endpoint publik tidak mengekspos nama
    // penulis individual -> atribusi ke Organization.
    author: {
      "@type": "Organization",
      name: "KawalTransaksi",
      url: "https://kawaltransaksi.com",
    },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
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
                    sizes="(max-width: 768px) 100vw, 720px"
                    className="object-cover"
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
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />

              {/* Artikel Lainnya */}
              {recents.length > 0 && (
                <div className="mt-16">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Artikel Lainnya</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {recents.slice(0, 3).map((a: any) => {
                      const pub = a.published_at ?? a.publishedAt ?? a.created_at;
                      const art = readingTime(a.content);
                      const rThumbUrl = a.thumbnail;
                      return (
                        <Link key={a.slug} href={`/artikel/${a.slug}`}
                          className="group flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
                          {rThumbUrl ? (
                            <div className="relative w-full h-36 bg-slate-100 overflow-hidden">
                              <Image src={rThumbUrl} alt={a.title} fill sizes="(max-width: 640px) 100vw, 240px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
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
                    const sThumbUrl = a.thumbnail;
                    return (
                      <Link key={a.slug} href={`/artikel/${a.slug}`} className="flex gap-3 group">
                        {sThumbUrl ? (
                          <div className="relative w-16 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <Image src={sThumbUrl} alt={a.title} fill sizes="64px" className="object-cover" />
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