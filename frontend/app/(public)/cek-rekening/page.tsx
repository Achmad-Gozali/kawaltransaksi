import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import RekeningSearchForm from "@/features/check/RekeningSearchForm";
import { formatRupiah, encodeSlug } from "@/core/utils";

export const metadata: Metadata = {
  title: "Cek Rekening - KawalTransaksi",
  description: "Verifikasi keamanan nomor rekening bank secara real-time.",
};

export const revalidate = 60;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.kawaltransaksi.com';

const banks = [
  { id: "bca",     name: "Bank Central Asia",    logo: "/banks/bca.png",     description: "Verifikasi rekening BCA dan identifikasi potensi penipuan sebelum transfer." },
  { id: "bri",     name: "Bank Rakyat Indonesia", logo: "/banks/bri.png",     description: "Verifikasi rekening BRI dan identifikasi potensi penipuan sebelum transfer." },
  { id: "bni",     name: "Bank Negara Indonesia", logo: "/banks/bni.png",     description: "Verifikasi rekening BNI dan identifikasi potensi penipuan sebelum transfer." },
  { id: "mandiri", name: "Bank Mandiri",           logo: "/banks/mandiri.png", description: "Verifikasi rekening Mandiri dan identifikasi potensi penipuan sebelum transfer." },
  { id: "cimb",    name: "Bank CIMB Niaga",        logo: "/banks/cimb.png",    description: "Verifikasi rekening CIMB Niaga dan identifikasi potensi penipuan sebelum transfer." },
  { id: "bsi",     name: "Bank Syariah Indonesia", logo: "/banks/bsi.png",     description: "Verifikasi rekening BSI dan identifikasi potensi penipuan sebelum transfer." },
];

const articles = [
  { title: "Cek Rekening Penjual Online",        desc: "Jadilah smart shopper dengan melakukan pengecekan apakah seorang penjual berpotensi melakukan penipuan atau tidak sebelum berbelanja online." },
  { title: "Rekening Bank Mencurigakan",          desc: "Temukan riwayat laporan dari rekening bank yang mencurigakan. Kunjungi halaman database kami untuk mengetahui kredibilitas sebuah rekening." },
  { title: "Cek Rekening Bank Terlengkap",        desc: "KawalTransaksi merupakan platform pengecekan rekening penipu terlengkap. Cek nomor rekening BCA, BRI, BNI, Mandiri, CIMB Niaga, BSI, dan lainnya." },
  { title: "Cara Cek Nomor Rekening",             desc: "Masukkan nomor rekening yang ingin dicek pada kolom pencarian di atas untuk mendapatkan hasil pengecekan." },
  { title: "Laporkan Rekening Penipu",            desc: "Semua laporan yang masuk akan kami tinjau dari kronologis kejadian hingga bukti transfer sebelum dipublikasikan." },
  { title: "Sudah Terlanjur Transfer ke Penipu?", desc: "Segera hubungi bank Anda untuk memblokir transaksi dan laporkan nomor rekening tersebut ke KawalTransaksi." },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://kawaltransaksi.com/cek-rekening",
      "url": "https://kawaltransaksi.com/cek-rekening",
      "name": "Cek Rekening Penipu - KawalTransaksi",
      "isPartOf": { "@id": "https://kawaltransaksi.com/#website" },
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Bagaimana cara cek rekening penipu?",           "acceptedAnswer": { "@type": "Answer", "text": "Masukkan nomor rekening bank pada kolom pencarian di KawalTransaksi untuk mendapatkan hasil pengecekan secara instan." } },
        { "@type": "Question", "name": "Bank apa saja yang didukung?",                  "acceptedAnswer": { "@type": "Answer", "text": "KawalTransaksi mendukung pengecekan rekening BCA, BRI, BNI, Mandiri, CIMB Niaga, BSI, dan bank lainnya." } },
        { "@type": "Question", "name": "Apakah cek rekening di KawalTransaksi gratis?", "acceptedAnswer": { "@type": "Answer", "text": "Ya, pengecekan rekening bank di KawalTransaksi sepenuhnya gratis." } },
      ],
    },
  ],
};

const RANK_STYLE: Record<number, string> = {
  0: "bg-red-100 text-red-600",
  1: "bg-orange-100 text-orange-500",
  2: "bg-amber-100 text-amber-500",
};

const bankLogoMap: Record<string, string> = {
  bca: "/banks/bca.png", bni: "/banks/bni.png", bri: "/banks/bri.png",
  bsi: "/banks/bsi.png", cimb: "/banks/cimb.png", mandiri: "/banks/mandiri.png",
};

const ewalletLogoMap: Record<string, string> = {
  gopay: "/ewallets/gopay.png", dana: "/ewallets/dana.png", ovo: "/ewallets/ovo.png",
  shopeepay: "/ewallets/shopeepay.png", linkaja: "/ewallets/linkaja.png",
};

function getBankLogo(bankName: string | null): string | null {
  if (!bankName) return null;
  const key = bankName.toLowerCase();
  return bankLogoMap[key] ?? ewalletLogoMap[key] ?? null;
}

async function getStats() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/stats-rekening`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { totalLaporan: 0, totalRekening: 0, totalKerugian: 0 };
    const json = await res.json();
    return json.data ?? { totalLaporan: 0, totalRekening: 0, totalKerugian: 0 };
  } catch {
    return { totalLaporan: 0, totalRekening: 0, totalKerugian: 0 };
  }
}

async function getLeaderboard() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/leaderboard-rekening`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []) as { target_number: string; bank_name: string | null; report_count: number }[];
  } catch {
    return [];
  }
}

