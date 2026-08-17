'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">Terjadi kesalahan</h1>
      <p className="text-slate-400 text-sm sm:text-base max-w-sm leading-relaxed mb-6">
        Maaf, terjadi kesalahan tak terduga saat memuat halaman ini. Silakan coba lagi atau kembali ke beranda.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-8 py-3.5 bg-emerald-700 text-white text-sm font-bold rounded-xl hover:bg-emerald-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Coba Lagi
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-8 py-3.5 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
