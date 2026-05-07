import type { Metadata } from 'next';
import Image from 'next/image';
import { RefreshCw, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Maintenance - KawalTransaksi',
  description: 'KawalTransaksi sedang dalam pemeliharaan. Kami akan segera kembali.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-10">
        <div className="flex items-center justify-center gap-3">
          <Image src="/logo.png" alt="KawalTransaksi" width={48} height={48} className="rounded-xl" priority />
          <span className="text-lg font-black tracking-tighter text-slate-900 uppercase">Kawal<span className="text-emerald-700">Transaksi</span></span>
        </div>
        <div className="flex justify-center">
          <Image src="/maintenance.png" alt="Sedang Maintenance" width={440} height={440} priority />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Website Sedang Maintenance</h1>
          <p className="text-slate-500 text-lg leading-relaxed">Kami sedang melakukan peningkatan sistem untuk memberikan pengalaman yang lebih baik untuk Anda.</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-lg text-slate-500">
          <span>Estimasi selesai: <span className="font-bold text-emerald-700">1 - 3 jam</span></span>
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="/maintenance" className="flex items-center gap-2 px-10 py-4 bg-emerald-700 text-white text-base font-bold rounded-xl hover:bg-emerald-800 transition-colors"><RefreshCw className="w-5 h-5" />Refresh Halaman</a>
          <a href="https://wa.me/6282249244647?text=Halo%20KawalTransaksi%2C%20saya%20ingin%20menanyakan%20estimasi%20selesainya%20maintenance%20website.%20Terima%20kasih." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-10 py-4 border-2 border-emerald-700 text-emerald-700 text-base font-bold rounded-xl hover:bg-emerald-50 transition-colors"><MessageCircle className="w-5 h-5" />Hubungi Kami</a>
        </div>
        <p className="text-base text-slate-400">Terima kasih atas pengertian dan kesabaran Anda.</p>
      </div>
    </div>
  );
}