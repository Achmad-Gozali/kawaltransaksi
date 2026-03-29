// ============================================
// 📁 LOKASI: app/edukasi/page.tsx
// ✅ FIX:
//    1. Branding konsisten: KawalTransaksi
//    2. Stats section -mt-6 diperbaiki agar tidak overlap di mobile
// ============================================

import Link from 'next/link';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  CreditCard,
  Gift,
  PhoneCall,
  Globe,
  MessageSquare,
  Landmark,
  TrendingUp,
  UserX,
} from 'lucide-react';
import type { Metadata } from 'next';

// ✅ FIX: Branding
export const metadata: Metadata = {
  title: 'Edukasi Modus Penipuan - KawalTransaksi',
  description:
    'Pelajari berbagai modus penipuan online di Indonesia dan cara melindungi diri dari scam, phishing, investasi bodong, dan modus lainnya.',
};

const modusData = [
  {
    slug: 'jual-beli-online',
    icon: CreditCard,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    iconBg: 'bg-blue-100',
    title: 'Penipuan Jual Beli Online',
    summary:
      'Modus paling umum di Indonesia. Penipu menjual barang di marketplace atau media sosial dengan harga murah, setelah korban transfer uang, barang tidak dikirim.',
    redFlags: [
      'Harga jauh di bawah pasaran',
      'Minta transfer ke rekening pribadi, bukan lewat marketplace',
      'Menolak COD atau rekening bersama',
      'Akun baru dengan sedikit review',
      'Memaksa korban untuk cepat transfer',
    ],
    tips: [
      'Selalu gunakan fitur pembayaran resmi marketplace',
      'Cek reputasi dan review penjual',
      'Gunakan rekening bersama untuk transaksi di luar marketplace',
      'Jangan tergiur harga yang terlalu murah',
    ],
    example:
      'Penipu posting iPhone 15 Pro Max seharga Rp 5 juta di Facebook. Setelah korban transfer, penipu blokir nomor dan menghilang.',
  },
  {
    slug: 'investasi-bodong',
    icon: TrendingUp,
    iconBg: 'bg-red-100',
    title: 'Investasi Bodong',
    summary:
      'Menjanjikan keuntungan besar dalam waktu singkat. Biasanya menggunakan skema ponzi — membayar investor lama dari uang investor baru sampai akhirnya kolaps.',
    redFlags: [
      'Menjanjikan return tetap 10-50% per bulan',
      'Tidak terdaftar di OJK',
      'Tekanan untuk mengajak orang lain bergabung',
      'Tidak jelas produk investasinya apa',
      'Testimoni palsu dari "investor sukses"',
    ],
    tips: [
      'Cek legalitas di website OJK (ojk.go.id)',
      'Ingat: high return = high risk, kalau terlalu bagus pasti palsu',
      'Jangan invest uang yang tidak siap hilang',
      'Waspadai skema MLM berkedok investasi',
    ],
    example:
      'Aplikasi "TradingPro" menjanjikan profit 30% per bulan dari trading forex. Setelah 3 bulan dan ribuan korban, aplikasi tiba-tiba tidak bisa diakses.',
  },
  {
    slug: 'phishing-soceng',
    icon: Globe,
    iconBg: 'bg-purple-100',
    title: 'Phishing & Social Engineering',
    summary:
      'Penipu berpura-pura menjadi pihak bank, e-commerce, atau instansi resmi untuk mencuri data pribadi seperti password, PIN, OTP, atau nomor kartu kredit.',
    redFlags: [
      'SMS/email berisi link mencurigakan',
      'Mengaku dari bank dan meminta OTP',
      'Website palsu yang mirip website resmi',
      'Meminta data pribadi lewat telepon',
      'Ancaman akun akan diblokir jika tidak segera bertindak',
    ],
    tips: [
      'Bank tidak pernah meminta OTP, PIN, atau password',
      'Selalu cek URL website — pastikan domain resmi',
      'Jangan klik link dari SMS/email yang tidak dikenal',
      'Aktifkan 2FA di semua akun penting',
    ],
    example:
      'Korban menerima SMS "BCA: Akun Anda terblokir, klik link berikut untuk verifikasi". Link mengarah ke website palsu yang mencuri username dan password.',
  },
  {
    slug: 'undian-palsu',
    icon: Gift,
    iconBg: 'bg-amber-100',
    title: 'Undian & Hadiah Palsu',
    summary:
      'Korban diberitahu memenangkan undian atau hadiah besar, lalu diminta membayar "pajak" atau "biaya admin" terlebih dahulu untuk menerima hadiah.',
    redFlags: [
      'Anda tidak pernah mengikuti undian tersebut',
      'Diminta transfer uang untuk "pajak hadiah"',
      'Menggunakan nama perusahaan besar (Telkomsel, Shopee, dll)',
      'Menghubungi lewat WhatsApp bukan channel resmi',
      'Memberikan tekanan waktu untuk segera bayar',
    ],
    tips: [
      'Tidak ada undian yang meminta korban bayar duluan',
      'Verifikasi ke channel resmi perusahaan yang disebutkan',
      'Blokir dan laporkan nomor pengirim',
      'Jangan bagikan data pribadi ke nomor yang tidak dikenal',
    ],
    example:
      'Pesan WhatsApp: "Selamat! Anda memenangkan Rp 50 juta dari Shopee! Transfer Rp 500.000 untuk biaya pajak ke rekening berikut."',
  },
  {
    slug: 'pinjaman-online-ilegal',
    icon: Landmark,
    iconBg: 'bg-emerald-100',
    title: 'Pinjaman Online Ilegal',
    summary:
      'Aplikasi pinjaman yang tidak terdaftar di OJK. Memberikan pinjaman dengan bunga sangat tinggi, lalu melakukan intimidasi dan teror ke peminjam dan kontaknya.',
    redFlags: [
      'Tidak terdaftar di OJK',
      'Proses pencairan sangat cepat tanpa verifikasi',
      'Bunga harian sangat tinggi (1-2% per hari)',
      'Mengakses semua kontak di HP peminjam',
      'Melakukan teror dan ancaman via telepon',
    ],
    tips: [
      'Cek daftar pinjol legal di website OJK',
      'Baca syarat dan ketentuan sebelum meminjam',
      'Jangan berikan akses kontak dan galeri ke aplikasi',
      'Laporkan ke OJK jika mengalami intimidasi',
    ],
    example:
      'Aplikasi "DanaCepat" memberikan pinjaman Rp 1 juta tapi yang diterima hanya Rp 700.000. Dalam 7 hari harus bayar Rp 1.400.000. Jika telat, semua kontak diteror.',
  },
  {
    slug: 'penipuan-telepon',
    icon: PhoneCall,
    iconBg: 'bg-orange-100',
    title: 'Penipuan via Telepon',
    summary:
      'Penipu menelepon mengaku sebagai polisi, jaksa, atau petugas bank. Mengklaim korban terlibat kasus hukum atau punya tunggakan, lalu meminta transfer uang.',
    redFlags: [
      'Mengaku dari kepolisian atau kejaksaan',
      'Menyebut korban terlibat kasus pencucian uang',
      'Meminta transfer ke rekening pribadi',
      'Memberikan tekanan dan ancaman',
      'Melarang korban menghubungi pihak lain',
    ],
    tips: [
      'Polisi dan jaksa tidak pernah meminta uang lewat telepon',
      'Tutup telepon dan verifikasi ke kantor polisi terdekat',
      'Jangan panik — penipu memanfaatkan rasa takut korban',
      'Catat nomor penelepon dan laporkan',
    ],
    example:
      'Penelepon mengaku Jaksa dan mengatakan korban terlibat kasus narkoba. Diminta transfer Rp 25 juta untuk "biaya penghentian penyidikan".',
  },
  {
    slug: 'love-scam',
    icon: UserX,
    iconBg: 'bg-pink-100',
    title: 'Romance Scam (Love Scam)',
    summary:
      'Penipu membangun hubungan romantis online dengan korban selama berminggu-minggu, lalu mulai meminta uang dengan berbagai alasan darurat.',
    redFlags: [
      'Kenalan di dating app atau media sosial',
      'Profil terlalu sempurna (foto model, karir sukses)',
      'Selalu menolak video call',
      'Mulai minta uang setelah hubungan terasa dekat',
      'Alasan darurat: sakit, kecelakaan, bisnis rugi',
    ],
    tips: [
      'Jangan pernah kirim uang ke orang yang belum pernah ditemui langsung',
      'Reverse image search foto profil mereka',
      'Waspadai hubungan online yang berkembang terlalu cepat',
      'Ceritakan ke teman/keluarga untuk perspektif objektif',
    ],
    example:
      'Korban berkenalan dengan "dokter dari London" di Instagram. Setelah 2 bulan chat setiap hari, dia minta Rp 15 juta untuk "biaya customs paket hadiah dari luar negeri".',
  },
  {
    slug: 'modus-kurir',
    icon: MessageSquare,
    iconBg: 'bg-teal-100',
    title: 'Modus File APK / Kurir Paket',
    summary:
      'Penipu mengirim file APK berbahaya lewat WhatsApp yang disamarkan sebagai foto paket, undangan pernikahan, atau surat tilang. Jika di-install, malware mencuri data perbankan.',
    redFlags: [
      'Pesan dari nomor tidak dikenal',
      'File berekstensi .apk (bukan .jpg atau .pdf)',
      'Mengaku kurir dan meminta "konfirmasi paket"',
      'Undangan pernikahan digital dari orang tidak dikenal',
      'Surat tilang elektronik palsu',
    ],
    tips: [
      'Jangan pernah install file APK dari WhatsApp',
      'Cek ekstensi file — foto asli berakhiran .jpg/.png',
      'Matikan "Install dari sumber tidak dikenal" di HP',
      'Jika sudah terlanjur install, segera factory reset HP',
    ],
    example:
      'Pesan WA: "Paket Anda sudah sampai, cek resi di sini" disertai file "Resi_J&T.apk". Jika di-install, saldo m-banking korban terkuras.',
  },
];

