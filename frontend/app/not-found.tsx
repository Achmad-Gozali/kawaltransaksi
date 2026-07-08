import Image from 'next/image';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10 text-center">
      <Image src="/404.not.png" alt="404 - Halaman tidak ditemukan" width={600} height={600} className="w-72 sm:w-96 md:w-[500px] lg:w-[600px] object-contain" priority />
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2 mb-2">Ups, salah jalan!</h1>
      <p className="text-slate-400 text-sm sm:text-base max-w-sm leading-relaxed mb-6">Halaman yang kamu cari tidak ada atau sudah dipindahkan. Pastikan URL yang kamu masukkan sudah benar.</p>
      <Link href="/" className="flex items-center gap-2 px-8 py-3.5 bg-emerald-700 text-white text-sm font-bold rounded-xl hover:bg-emerald-800 transition-colors">
        <Home className="w-4 h-4" />
        Kembali ke Beranda
      </Link>
    </div>
  );
}