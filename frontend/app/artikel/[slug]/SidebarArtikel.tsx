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
    <div ref={sidebarRef} className="sticky top-24 space-y-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Artikel Terbaru</p>
      <div className="space-y-4">
        {articles.map((article) => (
          <Link key={article.slug} href={`/artikel/${article.slug}`}
            className="flex gap-3 group hover:opacity-80 transition-opacity">
            {article.cover_image ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image src={article.cover_image} alt={article.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center">
                <span className="text-slate-300 text-xs font-bold">KT</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors leading-snug line-clamp-2 mb-1">{article.title}</p>
              <p className="text-[10px] text-slate-400">{formatDate(article.published_at)}</p>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/artikel" className="block text-center text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors pt-2">
        Lihat semua artikel →
      </Link>
    </div>
  );
}