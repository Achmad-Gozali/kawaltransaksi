'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { encodeSlug } from '@/lib/utils';

function isValidRekening(num: string): boolean {
  const cleaned = num.replace(/\s/g, '');
  // Nomor rekening: angka saja, 10-20 digit, tidak diawali 08 atau +62
  if (cleaned.startsWith('08') || cleaned.startsWith('62')) return false;
  return /^\d{10,20}$/.test(cleaned);
}

function getRekeningError(num: string): string | null {
  if (!num) return null;
  const cleaned = num.replace(/\s/g, '');
  if (cleaned.startsWith('08') || cleaned.startsWith('62')) {
    return 'Ini terlihat seperti nomor HP. Untuk cek nomor HP atau WhatsApp, gunakan halaman Cek Nomor HP.';
  }
  if (cleaned.length < 10) {
    return 'Nomor rekening terlalu pendek. Minimal 10 digit.';
  }
  if (cleaned.length > 20) {
    return 'Nomor rekening terlalu panjang. Maksimal 20 digit.';
  }
  return null;
}

export default function RekeningSearchForm() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const router = useRouter();

  const error = touched ? getRekeningError(query) : null;
  const isValid = isValidRekening(query);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!query.trim() || !isValid) return;
    setIsLoading(true);
    router.push(`/check/${encodeSlug(query)}`);
  };

  const examples = ['1234567890', '1122334455'];

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <form onSubmit={handleSubmit} className="group relative">
        <div className={`relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-xl shadow-sm border p-1.5 transition-all duration-300 ${
          error
            ? 'border-red-400 ring-2 ring-red-400/10'
            : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10'
        }`}>
          <div className="relative flex-grow flex items-center">
            <div className="absolute left-4 sm:left-5 pointer-events-none">
              <Search className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-emerald-500'
              }`} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value.replace(/[^0-9]/g, ''));
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              placeholder="Masukkan nomor rekening..."
              className="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-3 bg-transparent placeholder-slate-400 focus:outline-none text-sm sm:text-base font-bold text-slate-900"
              disabled={isLoading}
              maxLength={20}
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
              <>CEK DATABASE <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-2.5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-600 leading-relaxed">{error}</p>
          </div>
        )}
      </form>

      <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contoh Pencarian:</span>
        {examples.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => { setQuery(num); setTouched(false); }}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}