'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { encodeSlug } from '@/core/utils';
import Link from 'next/link';

function isLikelyHP(num: string): boolean {
  if (!num.length) return false;
  if (num === '0' || num === '6' || num === '62') return false;
  return num.startsWith('08') || num.startsWith('628');
}

export default function RekeningSearchForm() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const cleaned = query.replace(/\D/g, '');
  const isWrongInput = isLikelyHP(cleaned);

  const handleChange = (val: string) => {
    setQuery(val.replace(/\D/g, ''));
    setError(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isWrongInput) return;
    if (!cleaned || cleaned.length < 6) {
      setError('Masukkan nomor rekening yang benar, minimal 6 digit.');
      return;
    }
    setLoading(true);
    router.push(`/check/${encodeSlug(cleaned)}?type=bank`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-lg space-y-3">
      <div className={`flex items-center gap-2 bg-white border-2 rounded-md px-3 py-2 transition-all ${
        isWrongInput
          ? 'border-amber-400 ring-2 ring-amber-100'
          : 'border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100'
      }`}>
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Contoh: 1234567890"
          maxLength={20}
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1"
        />
        <button
          type="submit"
          disabled={loading || isWrongInput}
          className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek'}
        </button>
      </div>

      {isWrongInput && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Sepertinya ini nomor HP/WA, bukan nomor rekening.{' '}
            <Link href="/cek-nomor" className="font-bold underline underline-offset-2 hover:text-amber-900">
              Gunakan halaman Cek Nomor HP
            </Link>{' '}
            untuk hasil yang akurat.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </form>
  );
}