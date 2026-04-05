'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FilePen } from 'lucide-react';

interface WithdrawButtonProps {
  reportId: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function WithdrawButton({ reportId }: WithdrawButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleWithdraw = async () => {
    setIsLoading(true);
    try {
      // Ambil token dari Supabase
      const { createClient } = await import('@/lib/supabase-browser');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Sesi habis. Silakan login ulang.');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/reports/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reportId }),
      });

      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.message || 'Gagal mengajukan revisi.');
      }
    } catch {
      alert('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-zinc-500 font-medium">Tarik laporan untuk direvisi?</span>
        <button
          onClick={handleWithdraw}
          disabled={isLoading}
          className="px-3 py-1.5 bg-zinc-900 text-white text-[11px] font-bold rounded-lg hover:bg-black transition-all disabled:opacity-50 flex items-center gap-1"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ya, Ajukan'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isLoading}
          className="px-3 py-1.5 bg-zinc-100 text-zinc-600 text-[11px] font-bold rounded-lg hover:bg-zinc-200 transition-all"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-500 text-[11px] font-bold rounded-lg hover:bg-zinc-200 hover:text-zinc-900 transition-all"
    >
      <FilePen className="w-3 h-3" />
      Ajukan Revisi
    </button>
  );
}