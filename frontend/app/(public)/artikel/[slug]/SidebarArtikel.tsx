'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';

interface Article {
  title: string;
  slug: string;
  published_at: string;
  cover_image: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SidebarArtikel({ articles }: { articles: Article[] }) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={sidebarRef} className="sticky top-24">
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Artikel Terbaru</p>
        <div className="space-y-3">
          {articles.map((article) => (
            <Link key={article.slug} href={`/artikel/${article.slug}`}
              className="flex gap-3 group p-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200">
              {article.cover_image ? (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                  <Image src={article.cover_image} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-200" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-slate-200 shrink-0 flex items-center justify-center">
                  <span className="text-slate-400 text-xs font-bold">KT</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors leading-snug line-clamp-2 mb-1">{article.title}</p>
                <p className="text-[10px] text-slate-400">{formatDate(article.published_at)}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Link href="/artikel" className="block text-center text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            Lihat semua artikel ->
          </Link>
        </div>
      </div>
    </div>
  );
}