import type { Metadata } from 'next';
import { safeJsonLd } from "@/core/utils";

const PAGE_TITLE = 'FAQ — Cara Cek Rekening & Nomor Penipu | KawalTransaksi';
const PAGE_DESC =
  'Pertanyaan umum seputar cara cek rekening penipu, cek nomor HP penipu, cek e-wallet dan QRIS, serta cara melaporkan penipuan online di KawalTransaksi.';
const PAGE_URL = 'https://kawaltransaksi.com/faq';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: PAGE_URL,
    type: 'website',
    locale: 'id_ID',
    siteName: 'KawalTransaksi',
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
};

const faqs = [
  {
    q: 'Apa itu KawalTransaksi?',
    a: 'KawalTransaksi adalah platform verifikasi anti-penipuan yang memungkinkan siapa saja mengecek nomor HP, rekening bank, e-wallet, atau QRIS sebelum bertransaksi. Data kami bersumber dari laporan komunitas pengguna di seluruh Indonesia.',
  },
  {
    q: 'Apa saja yang bisa dicek di KawalTransaksi?',
    a: 'Anda bisa mengecek empat jenis target: nomor HP (termasuk WhatsApp), rekening bank, akun e-wallet (GoPay, DANA, OVO, ShopeePay, LinkAja), dan kode QRIS merchant. Semua pengecekan gratis dan real-time.',
  },
  {
    q: 'Apakah KawalTransaksi gratis?',
    a: 'Ya, pengecekan nomor dan rekening sepenuhnya gratis. Anda bisa mengecek sebanyak yang Anda butuhkan tanpa perlu mendaftar atau membayar.',
  },
  {
    q: 'Bagaimana cara melaporkan penipu?',
    a: 'Buka menu "Laporkan" di bagian atas halaman, lalu isi formulir tiga langkah: data penipu, kronologi kejadian, dan bukti pendukung. Laporan akan ditinjau tim moderator sebelum ditampilkan ke publik.',
  },
  {
    q: 'Berapa lama laporan diproses?',
    a: 'Laporan biasanya ditinjau dalam 1x24 jam. Setelah diverifikasi, data akan langsung muncul di hasil pencarian.',
  },
  {
    q: 'Apakah data yang saya laporkan aman?',
    a: 'Identitas pelapor tidak pernah ditampilkan secara publik. Yang ditampilkan hanya data target (nomor/rekening penipu) beserta kategori dan kronologi kejadian.',
  },
  {
    q: 'Nomor yang saya cek tidak ada datanya. Apakah aman?',
    a: 'Tidak ada data bukan berarti 100% aman. Bisa jadi nomor itu memang belum pernah dilaporkan. Tetap waspada dan lakukan pengecekan lain sebelum bertransaksi.',
  },
  {
    q: 'Bagaimana jika nomor saya dilaporkan secara tidak benar?',
    a: 'Anda bisa mengajukan banding lewat halaman detail laporan, lalu klik tombol "Ajukan Banding". Laporan itu akan ditinjau ulang oleh tim kami.',
  },
  {
    q: 'Apakah KawalTransaksi tersedia sebagai aplikasi mobile?',
    a: 'Saat ini KawalTransaksi tersedia dalam versi web yang mobile-friendly. Aplikasi Android dan iOS sedang dalam tahap pengembangan.',
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Pertanyaan Umum: Cara Cek Rekening &amp; Nomor Penipu</h1>
            <p className="text-slate-500 text-sm">Hal-hal yang sering ditanyakan seputar KawalTransaksi.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-5">
                <p className="text-sm font-bold text-slate-900 mb-2">{faq.q}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}