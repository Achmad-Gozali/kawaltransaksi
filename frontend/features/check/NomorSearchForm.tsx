'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { encodeSlug } from '@/core/utils';

function validateHP(num: string): { valid: boolean; warning: string | null } {
  if (num.length === 0) return { valid: false, warning: null };
  if (num === '0' || num === '6' || num === '62') return { valid: false, warning: null };
  const validPrefix = num.startsWith('08') || num.startsWith('628');
  if (!validPrefix) return { valid: false, warning: 'Nomor HP Indonesia harus diawali 08 atau 628.' };
  if (num.length < 10) return { valid: false, warning: null };
  if (num.length > 13) return { valid: false, warning: 'Nomor HP terlalu panjang. Maksimal 13 digit.' };
  return { valid: true, warning: null };
}

export default function NomorSearchForm() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const cleaned = query.replace(/\D/g, '');
  const { valid: isValidHP, warning } = validateHP(cleaned);

  const handleChange = (val: string) => {
    setQuery(val.replace(/\D/g, ''));
    setError(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidHP) return;
    setLoading(true);
    router.push(`/check/${encodeSlug(cleaned)}?type=phone`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-lg space-y-3">
      <div className={`flex items-center gap-2 bg-white border-2 rounded-md px-3 py-2 transition-all ${
        warning
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
          placeholder="Contoh: 081234567890"
          maxLength={15}
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1"
        />
        <button
          type="submit"
          disabled={loading || !isValidHP}
          className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek'}
        </button>
      </div>

      {warning && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{warning}</span>
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