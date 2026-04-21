import AuthForm from '@/components/AuthForm';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Heart, Lock, Zap } from 'lucide-react';

export default function RegisterPage() {
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
              Bergabung dan jadilah<br />bagian dari solusi.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Sebagai kontributor, kamu punya akses penuh untuk melaporkan dan memantau aktivitas penipuan digital di Indonesia.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Gratis Selamanya</p>
                <p className="text-xs text-slate-500 mt-0.5">Tidak ada biaya pendaftaran. Akses semua fitur tanpa bayar.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Data Aman & Terenkripsi</p>
                <p className="text-xs text-slate-500 mt-0.5">Informasi pribadimu terlindungi dengan enkripsi standar industri.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Dampak Nyata</p>
                <p className="text-xs text-slate-500 mt-0.5">Setiap laporanmu membantu orang lain terhindar dari penipuan.</p>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Buat Akun</h1>
              <p className="text-sm text-gray-500">Daftar gratis dan mulai berkontribusi.</p>
            </div>

            <AuthForm type="register" />

            <p className="mt-5 text-xs text-gray-400 text-center leading-relaxed">
              Dengan mendaftar, kamu menyetujui{' '}
              <Link href="/syarat-ketentuan" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Syarat & Ketentuan</Link>
              {' '}dan{' '}
              <Link href="/kebijakan-privasi" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Kebijakan Privasi</Link> kami.
            </p>
          </div>

          {/* Sudah punya akun - deket card */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1">
                Login di sini <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}