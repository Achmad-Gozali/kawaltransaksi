import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Maintenance - KawalTransaksi',
  description: 'KawalTransaksi sedang dalam pemeliharaan. Kami akan segera kembali.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-6">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5">
          <Image src="/logo.png" alt="KawalTransaksi" width={36} height={36} className="rounded-lg" priority />
          <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">
            Kawal<span className="text-emerald-700">Transaksi</span>
          </span>
        </div>

        {/* Illustration */}
        <div className="flex justify-center">
          <Image
            src="/maintenance.png"
            alt="Sedang Maintenance"
            width={300}
            height={300}
            priority
          />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Website Sedang Maintenance
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Kami sedang melakukan peningkatan sistem untuk memberikan
            pengalaman yang lebih baik untuk Anda.
          </p>
        </div>

        {/* Estimasi */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <span>🕐</span>
          <span>Estimasi selesai: <span className="font-bold text-emerald-700">30 - 60 menit</span></span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white text-sm font-bold rounded-xl hover:bg-emerald-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Halaman
          </button>
          
          <a
            href="mailto:kawaltransaksi@gmail.com"
            className="flex items-center gap-2 px-6 py-3 border-2 border-emerald-700 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Hubungi Kami
          </a>
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-400">
          Terima kasih atas pengertian dan kesabaran Anda. 🤍
        </p>

      </div>
    </div>
  );
}