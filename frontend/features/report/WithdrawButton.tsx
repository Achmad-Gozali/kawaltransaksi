'use client';

// ============================================
// 📁 LOKASI: frontend/components/WithdrawButton.tsx
// ✅ FIX — standardize BACKEND_URL: throw jika tidak ada (sama kayak ReportForm)
// ============================================

import { useState } from 'react';
import { Loader2, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) throw new Error('NEXT_PUBLIC_BACKEND_URL is not defined');
  return url;
})();

interface WithdrawButtonProps {
  reportId: string;
}

export default function WithdrawButton({ reportId }: WithdrawButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleWithdraw = async () => {
    if (!confirm('Tarik laporan ini? Status akan berubah menjadi "Sedang Direvisi" dan kamu bisa edit lagi.')) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Sesi habis. Silakan login ulang.'); return; }

      const res = await fetch(`${BACKEND_URL}/api/reports/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reportId }),
      });

      const data = await res.json() as { success: boolean; message?: string };
      if (!data.success) { setError(data.message ?? 'Gagal menarik laporan.'); return; }

      router.refresh();
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleWithdraw}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />}
        {loading ? 'Memproses...' : 'Tarik Laporan'}
      </button>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}