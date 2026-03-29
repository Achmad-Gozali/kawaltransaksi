// ============================================
// 📁 LOKASI: components/SearchForm.tsx
// 📝 REDESIGN — cleaner search bar
// ============================================

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { toSlug } from '@/lib/utils';

export default function SearchForm() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    router.push(`/check/${toSlug(query)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-zinc-200/60 border border-zinc-200 p-1.5 focus-within:border-zinc-400 focus-within:shadow-zinc-300/40 transition-all">
        <div className="absolute left-5 pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nomor HP atau rekening..."
          className="flex-grow pl-12 pr-4 py-4 bg-transparent placeholder-zinc-400 focus:outline-none text-base font-medium text-zinc-900"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3.5 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all flex items-center gap-2 disabled:opacity-40 active:scale-95 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Cek <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <span className="text-[11px] text-zinc-400 font-medium self-center mr-1">Coba:</span>
        {['08123456789', '1234567890', '08571234567'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setQuery(num)}
            className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all active:scale-95"
          >
            {num}
          </button>
        ))}
      </div>
    </form>
  );
}