import { createClient } from "@/core/supabase/server";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Artikel & Edukasi Penipuan Online - KawalTransaksi",
  description:
    "Artikel, analisis pola, dan edukasi seputar penipuan online di Indonesia. Diperbarui setiap minggu berdasarkan laporan nyata komunitas.",

  alternates: {
    canonical: "https://kawaltransaksi.com/artikel",
  },

  openGraph: {
    title: "Artikel & Edukasi Penipuan Online - KawalTransaksi",
    description:
      "Artikel, analisis pola, dan edukasi seputar penipuan online di Indonesia. Diperbarui setiap minggu berdasarkan laporan nyata komunitas.",
    url: "https://kawaltransaksi.com/artikel",
    siteName: "KawalTransaksi",
    locale: "id_ID",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Artikel & Edukasi Penipuan Online - KawalTransaksi",
    description:
      "Artikel, analisis pola, dan edukasi seputar penipuan online di Indonesia.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} menit baca`;
}

function formatLoss(amount: number): string {
  if (!amount) return null as any;
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
    style: "currency",
    currency: "IDR",
  }).format(amount);
}

const artikelSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Artikel & Edukasi Penipuan Online - KawalTransaksi",
  description:
    "Artikel, analisis pola, dan edukasi seputar penipuan online di Indonesia.",
  url: "https://kawaltransaksi.com/artikel",
  isPartOf: {
    "@type": "WebSite",
    "@id": "https://kawaltransaksi.com/#website",
    name: "KawalTransaksi",
    url: "https://kawaltransaksi.com",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: "https://kawaltransaksi.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Artikel",
        item: "https://kawaltransaksi.com/artikel",
      },
    ],
  },
};

export default async function ArtikelPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select(
      "id, title, slug, summary, total_reports, total_loss, published_at, cover_image, content, top_category",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  return (
    <main className="bg-white min-h-screen font-sans">
      <div className="relative bg-slate-50 pb-16">
        <div className="px-4 pt-10 pb-4 sm:pt-16 sm:pb-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">
              Diperbarui setiap minggu
            </p>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase mb-3 leading-tight">
              Artikel Penipuan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
              Laporan dan edukasi seputar penipuan online di Indonesia,
              diperbarui setiap minggu.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 60"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-12 sm:h-16"
          >
            <path
              d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      <section className="px-4 py-10 sm:py-14">
        <div className="max-w-5xl mx-auto">
          {!articles || articles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">
                Belum ada artikel
              </p>
              <p className="text-xs text-slate-400">
                Artikel pertama akan muncul otomatis minggu depan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/artikel/${article.slug}`}
                  className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 shadow-sm"
                >
                  {article.cover_image ? (
                    <Image
                      src={article.cover_image}
                      alt={article.title}
                      width={800}
                      height={600}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-slate-100 flex items-center justify-center">
                      <span className="text-slate-300 text-2xl font-black">
                        KT
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-5">
                    {article.top_category && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 self-start mb-3">
                        {article.top_category}
                      </span>
                    )}
                    <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors mb-2 leading-snug flex-1">
                      {article.title}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                      {article.summary}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-400">
                          {formatDate(article.published_at)}
                        </span>
                        <span className="text-slate-200">-</span>
                        <span className="text-[10px] text-slate-400">
                          {estimateReadTime(article.content)}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {(article.total_reports ?? 0) > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {article.total_reports} laporan
                          </span>
                        )}
                        {(article.total_loss ?? 0) > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                            {formatLoss(article.total_loss!)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(artikelSchema) }}
      />
    </main>
  );
}