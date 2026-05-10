'use client';

import { useState } from 'react';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8787';

export default function GantiPasswordButton({ email }: { email: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Gagal mengirim email. Coba lagi.'); return; }
      setSent(true);
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet kamu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-zinc-400" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Ganti Password</p>
          {sent
            ? <p className="text-xs font-medium text-emerald-600 mt-0.5">Email terkirim! Cek inbox kamu.</p>
            : error
              ? <p className="text-xs font-medium text-red-500 mt-0.5">{error}</p>
              : <p className="text-sm font-semibold text-zinc-900 mt-0.5">Kirim link reset ke email</p>
          }
        </div>
      </div>
      {sent
        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        : (
          <button onClick={handleClick} disabled={isLoading}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {isLoading ? 'Mengirim...' : 'Kirim Email'}
          </button>
        )
      }
    </div>
  );
}