export default async function CekRekeningPage() {
  const [{ totalLaporan, totalRekening, totalKerugian }, leaderboard] = await Promise.all([
    getStats(),
    getLeaderboard(),
  ]);

  const stats = [
    {
      icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>),
      value: totalLaporan > 0 ? `${totalLaporan.toLocaleString("id-ID")}+` : "0",
      desc:  "Kasus penipuan yang telah dilaporkan pengguna",
    },
    {
      icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>),
      value: totalRekening > 0 ? `${totalRekening.toLocaleString("id-ID")}+` : "0",
      desc:  "Rekening bank telah terblacklist pada sistem kami",
    },
    {
      icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>),
      value: Number(totalKerugian) > 0 ? formatRupiah(Number(totalKerugian)) : "Rp0",
      desc:  "Total kerugian yang dilaporkan sejak platform berdiri",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* HERO */}
      <section className="relative bg-slate-100 pt-28 sm:pt-36 pb-0 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 pb-16 sm:pb-24">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-snug">
                Cek Rekening Penipu Online
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mb-8 leading-relaxed max-w-md">
                Identifikasi apakah seseorang berpotensi melakukan penipuan dengan mengecek nomor rekening bank penjual sebelum berbelanja online.
              </p>
              <RekeningSearchForm />
              <p className="text-xs text-slate-400 mt-3">
                Contoh: <span className="text-emerald-600 font-medium">1234567890</span>
              </p>
            </div>
            <div className="hidden md:flex flex-shrink-0 items-end justify-start -ml-6 lg:-ml-10">
              <div className="relative w-[420px] h-[310px] lg:w-[500px] lg:h-[370px]">
                <Image src="/ilustrasi-hero.png" alt="Ilustrasi cek rekening bank" fill className="object-contain" priority />
              </div>
            </div>
          </div>
        </div>
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 sm:h-20 block">
          <path d="M0,20 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#ffffff" />
        </svg>
      </section>

      {/* STATS */}
      <section className="bg-white pb-10 sm:pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-14 relative z-10">
          <div className="grid grid-cols-3 sm:hidden bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden divide-x divide-slate-100">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center py-4 px-2 text-center">
                <div className="text-emerald-600 mb-1.5">{s.icon}</div>
                <p className="text-sm font-black text-emerald-600 leading-none mb-1">{s.value}</p>
                <p className="text-[8px] text-slate-400 leading-tight">{s.desc}</p>
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

      {/* APA ITU CEK REKENING */}
      <section className="bg-white py-8 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-3">Apa itu Cek Rekening?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Layanan verifikasi rekening bank KawalTransaksi membantu Anda mengidentifikasi potensi risiko penipuan pada nomor rekening tujuan, berdasarkan laporan dan keluhan pengguna yang telah bertransaksi sebelumnya.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-6 sm:px-8 py-6 sm:py-8">
              <p className="text-slate-700 text-sm font-medium leading-relaxed text-center">
                &quot;Sebelum transfer, selalu verifikasi rekening tujuan. Satu langkah kecil yang bisa menyelamatkan uang Anda dari tangan penipu.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LEADERBOARD */}
      {leaderboard.length > 0 && (
        <section className="bg-white pb-10 sm:pb-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-none">Rekening Paling Banyak Dilaporkan</h2>
                <p className="text-xs text-slate-400 mt-0.5">30 hari terakhir</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {leaderboard.map((entry, i) => (
                <Link
                  key={entry.target_number}
                  href={`/check/${encodeSlug(entry.target_number)}`}
                  className="flex items-center gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm ${RANK_STYLE[i] ?? "bg-slate-100 text-slate-500"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-black font-mono text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                      {entry.target_number}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Dilaporkan {entry.report_count}x dalam 30 hari terakhir
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.bank_name && getBankLogo(entry.bank_name) && (
                      <div className="relative w-12 h-6 hidden sm:block">
                        <Image src={getBankLogo(entry.bank_name)!} alt={entry.bank_name} fill className="object-contain" />
                      </div>
                    )}
                    <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-xs font-bold text-red-600">
                      {entry.report_count} laporan
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="bg-white overflow-hidden">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 sm:h-14 block">
          <path d="M0,0 C480,60 960,0 1440,40 L1440,60 L0,60 Z" fill="#f1f5f9" />
        </svg>
      </div>

      {/* CEK PER BANK */}
      <section className="bg-slate-100 py-8 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-xl font-bold text-slate-900">Cek Rekening Per Bank</h2>
            <p className="text-xs text-slate-500 mt-1">Pilih bank untuk mulai verifikasi</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {banks.map((b) => (
              <Link key={b.id} href={`/cek-rekening/${b.id}`}
                className="group bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:border-emerald-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-8 sm:w-16 sm:h-10 relative mb-3 sm:mb-4">
                    <Image src={b.logo} alt={`Logo ${b.name}`} fill className="object-contain object-left" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">{b.name}</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed hidden sm:block">{b.description}</p>
                </div>
                <div className="mt-3 sm:mt-5 pt-2 sm:pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-600">Cek Selengkapnya</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-slate-100 overflow-hidden">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 sm:h-14 block">
          <path d="M0,40 C360,0 1080,60 1440,20 L1440,60 L0,60 Z" fill="#ffffff" />
        </svg>
      </div>

      {/* ARTIKEL SEO */}
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
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}