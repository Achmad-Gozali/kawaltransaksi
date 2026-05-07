import type { Metadata } from 'next';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Maintenance - KawalTransaksi',
  description: 'KawalTransaksi sedang dalam pemeliharaan. Kami akan segera kembali.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image src="/logo.png" alt="KawalTransaksi" width={44} height={44} className="rounded-xl" priority />
          <span className="text-lg font-black tracking-tighter text-slate-900 uppercase">Kawal<span className="text-emerald-700">Transaksi</span></span>
        </div>
        <div className="flex justify-center mb-6">
          <Image src="/maintenance.png" alt="Sedang Maintenance" width={500} height={500} className="w-full max-w-xs sm:max-w-sm md:max-w-md object-contain" priority />
        </div>
        <div className="mb-3">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">Website Sedang Maintenance</h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed">Kami sedang melakukan peningkatan sistem untuk memberikan pengalaman yang lebih baik untuk Anda.</p>
        </div>
        <div className="text-sm sm:text-base text-slate-500 mb-6">
          <span>Estimasi selesai: <span className="font-bold text-emerald-700">1 - 3 jam</span></span>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
          <a href="/maintenance" className="flex items-center gap-2 px-7 py-3.5 bg-emerald-700 text-white text-sm sm:text-base font-bold rounded-xl hover:bg-emerald-800 transition-colors"><RefreshCw className="w-4 h-4" />Refresh Halaman</a>
          <a href="https://wa.me/6282249244647?text=Halo%20KawalTransaksi%2C%20saya%20ingin%20menanyakan%20estimasi%20selesainya%20maintenance%20website.%20Terima%20kasih." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-7 py-3.5 border-2 border-emerald-700 text-emerald-700 text-sm sm:text-base font-bold rounded-xl hover:bg-emerald-50 transition-colors"><FaWhatsapp className="w-4 h-4 text-green-500" />Hubungi Kami</a>
        </div>
        <p className="text-sm text-slate-400">Terima kasih atas pengertian dan kesabaran Anda.</p>
      </div>
    </div>
  );
}