import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ScanLine, Store } from "lucide-react";
import type { Metadata } from "next";
import QrisSearchForm from "@/features/check/QrisSearchForm";
import { safeJsonLd } from "@/core/utils";

export const metadata: Metadata = {
  title: "Cek QRIS - KawalTransaksi",
  description: "Verifikasi keaslian kode QRIS sebelum bertransaksi. Upload atau scan foto QRIS untuk cek riwayat laporan penipuan merchant.",
  alternates: { canonical: "https://kawaltransaksi.com/cek-qris" },
};

const steps = [
  {
    icon: ScanLine,
    title: "Foto atau Scan QRIS",
    desc: "Upload foto QRIS yang ingin dicek, atau langsung scan pakai kamera. Data merchant dibaca otomatis dari kode QR-nya.",
  },
  {
    icon: Store,
    title: "Lihat Data Merchant",
    desc: "NMID, nama, dan kota merchant terbaca otomatis -- tidak perlu ketik manual, jadi tidak ada salah ketik.",
  },
  {
    icon: ShieldCheck,
    title: "Cek Riwayat Laporan",
    desc: "Kami tampilkan apakah NMID tersebut pernah dilaporkan sebagai QRIS palsu atau ditempel di atas QRIS asli milik pihak lain.",
  },
];

const articles = [
  { title: "Waspada QRIS Palsu Ditempel", desc: "Modus penipuan dengan menempelkan stiker QRIS palsu di atas QRIS asli milik toko/warung semakin marak. Selalu cek NMID sebelum membayar." },
  { title: "Apa itu NMID?", desc: "National Merchant ID (NMID) adalah nomor identitas resmi merchant QRIS yang terdaftar di sistem Bank Indonesia -- setiap merchant sah punya NMID unik." },
  { title: "Cara Kerja Cek QRIS", desc: "KawalTransaksi membaca kode QR dari foto yang kamu unggah, lalu mencocokkan NMID-nya dengan basis data laporan penipuan dari komunitas." },
  { title: "Laporkan QRIS Mencurigakan", desc: "Kalau kamu menemukan QRIS yang terlihat ditempel ulang, rusak, atau mencurigakan, laporkan lewat halaman Laporkan agar pengguna lain terlindungi." },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": "https://kawaltransaksi.com/cek-qris", "url": "https://kawaltransaksi.com/cek-qris", "name": "Cek QRIS Penipuan - KawalTransaksi", "isPartOf": { "@id": "https://kawaltransaksi.com/#website" } },
    { "@type": "FAQPage", "mainEntity": [
      { "@type": "Question", "name": "Bagaimana cara cek QRIS penipu?", "acceptedAnswer": { "@type": "Answer", "text": "Upload atau scan foto QRIS di KawalTransaksi. Data merchant (NMID, nama, kota) akan terbaca otomatis dan dicocokkan dengan riwayat laporan penipuan." } },
      { "@type": "Question", "name": "Apa itu NMID?", "acceptedAnswer": { "@type": "Answer", "text": "NMID (National Merchant ID) adalah nomor identitas resmi merchant QRIS yang terdaftar di sistem pembayaran Indonesia." } },
      { "@type": "Question", "name": "Apakah cek QRIS di KawalTransaksi gratis?", "acceptedAnswer": { "@type": "Answer", "text": "Ya, pengecekan QRIS di KawalTransaksi sepenuhnya gratis." } },
    ]},
  ],
};

export default function CekQrisPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <section className="relative bg-slate-100 pt-28 sm:pt-36 pb-0 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 pb-16 sm:pb-24">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-snug">Cek Keaslian QRIS Sebelum Bayar</h1>
              <p className="text-slate-500 text-sm sm:text-base mb-8 leading-relaxed max-w-md">Foto atau scan kode QRIS untuk memverifikasi data merchant dan riwayat laporan penipuan -- sebelum kamu scan untuk bayar sungguhan.</p>
              <QrisSearchForm />
              <p className="text-xs text-slate-400 mt-3">Data merchant dibaca otomatis dari foto, tidak perlu input manual.</p>
            </div>
            <div className="hidden md:flex flex-shrink-0 items-end justify-start -ml-6 lg:-ml-10">
              <div className="relative w-[420px] h-[310px] lg:w-[500px] lg:h-[370px]">
                <Image src="/ilustrasi-hero.png" alt="Ilustrasi cek QRIS" fill className="object-contain" priority />
              </div>
            </div>
          </div>
        </div>
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 sm:h-20 block">
          <path d="M0,20 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#ffffff" />
        </svg>
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
              <p className="text-slate-500 text-sm leading-relaxed">Modus QRIS palsu yang ditempel di atas kode asli membuat pembayaran malah masuk ke rekening pelaku, bukan ke merchant sebenarnya. Mengecek NMID sebelum scan-untuk-bayar membantu memastikan kamu membayar ke pihak yang tepat.</p>
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
