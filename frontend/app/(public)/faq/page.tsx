import type { Metadata } from 'next';
import { safeJsonLd } from "@/core/utils";

export const metadata: Metadata = {
  title: 'FAQ — KawalTransaksi',
  description: 'Pertanyaan yang sering ditanyakan seputar KawalTransaksi.',
};

const faqs = [
  {
    q: 'Apa itu KawalTransaksi?',
    a: 'KawalTransaksi adalah platform verifikasi anti-penipuan yang memungkinkan siapa saja mengecek nomor HP, rekening bank, atau e-wallet sebelum bertransaksi. Data kami bersumber dari laporan komunitas pengguna di seluruh Indonesia.',
  },
  {
    q: 'Apakah KawalTransaksi gratis?',
    a: 'Ya, pengecekan nomor dan rekening sepenuhnya gratis. Anda dapat melakukan pengecekan sebanyak yang Anda butuhkan tanpa perlu mendaftar atau membayar.',
  },
  {
    q: 'Bagaimana cara melaporkan penipu?',
    a: 'Pilih menu "Laporkan" pada bilah navigasi, lalu lengkapi formulir tiga langkah: data penipu, kronologi kejadian, dan bukti pendukung. Laporan akan ditinjau oleh tim moderator sebelum ditampilkan secara publik.',
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
    a: 'Tidak ada data bukan berarti 100% aman — bisa saja nomor tersebut belum pernah dilaporkan. Selalu tetap waspada dan lakukan verifikasi lebih lanjut sebelum bertransaksi.',
  },
  {
    q: 'Bagaimana jika nomor saya dilaporkan secara tidak benar?',
    a: 'Anda dapat mengajukan banding melalui halaman detail laporan dengan menekan tombol "Ajukan Banding". Tim kami akan meninjau ulang laporan tersebut.',
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Pertanyaan Umum</h1>
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