import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenance - KawalTransaksi',
  description: 'KawalTransaksi sedang dalam pemeliharaan. Kami akan segera kembali.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
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