export default function EdukasiPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Bar */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-5 sm:mb-6">
            <ShieldAlert className="w-3 h-3" />
            Edukasi
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-3 sm:mb-4">
            Kenali Modus Penipuan
          </h1>
          <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed px-2">
            Pelajari berbagai modus penipuan yang marak di Indonesia dan cara
            melindungi diri Anda serta keluarga.
          </p>
        </div>
      </div>

      {/* Quick Stats — ✅ FIX: Responsive, no overlap di mobile */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:-mt-4 sm:py-0 sm:mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Modus Terdokumentasi', value: `${modusData.length}+` },
            { label: 'Korban per Tahun (est.)', value: '300K+' },
            { label: 'Kerugian Nasional', value: 'Rp 18T+' },
            { label: 'Kasus Dilaporkan', value: '180K+' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white border border-zinc-200 rounded-xl p-4 text-center shadow-sm"
            >
              <p className="text-xl sm:text-2xl font-extrabold text-zinc-900">
                {stat.value}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modus Cards */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        <div className="space-y-6">
          {modusData.map((modus, i) => {
            const Icon = modus.icon;
            return (
              <div
                key={modus.slug}
                id={modus.slug}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Card Header */}
                <div className="p-6 sm:p-8 border-b border-zinc-100">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 ${modus.iconBg} rounded-xl flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          #{String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight mb-2">
                        {modus.title}
                      </h2>
                      <p className="text-sm text-zinc-500 leading-relaxed">
                        {modus.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                        Tanda-Tanda Bahaya
                      </h3>
                    </div>
                    <div className="space-y-2.5">
                      {modus.redFlags.map((flag, j) => (
                        <div key={j} className="flex items-start gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <p className="text-sm text-zinc-600 leading-relaxed">
                            {flag}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                        Cara Melindungi Diri
                      </h3>
                    </div>
                    <div className="space-y-2.5">
                      {modus.tips.map((tip, j) => (
                        <div key={j} className="flex items-start gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <p className="text-sm text-zinc-600 leading-relaxed">
                            {tip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Example */}
                <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Contoh Kasus
                    </p>
                    <p className="text-sm text-zinc-600 leading-relaxed italic">
                      &quot;{modus.example}&quot;
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-zinc-900 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
            Sudah Jadi Korban?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Laporkan nomor penipu ke database kami untuk membantu melindungi
            orang lain dari modus yang sama.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/report"
              className="px-8 py-3.5 bg-white text-zinc-900 font-bold text-sm rounded-xl hover:bg-zinc-100 transition-all active:scale-95"
            >
              Buat Laporan
            </Link>
            <Link
              href="/"
              className="px-8 py-3.5 bg-zinc-800 text-zinc-300 font-bold text-sm rounded-xl border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
            >
              Cek Nomor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}