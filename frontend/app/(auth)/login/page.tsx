import AuthForm from '@/features/auth/AuthForm';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldX } from 'lucide-react';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const params = await searchParams;
  const isBanned = params.error === 'banned';
  const isOauthFailed = params.error === 'oauth_failed';
  const isFromDatabase = params.redirectTo === '/laporan-publik';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Blob decorations */}
      <div className="pointer-events-none select-none absolute -top-32 -left-32 w-96 h-96 bg-emerald-200 rounded-full opacity-20 blur-3xl" />
      <div className="pointer-events-none select-none absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-300 rounded-full opacity-15 blur-3xl" />
      <div className="pointer-events-none select-none absolute top-1/2 left-1/4 w-64 h-64 bg-teal-200 rounded-full opacity-10 blur-3xl" />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/logo.png" alt="KawalTransaksi" width={32} height={32} className="rounded-lg" priority />
          <span className="font-bold text-slate-800 text-lg">KawalTransaksi</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Masuk</h1>
            <p className="text-sm text-gray-500">
              {isFromDatabase ? 'Masuk untuk mengakses seluruh laporan penipuan.' : 'Selamat datang kembali.'}
            </p>
          </div>

          {isBanned && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <ShieldX className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 mb-0.5">Akun Dinonaktifkan</p>
                <p className="text-xs text-red-600 leading-relaxed">Akun Anda telah dinonaktifkan oleh admin. Hubungi tim KawalTransaksi untuk info lebih lanjut.</p>
              </div>
            </div>
          )}

          {isOauthFailed && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <ShieldX className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-0.5">Login Gagal</p>
                <p className="text-xs text-amber-600">Gagal masuk dengan Google. Silakan coba lagi.</p>
              </div>
            </div>
          )}

          <AuthForm type="login" />
        </div>

        {/* Register link */}
        <div className="mt-5 text-center">
          <p className="text-sm text-gray-500">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1">
              Daftar sekarang <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-400">© 2026 Informatics Community Project</p>
      </div>
    </div>
  );
}