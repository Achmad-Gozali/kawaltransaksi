'use client';

// ============================================
// 📁 LOKASI: components/RekeningSearchForm.tsx
// 📝 BARU — form khusus cek rekening bank
// ============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, ArrowRight } from 'lucide-react';
import { toSlug } from '@/lib/utils';

export default function RekeningSearchForm() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    router.push(`/check/${toSlug(query)}`);
  };

  const examples = ['1234567890', '0987654321', '1122334455'];

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-emerald-100/60 border border-zinc-200 p-1.5 focus-within:border-emerald-300 focus-within:shadow-emerald-200/40 transition-all">
        <div className="absolute left-5 pointer-events-none">
          <Building2 className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="Contoh: 1234567890"
          className="flex-grow pl-12 pr-4 py-4 bg-transparent placeholder-zinc-400 focus:outline-none text-base font-medium text-zinc-900"
          disabled={isLoading}
          maxLength={20}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-40 active:scale-95 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>Cek <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <span className="text-[11px] text-zinc-400 font-medium self-center mr-1">Coba:</span>
        {examples.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setQuery(num)}
            className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-500 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-95"
          >
            {num}
          </button>
        ))}
      </div>
    </form>
  );
}