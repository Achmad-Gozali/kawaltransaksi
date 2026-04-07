import Link from 'next/link';
import { Home, Phone, Landmark, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">

      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-20 text-center">

        {/* Big 404 */}
        <div className="relative mb-8 select-none">
          <p className="text-[120px] sm:text-[180px] font-black tracking-tighter leading-none text-slate-100 uppercase">
            404
          </p>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-[10px] font-bold text-red-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Halaman tidak ditemukan
            </span>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-slate-900 mb-3">
          Ups, salah jalan!
        </h1>
        <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed mb-10">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          Pastikan URL yang kamu masukkan sudah benar.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Kembali ke Beranda
          </Link>
          <Link
            href="/cek-nomor"
            className="flex items-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest rounded-xl hover:border-slate-900 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" /> Cek Nomor HP
          </Link>
          <Link
            href="/cek-rekening"
            className="flex items-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest rounded-xl hover:border-slate-900 transition-colors"
          >
            <Landmark className="w-3.5 h-3.5" /> Cek Rekening
          </Link>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-slate-200 mx-auto mb-8" />

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
        </Link>

      </div>

      {/* Bottom watermark */}
      <div className="py-6 text-center border-t border-slate-100">
        <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">
          KawalTransaksi · Transaksi Aman, Hati Tenang
        </p>
      </div>

    </div>
  );
}