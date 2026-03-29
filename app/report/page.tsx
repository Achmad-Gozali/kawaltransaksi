// ============================================
// 📁 LOKASI: app/report/page.tsx
// ============================================

import ReportForm from '@/components/ReportForm';
import { createClient } from '@/lib/supabase-server';
import {
  ShieldAlert, Info, Scale, FileText, Clock,
  LogIn, UserPlus, Shield, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ===== GATEWAY — belum login =====
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* LEFT — Penjelasan */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                <ShieldAlert className="w-3 h-3" />
                Formulir Laporan
              </div>
              <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-4 leading-tight">
                Laporkan Nomor<br />Penipu Online
              </h1>
              <p className="text-zinc-500 text-base leading-relaxed mb-10">
                Laporan kamu sangat berarti untuk mencegah orang lain menjadi korban pelaku yang sama. Masuk atau daftar dulu untuk mulai melapor.
              </p>

              {/* Steps */}
              <div className="space-y-7">
                {[
                  {
                    icon: LogIn,
                    title: 'Login untuk Melapor',
                    desc: 'Sebelum melapor, pastikan kamu sudah masuk ke akun CekNoScam. Bila belum punya akun, daftar sekarang — gratis!',
                  },
                  {
                    icon: FileText,
                    title: 'Isi Form Laporan',
                    desc: 'Laporkan nomor HP atau rekening bank terduga penipu. Isi formulir dengan informasi sejelas-jelasnya.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Kirim & Tunggu Verifikasi',
                    desc: 'Laporan kamu akan diverifikasi moderator dalam 1×24 jam, lalu tampil di database publik.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 shrink-0 bg-zinc-900 rounded-xl flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 mb-1">{item.title}</p>
                      <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legal note */}
              <div className="mt-10 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <Scale className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Laporan palsu atau pencemaran nama baik dapat berakibat pemblokiran akun permanen dan konsekuensi hukum sesuai UU ITE.
                </p>
              </div>
            </div>

            {/* RIGHT — Gateway cards */}
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 rounded-2xl mb-4">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-extrabold text-zinc-900 mb-1.5">Masuk ke Akun Dulu!</h2>
                <p className="text-sm text-zinc-500">
                  Kamu perlu login atau daftar terlebih dahulu untuk mulai membuat laporan.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Login card */}
                <div className="border border-zinc-200 rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-zinc-400 transition-all">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-zinc-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Masuk</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Sudah punya akun CekNoScam</p>
                  </div>
                  <Link
                    href="/login?redirectTo=%2Freport"
                    className="w-full py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all text-center active:scale-95"
                  >
                    Masuk
                  </Link>
                </div>

                {/* Register card */}
                <div className="border border-zinc-200 rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-zinc-400 transition-all">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-zinc-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Daftar</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Buat akun baru, gratis!</p>
                  </div>
                  <Link
                    href="/register"
                    className="w-full py-2.5 bg-white text-zinc-900 text-sm font-bold rounded-xl border border-zinc-300 hover:border-zinc-900 transition-all text-center active:scale-95"
                  >
                    Daftar
                  </Link>
                </div>
              </div>

              <p className="text-center text-xs text-zinc-400">
                Dengan masuk, kamu menyetujui{' '}
                <Link href="/syarat-ketentuan" className="underline underline-offset-2 hover:text-zinc-700">
                  Syarat & Ketentuan
                </Link>{' '}
                kami.
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ===== FORM — sudah login =====
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            <ShieldAlert className="w-3 h-3" />
            Formulir Laporan
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">
            Laporkan Penipuan
          </h1>
          <p className="text-zinc-500 text-lg leading-relaxed">
            Bantu lindungi komunitas dengan melaporkan nomor penipu. Setiap laporan akan diverifikasi oleh tim moderator.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 sm:p-10">
              <ReportForm />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em] mb-5">Cara Kerja</h4>
              <div className="space-y-5">
                {[
                  { icon: FileText, title: 'Isi Formulir', desc: 'Lengkapi data nomor target dan kronologi kejadian.' },
                  { icon: Clock, title: 'Proses Review', desc: 'Tim moderator akan memverifikasi laporan Anda dalam 1×24 jam.' },
                  { icon: ShieldAlert, title: 'Terpublikasi', desc: 'Laporan terverifikasi akan tampil di database publik.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3.5">
                    <div className="w-8 h-8 shrink-0 bg-zinc-900 rounded-lg flex items-center justify-center">
                      <item.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 mb-0.5">{item.title}</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                  <Info className="w-3.5 h-3.5 text-white" />
                </div>
                <h4 className="text-xs font-extrabold uppercase tracking-[0.15em]">Fitur AI</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Gunakan fitur <span className="text-white font-semibold">Analisis AI</span> untuk memindai keaslian bukti screenshot dan mendeteksi pola penipuan dari kronologi Anda secara otomatis.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-[0.15em]">Peringatan Hukum</h4>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Laporan palsu atau pencemaran nama baik dapat berakibat pemblokiran akun permanen dan konsekuensi hukum sesuai UU ITE yang berlaku.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}