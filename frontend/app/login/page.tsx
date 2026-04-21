import AuthForm from '@/components/AuthForm';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, Users, FileSearch, ArrowRight, ShieldX } from 'lucide-react';

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
    <div className="min-h-screen bg-white flex">

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="KawalTransaksi" width={36} height={36} className="rounded-lg" priority />
          <span className="font-bold text-lg text-slate-800">KawalTransaksi</span>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-3">
              Platform pengawasan<br />transaksi digital Indonesia.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Bersama kami, lindungi dirimu dan orang lain dari penipuan online. Setiap laporan yang kamu buat membantu ribuan orang menghindari kejahatan digital.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Cek Rekening & E-Wallet</p>
                <p className="text-xs text-slate-500 mt-0.5">Verifikasi nomor rekening atau dompet digital sebelum melakukan transaksi.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <FileSearch className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Database Laporan Terverifikasi</p>
                <p className="text-xs text-slate-500 mt-0.5">Akses ribuan laporan penipuan yang telah diverifikasi oleh komunitas.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Komunitas Aktif</p>
                <p className="text-xs text-slate-500 mt-0.5">Bergabung bersama ribuan kontributor yang aktif melaporkan penipuan.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400">© 2026 Informatics Community Project</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 bg-white">

        {/* Mobile back button */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali
          </Link>
        </div>

        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Image src="/logo.png" alt="KawalTransaksi" width={28} height={28} className="rounded-md" priority />
            <span className="font-bold text-slate-800">KawalTransaksi</span>
          </div>

          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Login</h1>
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

          {/* Sudah punya akun - di luar card tapi deket */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1">
                Daftar sekarang <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}