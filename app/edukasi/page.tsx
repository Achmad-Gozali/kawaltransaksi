// app/edukasi/page.tsx
import type { Metadata } from 'next';
import {
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Edukasi Modus Penipuan - KawalTransaksi',
  description:
    'Pelajari berbagai modus penipuan online di Indonesia dan cara melindungi diri dari scam, phishing, investasi bodong, dan modus lainnya.',
};

const modusData = [
  {
    slug: 'jual-beli-online',
    title: 'Penipuan jual beli online',
    summary:
      'Penipu menjual barang di marketplace atau media sosial dengan harga murah. Setelah korban transfer, barang tidak dikirim.',
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
  },
  {
    slug: 'investasi-bodong',
    title: 'Investasi bodong',
    summary:
      'Menjanjikan keuntungan besar dalam waktu singkat. Biasanya menggunakan skema ponzi yang akhirnya kolaps.',
    redFlags: [
      'Menjanjikan return tetap 10–50% per bulan',
      'Tidak terdaftar di OJK',
      'Tekanan untuk mengajak orang lain bergabung',
      'Tidak jelas produk investasinya apa',
      'Testimoni palsu dari "investor sukses"',
    ],
    tips: [
      'Cek legalitas di website OJK (ojk.go.id)',
      'Kalau terlalu bagus, pasti palsu',
      'Jangan invest uang yang tidak siap hilang',
      'Waspadai skema MLM berkedok investasi',
    ],
  },
  {
    slug: 'phishing-soceng',
    title: 'Phishing & social engineering',
    summary:
      'Penipu berpura-pura menjadi pihak bank atau instansi resmi untuk mencuri data seperti password, PIN, atau OTP.',
    redFlags: [
      'SMS/email berisi link mencurigakan',
      'Mengaku dari bank dan meminta OTP',
      'Website palsu yang mirip website resmi',
      'Meminta data pribadi lewat telepon',
      'Ancaman akun akan diblokir jika tidak segera bertindak',
    ],
    tips: [
      'Bank tidak pernah meminta OTP, PIN, atau password',
      'Selalu cek URL — pastikan domain resmi',
      'Jangan klik link dari SMS/email yang tidak dikenal',
      'Aktifkan 2FA di semua akun penting',
    ],
  },
  {
    slug: 'undian-palsu',
    title: 'Undian & hadiah palsu',
    summary:
      'Korban diberitahu memenangkan hadiah besar, lalu diminta membayar "pajak" atau "biaya admin" terlebih dahulu.',
    redFlags: [
      'Tidak pernah mengikuti undian tersebut',
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
  },
  {
    slug: 'pinjaman-online-ilegal',
    title: 'Pinjaman online ilegal',
    summary:
      'Aplikasi pinjaman tidak terdaftar OJK dengan bunga sangat tinggi, lalu melakukan intimidasi ke peminjam dan kontaknya.',
    redFlags: [
      'Tidak terdaftar di OJK',
      'Proses pencairan sangat cepat tanpa verifikasi',
      'Bunga harian sangat tinggi (1–2% per hari)',
      'Mengakses semua kontak di HP peminjam',
      'Melakukan teror dan ancaman via telepon',
    ],
    tips: [
      'Cek daftar pinjol legal di website OJK',
      'Baca syarat dan ketentuan sebelum meminjam',
      'Jangan berikan akses kontak dan galeri ke aplikasi',
      'Laporkan ke OJK jika mengalami intimidasi',
    ],
  },
  {
    slug: 'penipuan-telepon',
    title: 'Penipuan via telepon',
    summary:
      'Penipu menelepon mengaku sebagai polisi atau petugas bank, mengklaim korban terlibat kasus hukum lalu meminta transfer uang.',
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
  },
  {
    slug: 'love-scam',
    title: 'Romance scam',
    summary:
      'Penipu membangun hubungan romantis online berminggu-minggu, lalu meminta uang dengan berbagai alasan darurat.',
    redFlags: [
      'Profil terlalu sempurna (foto model, karir sukses)',
      'Selalu menolak video call',
      'Mulai minta uang setelah hubungan terasa dekat',
      'Alasan darurat: sakit, kecelakaan, bisnis rugi',
    ],
    tips: [
      'Jangan pernah kirim uang ke orang yang belum ditemui langsung',
      'Reverse image search foto profil mereka',
      'Waspadai hubungan online yang berkembang terlalu cepat',
      'Ceritakan ke teman/keluarga untuk perspektif objektif',
    ],
  },
  {
    slug: 'modus-apk',
    title: 'Modus file APK',
    summary:
      'Penipu mengirim file APK berbahaya via WhatsApp yang disamarkan sebagai resi kurir atau undangan. Jika diinstall, saldo rekening bisa terkuras.',
    redFlags: [
      'File berekstensi .apk dari nomor tidak dikenal',
      'Mengaku kurir dan meminta "konfirmasi paket"',
      'Undangan pernikahan digital dari orang tidak dikenal',
      'Surat tilang elektronik palsu',
    ],
    tips: [
      'Jangan pernah install file APK dari WhatsApp',
      'Foto asli berakhiran .jpg atau .png, bukan .apk',
      'Matikan "install dari sumber tidak dikenal" di HP',
      'Jika sudah terlanjur install, segera factory reset HP',
    ],
  },
];

export default function EdukasiPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Hero */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-10 text-center">
        <h1
          className="text-2xl font-bold text-slate-900 mb-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Kenali modus penipuan
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Pelajari berbagai modus penipuan yang marak di Indonesia dan cara melindungi diri kamu serta keluarga.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-3">
        {modusData.map((modus, i) => (
          <div
            key={modus.slug}
            id={modus.slug}
            className="bg-white rounded-[8px] border border-slate-200/80 overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.12em] mb-1">
                #{String(i + 1).padStart(2, '0')}
              </p>
              <p className="text-sm font-semibold text-slate-900 mb-1">{modus.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{modus.summary}</p>
            </div>

            {/* Body — 2 kolom */}
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Tanda bahaya */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.12em]">Tanda bahaya</p>
                </div>
                <ul className="space-y-2">
                  {modus.redFlags.map((flag, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tips */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <ShieldAlert className="w-3 h-3 text-emerald-500" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.12em]">Cara melindungi diri</p>
                </div>
                <ul className="space-y-2">
                  {modus.tips.map((tip, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}