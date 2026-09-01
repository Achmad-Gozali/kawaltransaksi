'use client';

// ============================================
//  LOKASI: frontend/components/ReportLanding.tsx
// ============================================

import Link from 'next/link';
import { UserRound, UserRoundPlus, LogIn, FileText, Send } from 'lucide-react';

const steps = [
  {
    icon: LogIn,
    title: 'Masuk untuk Melapor',
    desc: 'Sebelum melapor, pastikan Anda sudah masuk ke akun KawalTransaksi. Belum punya akun? Daftar sekarang, gratis.',
  },
  {
    icon: FileText,
    title: 'Isi Formulir Laporan',
    desc: 'Laporkan nomor HP, rekening bank, e-wallet, atau QRIS yang diduga dipakai pelaku penipuan. Isi formulir dengan informasi yang sebenar-benarnya.',
  },
  {
    icon: Send,
    title: 'Kirim Laporan',
    desc: 'Setelah semua kolom pada formulir terisi, klik tombol "Kirim Laporan" untuk mengirim laporan ke tim moderator.',
  },
];

const explanations = [
  {
    title: 'Lapor Penipuan Online',
    desc: 'Pernah tertipu saat belanja online? Laporkan lewat KawalTransaksi supaya tidak ada lagi korban dari penjual yang sama. Dengan melaporkan penipuan, Anda ikut membantu pengguna lain terhindar dari kejadian serupa.',
  },
  {
    title: 'Laporkan Rekening Penipu',
    desc: 'Anda bisa melaporkan nomor rekening bank yang pernah dipakai pemiliknya untuk menipu, baik online maupun offline. Setiap laporan yang masuk akan kami tinjau, dan rekening yang terbukti dipakai menipu akan masuk daftar hitam di sistem kami.',
  },
  {
    title: 'Melaporkan Nomor HP Penipu',
    desc: 'Untuk melaporkan seseorang terkait penipuan online, Anda cukup mengisi formulir di halaman ini. Setelah laporan dikirim dan ditinjau tim kami, nomor HP yang diduga dipakai menipu akan masuk daftar hitam dan bisa diperiksa oleh semua pengguna.',
  },
  {
    title: 'Laporkan E-Wallet Penipu',
    desc: 'Akun e-wallet seperti GoPay, DANA, OVO, ShopeePay, atau LinkAja yang dipakai untuk menipu juga bisa dilaporkan. Sertakan nomor atau nama akun beserta bukti transaksinya, dan setelah ditinjau, akun tersebut akan masuk daftar hitam di sistem kami.',
  },
  {
    title: 'Laporkan QRIS Penipu',
    desc: 'Kalau Anda menemukan kode QRIS yang dipakai untuk penipuan, unggah foto kode QRIS-nya lewat formulir ini. Sistem akan membaca data merchant (NMID, nama, dan kota) secara otomatis, lalu laporan ditinjau tim kami sebelum dipublikasikan ke basis data.',
  },
  {
    title: 'Lapor Penipuan Transaksi Online',
    desc: 'Kalau Anda pernah menjadi korban penipuan saat bertransaksi online, Anda bisa melaporkan kejadiannya lewat KawalTransaksi supaya tidak ada korban berikutnya dari pelaku yang sama.',
  },
];

export default function ReportLanding() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO SECTION (abu) ── */}
      <section className="relative bg-slate-100 pt-12 sm:pt-20 pb-0 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-[1.25fr_1fr] gap-10 lg:gap-16 items-start">

            {/* Kiri: Judul + Steps */}
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-3 text-balance">
                  Laporkan Nomor HP, Rekening, E&#8209;Wallet &amp; QRIS Penipuan
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                  Laporan Anda sangat berarti untuk mencegah penipuan berikutnya oleh pelaku yang sama. Bersama-sama, kita bisa melindungi lebih banyak orang.
                </p>
              </div>

              <div className="space-y-6">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-semibold text-slate-900 mb-1">{step.title}</p>
                        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kanan: Card Login/Register */}
            <div className="lg:sticky lg:top-8">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 text-center">
                  <p className="text-base font-semibold text-slate-900">Masuk ke Akun Terlebih Dahulu</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Anda perlu masuk ke akun KawalTransaksi dulu sebelum bisa membuat laporan.
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-slate-200 rounded-xl p-4 text-center hover:border-slate-300 transition-colors">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <UserRound className="w-5 h-5 text-slate-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mb-0.5">Masuk</p>
                      <p className="text-[11px] text-slate-400 leading-snug mb-3">Masuk ke akun KawalTransaksi yang Anda miliki.</p>
                      <Link
                        href="/login?redirectTo=/report"
                        className="w-full inline-flex items-center justify-center py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Masuk
                      </Link>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 text-center hover:border-slate-300 transition-colors">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <UserRoundPlus className="w-5 h-5 text-slate-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mb-0.5">Daftar</p>
                      <p className="text-[11px] text-slate-400 leading-snug mb-3">Buat akun KawalTransaksi Anda sekarang, gratis.</p>
                      <Link
                        href="/register?redirectTo=/report"
                        className="w-full inline-flex items-center justify-center py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        Daftar
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">atau</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <Link
                    href="/login?redirectTo=/report"
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Lanjutkan dengan Google
                  </Link>
                </div>

                <div className="px-6 pb-5 text-center">
                  <p className="text-[11px] text-slate-400">
                    Dengan mengirim laporan, Anda menyetujui{' '}
                    <Link href="/syarat-ketentuan" className="text-emerald-600 hover:underline font-medium">Syarat & Ketentuan</Link>
                    {' '}dan{' '}
                    <Link href="/kebijakan-privasi" className="text-emerald-600 hover:underline font-medium">Kebijakan Privasi</Link>
                    {' '}KawalTransaksi.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Wave abu → putih */}
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 sm:h-20 block">
          <path d="M0,20 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#ffffff" />
        </svg>
      </section>

      {/* ── PENJELASAN SECTION (putih) ── */}
      <section className="bg-white py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-x-16 gap-y-10">
            {explanations.map((item, i) => (
              <div key={i}>
                <h3 className="text-base font-bold text-slate-900 mb-2.5">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}