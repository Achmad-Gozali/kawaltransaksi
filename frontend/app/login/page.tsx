import AuthForm from '@/components/AuthForm';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ShieldX } from 'lucide-react';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const isBanned = params.error === 'banned';
  const isOauthFailed = params.error === 'oauth_failed';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 px-4">

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-xs font-bold uppercase tracking-widest transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Kembali ke Beranda</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-[0.2em]">
          <ArrowRight className="w-3 h-3" />
          <span className="hidden sm:inline">Community Registry</span>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-[440px] py-16 sm:py-12">

        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-4">
            <Image
              src="/logo.png"
              alt="Logo KawalTransaksi"
              width={48}
              height={48}
              className="rounded-xl shadow-sm"
              priority
            />
            <div className="absolute -inset-1 bg-emerald-500/15 rounded-xl blur opacity-75" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">
            Masuk Portal.
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-xs">
            Gunakan kredensial terdaftar untuk mengakses database.
          </p>
        </div>

        {/* ── Error banner: Banned ── */}
        {isBanned && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <ShieldX className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800 mb-0.5">Akun Dinonaktifkan</p>
              <p className="text-xs text-red-600 leading-relaxed">
                Akun Anda telah dinonaktifkan oleh admin. Hubungi tim KawalTransaksi untuk informasi lebih lanjut.
              </p>
            </div>
          </div>
        )}

        {/* ── Error banner: OAuth failed ── */}
        {isOauthFailed && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldX className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 mb-0.5">Login Gagal</p>
              <p className="text-xs text-amber-600 leading-relaxed">
                Gagal masuk dengan Google. Silakan coba lagi.
              </p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-900/5 p-6 sm:p-8 relative overflow-hidden">
          {/* Top accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 rounded-t-2xl" />

          <AuthForm type="login" />

          {/* Footer link */}
          <div className="mt-7 pt-7 border-t border-slate-100 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Belum punya akses?
            </p>
            <Link
              href="/register"
              className="text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center justify-center gap-1 transition-colors"
            >
              Daftar Akun Kontributor <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          © 2026 Informatics Community Project
        </div>
      </div>
    </div>
  );
}