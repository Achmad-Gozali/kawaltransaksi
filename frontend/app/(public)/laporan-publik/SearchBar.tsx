'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  defaultValue?: string;
  type: string;
  sort: string;
}

export default function SearchBar({ defaultValue = '', type, sort }: Props) {
  const [q, setQ] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (sort !== 'latest') params.set('sort', sort);
    if (q.trim()) params.set('q', q.trim().replace(/\D/g, '') || q.trim());
    router.push(`/laporan-publik?${params.toString()}`);
  };

  const handleClear = () => {
    setQ('');
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (sort !== 'latest') params.set('sort', sort);
    router.push(`/laporan-publik?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e as any)}
          placeholder="Cari nomor HP, rekening, atau e-wallet..."
          className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
        />
        {q && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-lg leading-none transition-colors">
            x
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors shrink-0">
        Cari
      </button>
    </div>
  );
}