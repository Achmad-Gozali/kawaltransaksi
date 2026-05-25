'use client';

// ============================================
//  LOKASI: frontend/components/ReportLanding.tsx
// ============================================

import Link from 'next/link';
import { UserRound, UserRoundPlus, LogIn, FileText, Send } from 'lucide-react';

const steps = [
  {
    icon: LogIn,
    title: 'Login Untuk Melapor',
    desc: 'Sebelum melapor, pastikan kamu sudah login ke akun KawalTransaksi. Belum punya akun? Daftar sekarang, gratis!',
  },
  {
    icon: FileText,
    title: 'Isi Form Laporan',
    desc: 'Laporkan nomor rekening atau nomor telepon terduga pelaku penipuan. Isi formulir dengan informasi sebenar-benarnya.',
  },
  {
    icon: Send,
    title: 'Kirim Laporan',
    desc: 'Setelah semua bidang dalam formulir kamu isi, klik tombol "Kirim Laporan" untuk mengirimkan laporan ke tim moderator.',
  },
];

const explanations = [
  {
    title: 'Lapor Penipuan Online',
    desc: 'Pernah tertipu ketika berbelanja online? Laporkan saja di KawalTransaksi agar tidak ada lagi korban yang tertipu oleh penjual yang sama. Dengan melaporkan penipuan, kamu turut membantu sesama pengguna online terhindar dari ancaman yang sama.',
  },
  {
    title: 'Laporkan Rekening Penipu',
    desc: 'Kamu dapat melaporkan nomor rekening bank milik seseorang yang pernah disalahgunakan oleh pemiliknya untuk penipuan, baik online maupun offline. Laporan yang masuk akan kami tinjau dan nomor rekening terbukti penipu akan diblacklist di sistem kami.',
  },
  {
    title: 'Melaporkan Nomor HP Penipu',
    desc: 'Untuk dapat melaporkan seseorang terkait penipuan online, kamu hanya perlu mengisi form yang ada pada halaman ini. Setelah laporan dikirim dan ditinjau oleh tim kami, nomor HP terduga penipu akan diblacklist dan bisa dicek oleh seluruh pengguna.',
  },
  {
    title: 'Lapor Penipuan Transaksi Online',
    desc: 'Jika kamu telah menjadi korban penipuan ketika bertransaksi secara online, kamu dapat melaporkan kejadian tersebut di KawalTransaksi agar tidak ada lagi korban selanjutnya oleh penipu yang sama.',
  },
];

export default function ReportLanding() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* -- HERO SECTION -- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Kiri: Judul + Steps */}
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-3">
                Laporkan Nomor Rekening Atau<br className="hidden sm:block" /> Nomor Telepon Penipuan
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                Laporan kamu sangat berarti untuk mencegah terjadinya penipuan di masa mendatang oleh pelaku yang sama. Bersama kita bisa melindungi lebih banyak orang.
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
                <p className="text-base font-semibold text-slate-900">Masuk Akun Dulu!</p>
                <p className="text-sm text-slate-400 mt-1">
                  Kamu perlu login ke akun KawalTransaksi terlebih dahulu untuk mulai membuat laporan.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded-xl p-4 text-center hover:border-slate-300 transition-colors">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <UserRound className="w-5 h-5 text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">Login</p>
                    <p className="text-[11px] text-slate-400 leading-snug mb-3">Login ke akun KawalTransaksi yang kamu miliki.</p>
                    <Link
                      href="/login?redirectTo=/report"
                      className="w-full inline-flex items-center justify-center py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Login
                    </Link>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 text-center hover:border-slate-300 transition-colors">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <UserRoundPlus className="w-5 h-5 text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">Daftar</p>
                    <p className="text-[11px] text-slate-400 leading-snug mb-3">Buat akun KawalTransaksi kamu sekarang, gratis!</p>
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
                  Dengan melaporkan, kamu menyetujui{' '}
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

      {/* -- PENJELASAN SECTION -- mirip Kredibel -- */}
      <div className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid sm:grid-cols-2 gap-x-16 gap-y-10">
            {explanations.map((item, i) => (
              <div key={i}>
                <h3 className="text-base font-bold text-slate-900 mb-2.5">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
