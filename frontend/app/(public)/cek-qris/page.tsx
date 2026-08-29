import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import QrisSearchForm from "@/features/check/QrisSearchForm";
import SearchHero from "@/features/check/SearchHero";
import { formatRupiah, encodeSlug, safeJsonLd } from "@/core/utils";

const PAGE_TITLE = "Cek QRIS Penipu Online Gratis & Real-Time | KawalTransaksi";
const PAGE_DESC =
  "Cek QRIS penipu online secara gratis dan real-time. Verifikasi NMID merchant QRIS sebelum membayar lewat database laporan komunitas KawalTransaksi, cukup dengan memindai atau mengunggah fotonya.";
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

const articles = [
  { title: "Cek QRIS Penjual Online", desc: "Jadilah pembeli yang cermat dengan memeriksa apakah QRIS pembayaran milik penjual pernah dilaporkan melakukan penipuan sebelum Anda membayar." },
  { title: "Apa itu NMID?", desc: "NMID (National Merchant ID) adalah nomor identitas resmi merchant QRIS yang terdaftar di sistem pembayaran Indonesia. Setiap merchant resmi memiliki NMID yang unik." },
  { title: "Cara Kerja Cek QRIS", desc: "KawalTransaksi membaca kode QR dari foto yang Anda unggah, lalu mencocokkan NMID merchant-nya dengan database laporan penipuan dari komunitas." },
  { title: "Laporkan QRIS Penipu", desc: "Semua laporan yang masuk kami tinjau mulai dari kronologi kejadian hingga bukti pembayaran sebelum dipublikasikan." },
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

const RANK_STYLE: Record<number, string> = { 0: "bg-red-100 text-red-600", 1: "bg-orange-100 text-orange-500", 2: "bg-amber-100 text-amber-500" };

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

async function getLeaderboard() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/leaderboard-qris`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return (await res.json()).data ?? [] as { target_number: string; merchant_name: string | null; report_count: number }[];
  } catch { return []; }
}

export default async function CekQrisPage() {
  const [{ totalLaporan, totalQris, totalKerugian }, leaderboard] = await Promise.all([getStats(), getLeaderboard()]);

  const stats = [
    { icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>), value: totalLaporan > 0 ? `${totalLaporan.toLocaleString("id-ID")}+` : "0", desc: "Kasus penipuan yang telah dilaporkan pengguna" },
    { icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>), value: totalQris > 0 ? `${totalQris.toLocaleString("id-ID")}+` : "0", desc: "QRIS telah terblacklist pada sistem kami" },
    { icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>), value: Number(totalKerugian) > 0 ? formatRupiah(Number(totalKerugian)) : "Rp0", desc: "Total kerugian yang dilaporkan sejak platform berdiri" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <SearchHero
        title="Cek QRIS Penipu Online"
        description="Identifikasi apakah sebuah QRIS pernah dipakai untuk penipuan sebelum Anda membayar. Cek merchant QRIS lewat NMID-nya — cukup pindai atau unggah fotonya."
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

      {leaderboard.length > 0 && (
        <section className="bg-white py-10 sm:py-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-red-500" /></div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-none">QRIS Paling Banyak Dilaporkan</h2>
                <p className="text-xs text-slate-400 mt-0.5">30 hari terakhir</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {(leaderboard as any[]).map((entry, i) => {
                const nmid = entry.target_number;
                const merchantName = entry.merchant_name ?? "Merchant tidak diketahui";
                return (
                  <Link key={nmid} href={`/check/${encodeSlug(nmid)}?type=qris`} className="flex items-center gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-slate-50 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm ${RANK_STYLE[i] ?? "bg-slate-100 text-slate-500"}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-black font-mono text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors truncate">{nmid}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{merchantName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-xs font-bold text-red-600">{entry.report_count} laporan</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div className="bg-white overflow-hidden">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 sm:h-14 block">
          <path d="M0,0 C480,60 960,0 1440,40 L1440,60 L0,60 Z" fill="#f1f5f9" />
        </svg>
      </div>

      <section className="bg-slate-100 py-8 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-3">Apa itu Cek QRIS?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Layanan verifikasi QRIS KawalTransaksi membantu Anda mengidentifikasi potensi risiko penipuan pada QRIS merchant tujuan, berdasarkan laporan dan keluhan pengguna yang telah bertransaksi sebelumnya.</p>
            </div>
            <div className="bg-white border border-emerald-100 rounded-lg px-6 sm:px-8 py-6 sm:py-8">
              <p className="text-slate-700 text-sm font-medium leading-relaxed text-center">&quot;Sebelum membayar lewat QRIS, sempatkan periksa merchant-nya. Satu langkah kecil yang bisa menyelamatkan uang Anda dari tangan penipu.&quot;</p>
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
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
    </div>
  );
}
