import Link from "next/link";
import { ShieldCheck, ScanLine, Store } from "lucide-react";
import type { Metadata } from "next";
import QrisSearchForm from "@/features/check/QrisSearchForm";
import SearchHero from "@/features/check/SearchHero";
import { safeJsonLd } from "@/core/utils";
import LiveStats from "@/features/reports/LiveStats";

const PAGE_TITLE = "Cek QRIS Palsu — Cara Cek QRIS Asli atau Palsu | KawalTransaksi";
const PAGE_DESC =
  "Cek QRIS palsu sebelum membayar. Pelajari cara cek QRIS asli atau palsu: unggah atau pindai foto QRIS untuk memeriksa NMID merchant dan riwayat laporan penipuannya.";
const PAGE_URL = "https://kawaltransaksi.com/cek-qris";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: PAGE_URL,
    type: "website",
    locale: "id_ID",
    siteName: "KawalTransaksi",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
};

export const revalidate = 60;

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const steps = [
  {
    icon: ScanLine,
    title: "Foto atau Pindai QRIS",
    desc: "Unggah foto QRIS yang ingin diperiksa, atau pindai langsung menggunakan kamera. Data merchant dibaca otomatis dari kode QR-nya.",
  },
  {
    icon: Store,
    title: "Lihat Data Merchant",
    desc: "NMID, nama, dan kota merchant terbaca otomatis, jadi Anda tidak perlu mengetik apa pun dan tidak ada risiko salah ketik.",
  },
  {
    icon: ShieldCheck,
    title: "Cek Riwayat Laporan",
    desc: "Kami tampilkan apakah NMID tersebut pernah dilaporkan sebagai QRIS palsu atau ditempel di atas QRIS asli milik pihak lain.",
  },
];

const articles = [
  { title: "Waspada QRIS Palsu Ditempel", desc: "Modus penipuan dengan menempelkan stiker QRIS palsu di atas QRIS asli milik toko/warung semakin marak. Selalu cek NMID sebelum membayar." },
  { title: "Apa itu NMID?", desc: "National Merchant ID (NMID) adalah nomor identitas resmi merchant QRIS yang terdaftar di sistem Bank Indonesia. Setiap merchant resmi punya NMID yang unik." },
  { title: "Cara Kerja Cek QRIS", desc: "KawalTransaksi membaca kode QR dari foto yang Anda unggah, lalu mencocokkan NMID-nya dengan basis data laporan penipuan dari komunitas." },
  { title: "Laporkan QRIS Mencurigakan", desc: "Kalau Anda menemukan QRIS yang terlihat ditempel ulang, rusak, atau mencurigakan, laporkan lewat halaman Laporkan supaya pengguna lain ikut terlindungi." },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": "https://kawaltransaksi.com/cek-qris", "url": "https://kawaltransaksi.com/cek-qris", "name": "Cek QRIS Penipuan - KawalTransaksi", "isPartOf": { "@id": "https://kawaltransaksi.com/#website" } },
    { "@type": "FAQPage", "mainEntity": [
      { "@type": "Question", "name": "Bagaimana cara cek QRIS penipu?", "acceptedAnswer": { "@type": "Answer", "text": "Unggah atau pindai foto QRIS di KawalTransaksi. Data merchant (NMID, nama, kota) akan terbaca otomatis dan dicocokkan dengan riwayat laporan penipuan." } },
      { "@type": "Question", "name": "Apa itu NMID?", "acceptedAnswer": { "@type": "Answer", "text": "NMID (National Merchant ID) adalah nomor identitas resmi merchant QRIS yang terdaftar di sistem pembayaran Indonesia." } },
      { "@type": "Question", "name": "Apakah cek QRIS di KawalTransaksi gratis?", "acceptedAnswer": { "@type": "Answer", "text": "Ya, pengecekan QRIS di KawalTransaksi sepenuhnya gratis." } },
    ]},
  ],
};

async function getStats() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/stats-qris`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return { totalLaporan: 0, totalQris: 0, totalKerugian: 0 };
    return (await res.json()).data ?? { totalLaporan: 0, totalQris: 0, totalKerugian: 0 };
  } catch { return { totalLaporan: 0, totalQris: 0, totalKerugian: 0 }; }
}

export default async function CekQrisPage() {
  const { totalLaporan, totalQris, totalKerugian } = await getStats();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <SearchHero
        title="Cek QRIS Palsu Sebelum Membayar"
        description="Cara cek QRIS asli atau palsu: foto atau pindai kode QRIS untuk mengecek NMID merchant dan riwayat laporannya sebelum Anda benar-benar membayar."
        hint="Data merchant dibaca otomatis dari foto, tanpa perlu input manual."
      >
        <QrisSearchForm />
      </SearchHero>

      <section className="bg-white pb-10 sm:pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-14 relative z-10">
          <LiveStats
            variant="category"
            targetType="qris"
            blacklistDesc="QRIS telah terblacklist pada sistem kami"
            initial={{ total: totalLaporan, verified: totalQris, totalLoss: Number(totalKerugian) }}
          />
        </div>
      </section>

      <section className="bg-white py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-8 sm:mb-10 text-center">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-2">Cara Kerja Cek QRIS</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">Tiga langkah sederhana, tanpa perlu mengetik data merchant secara manual.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-200">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="bg-white overflow-hidden">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 sm:h-14 block">
          <path d="M0,0 C480,60 960,0 1440,40 L1440,60 L0,60 Z" fill="#f1f5f9" />
        </svg>
      </div>

      <section className="bg-slate-100 py-8 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-3">Kenapa Perlu Cek QRIS?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Modus QRIS palsu yang ditempel di atas kode asli membuat pembayaran justru masuk ke rekening pelaku, bukan ke merchant yang sebenarnya. Mengecek NMID sebelum membayar membantu memastikan uang Anda diterima oleh pihak yang tepat.</p>
            </div>
            <div className="bg-white border border-emerald-100 rounded-lg px-6 sm:px-8 py-6 sm:py-8">
              <p className="text-slate-700 text-sm font-medium leading-relaxed text-center">&quot;NMID resmi tidak pernah berubah untuk merchant yang sama. Kalau ragu, cek dulu sebelum bayar.&quot;</p>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-slate-100 overflow-hidden">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 sm:h-14 block">
          <path d="M0,40 C360,0 1080,60 1440,20 L1440,60 L0,60 Z" fill="#ffffff" />
        </svg>
      </div>

      <section className="bg-white py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 sm:gap-y-10">
            {articles.map((a, i) => (
              <div key={i}>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">{a.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/report" className="inline-flex items-center justify-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
              Laporkan QRIS Mencurigakan
            </Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
    </div>
  );
}
