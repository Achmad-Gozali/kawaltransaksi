import AuthForm from '@/components/AuthForm';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Blob decorations */}
      <div className="pointer-events-none select-none absolute -top-32 -left-32 w-96 h-96 bg-emerald-200 rounded-full opacity-20 blur-3xl" />
      <div className="pointer-events-none select-none absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-300 rounded-full opacity-15 blur-3xl" />
      <div className="pointer-events-none select-none absolute top-1/2 left-1/4 w-64 h-64 bg-teal-200 rounded-full opacity-10 blur-3xl" />

      {/* Mobile only back button */}
      <div className="w-full max-w-sm mb-4 lg:hidden">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </Link>
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/logo.png" alt="KawalTransaksi" width={32} height={32} className="rounded-lg" priority />
          <span className="font-bold text-slate-800 text-lg">KawalTransaksi</span>
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

        {/* Login link */}
        <div className="mt-5 text-center">
          <p className="text-sm text-gray-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1">
              Login di sini <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-400">© 2026 Informatics Community Project</p>
      </div>
    </div>
  );
}