import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Maintenance - KawalTransaksi',
  description: 'KawalTransaksi sedang dalam pemeliharaan. Kami akan segera kembali.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5">

        {/* Image */}
        <div className="flex justify-center">
          <Image
            src="/maintenance.png"
            alt="Sedang Maintenance"
            width={280}
            height={280}
            priority
          />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sedang Maintenance
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Kami sedang melakukan pemeliharaan sistem untuk meningkatkan layanan.
            KawalTransaksi akan segera kembali. Mohon maaf atas ketidaknyamanannya.
          </p>
        </div>

        {/* Info */}
        <p className="text-xs text-slate-400 leading-relaxed pt-2">
          Butuh bantuan? Hubungi kami di{' '}
          <a href="mailto:kawaltransaksi@gmail.com" className="text-emerald-600 hover:underline font-medium">
            kawaltransaksi@gmail.com
          </a>
        </p>

        {/* Brand */}
        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest pt-2">
          KawalTransaksi © 2026
        </p>

      </div>
    </div>
  );
}