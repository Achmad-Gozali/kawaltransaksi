import type { Metadata } from 'next';
import Image from 'next/image';
import { RefreshCw, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Maintenance - KawalTransaksi',
  description: 'KawalTransaksi sedang dalam pemeliharaan. Kami akan segera kembali.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full text-center space-y-8">

        <div className="flex items-center justify-center gap-3">
          <Image src="/logo.png" alt="KawalTransaksi" width={44} height={44} className="rounded-xl" priority />
          <span className="text-base font-black tracking-tighter text-slate-900 uppercase">
            Kawal<span className="text-emerald-700">Transaksi</span>
          </span>
        </div>

        <div className="flex justify-center">
          <Image src="/maintenance.png" alt="Sedang Maintenance" width={380} height={380} priority />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Website Sedang Maintenance
          </h1>
          <p className="text-slate-500 text-base leading-relaxed">
            Kami sedang melakukan peningkatan sistem untuk memberikan pengalaman yang lebih baik untuk Anda.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-base text-slate-500">
          <span>Estimasi selesai: <span className="font-bold text-emerald-700">1 - 3 jam</span></span>
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="/maintenance" className="flex items-center gap-2 px-8 py-3.5 bg-emerald-700 text-white text-sm font-bold rounded-xl hover:bg-emerald-800 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh Halaman
          </a>
          <a href="mailto:kawaltransaksi@gmail.com" className="flex items-center gap-2 px-8 py-3.5 border-2 border-emerald-700 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-colors">
            <Mail className="w-4 h-4" />
            Hubungi Kami
          </a>
        </div>

        <p className="text-sm text-slate-400">
          Terima kasih atas pengertian dan kesabaran Anda.
        </p>

      </div>
    </div>
  );
}