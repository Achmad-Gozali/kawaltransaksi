'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Loader2, ArrowRight } from 'lucide-react';
import { encodeSlug } from '@/lib/utils';

export default function NomorSearchForm() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    router.push(`/check/${encodeSlug(query)}`);
  };

  const examples = ['08123456789', '08571234567'];

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <form onSubmit={handleSubmit} className="group relative">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-300">
          
          <div className="relative flex-grow flex items-center">
            <div className="absolute left-4 sm:left-5 pointer-events-none">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="tel"
              value={query}
              onChange={(e) => setQuery(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Masukkan nomor HP / WA..."
              className="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-3 bg-transparent placeholder-slate-400 focus:outline-none text-sm sm:text-base font-bold text-slate-900"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="mt-2 sm:mt-0 px-6 sm:px-8 py-3.5 sm:py-3 bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>CARI DATABASE <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contoh Pencarian:</span>
        {examples.map((num) => (
          <button 
            key={num} 
            type="button" 
            onClick={() => setQuery(num)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}