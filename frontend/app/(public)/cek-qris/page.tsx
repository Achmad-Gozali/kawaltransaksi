import Link from "next/link";
import { ShieldCheck, ScanLine, Store } from "lucide-react";
import type { Metadata } from "next";
import QrisSearchForm from "@/features/check/QrisSearchForm";
import SearchHero from "@/features/check/SearchHero";
import { formatRupiah, safeJsonLd } from "@/core/utils";

export const metadata: Metadata = {
  title: "Cek QRIS - KawalTransaksi",
  description: "Verifikasi keaslian kode QRIS sebelum bertransaksi. Unggah atau pindai foto QRIS untuk memeriksa riwayat laporan penipuan merchant.",
  alternates: { canonical: "https://kawaltransaksi.com/cek-qris" },
};

export const dynamic = "force-dynamic";

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
      cache: "no-store",
    });
    if (!res.ok) return { totalLaporan: 0, totalQris: 0, totalKerugian: 0 };
    return (await res.json()).data ?? { totalLaporan: 0, totalQris: 0, totalKerugian: 0 };
  } catch { return { totalLaporan: 0, totalQris: 0, totalKerugian: 0 }; }
}

export default async function CekQrisPage() {
  const { totalLaporan, totalQris, totalKerugian } = await getStats();

  const stats = [
    { icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>), value: totalLaporan > 0 ? `${totalLaporan.toLocaleString("id-ID")}+` : "0", desc: "Kasus penipuan yang telah dilaporkan pengguna" },
    { icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>), value: totalQris > 0 ? `${totalQris.toLocaleString("id-ID")}+` : "0", desc: "QRIS telah terblacklist pada sistem kami" },
    { icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>), value: Number(totalKerugian) > 0 ? formatRupiah(Number(totalKerugian)) : "Rp0", desc: "Total kerugian yang dilaporkan sejak platform berdiri" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <SearchHero
        title="Cek Keaslian QRIS Sebelum Membayar"
        description="Foto atau pindai kode QRIS untuk mengecek data merchant dan riwayat laporannya, sebelum Anda benar-benar membayar."
        hint="Data merchant dibaca otomatis dari foto, tanpa perlu input manual."
      >
        <QrisSearchForm />
      </SearchHero>

      <section className="bg-white pb-10 sm:pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-14 relative z-10">
          <div className="grid grid-cols-3 sm:hidden bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden divide-x divide-slate-100">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center py-4 px-2.5 text-center">
                <div className="text-emerald-600 mb-1.5">{s.icon}</div>
                <p className="text-base font-black text-emerald-600 leading-none mb-1">{s.value}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="hidden sm:grid grid-cols-3 bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden divide-x divide-slate-100">
            {stats.map((s, i) => (
              <div key={i} className="flex items-start gap-4 px-8 py-8">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">{s.icon}</div>
                <div>
                  <p className="text-2xl font-black text-emerald-600 mb-1">{s.value}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
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
