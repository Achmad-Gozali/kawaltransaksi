'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { decodeQrisFromFile } from '@/core/qris';
import { encodeSlug } from '@/core/utils';

export default function QrisSearchForm() {
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState<string | null>(null);
  const router = useRouter();

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran file melebihi 5MB.'); return; }

    setIsDecoding(true);
    setError(null);
    setMerchantName(null);

    const result = await decodeQrisFromFile(file);

    if (!result.valid || !result.nmid || !result.payload) {
      setIsDecoding(false);
      setError(result.error ?? 'Gagal membaca QRIS dari foto ini.');
      return;
    }

    setMerchantName(result.merchantName ?? null);

    // Nama/kota merchant TIDAK dikirim mentah lewat query param -- siapa
    // pun bisa mengarang URL manual kalau begitu. Payload mentah divalidasi
    // ulang di server (parseQrisPayload()) dan hasilnya disimpan singkat di
    // balik token acak, jadi data yang muncul di halaman hasil dijamin
    // berasal dari QR yang matematis valid, bukan string bebas.
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/qris/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: result.payload }),
      });
      const body = await res.json();
      if (!res.ok || !body?.data?.token) {
        setIsDecoding(false);
        setError(body?.error ?? 'Gagal memverifikasi QRIS ke server.');
        return;
      }
      router.push(`/check/${encodeSlug(result.nmid)}?type=qris&token=${encodeURIComponent(body.data.token)}`);
    } catch {
      setIsDecoding(false);
      setError('Gagal terhubung ke server. Periksa koneksi dan coba lagi.');
    }
  };

  return (
    <div className="w-full max-w-lg space-y-3">
      <label className={`flex items-center gap-3 bg-white border-2 rounded-md px-4 py-3.5 transition-all cursor-pointer ${
        error ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200 hover:border-emerald-400'
      }`}>
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
          {isDecoding ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> : <Upload className="w-4 h-4 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {isDecoding ? 'Membaca kode QRIS...' : merchantName ? `Ditemukan: ${merchantName}` : 'Upload atau scan foto QRIS'}
          </p>
          <p className="text-xs text-slate-400">JPG, PNG - maks 5MB</p>
        </div>
        {merchantName && !isDecoding && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={isDecoding}
          onChange={e => handleFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
