import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import NomorSearchForm from "@/features/check/NomorSearchForm";
import SearchHero from "@/features/check/SearchHero";
import { encodeSlug, safeJsonLd } from "@/core/utils";
import LiveStats from "@/features/reports/LiveStats";

const PAGE_TITLE = "Cek Nomor HP & WhatsApp Penipu Gratis | KawalTransaksi";
const PAGE_DESC =
  "Cek nomor HP penipu, cek nomor WA penipu, dan cek nomor WhatsApp penipu secara gratis dan real-time. Database laporan komunitas anti-penipuan Indonesia terlengkap.";
const PAGE_URL = "https://kawaltransaksi.com/cek-nomor";

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

const ewallets = [
  { id: "gopay",   name: "GoPay",     logo: "/ewallets/gopay.png",     description: "Verifikasi akun GoPay dan identifikasi potensi penipuan sebelum transfer." },
  { id: "dana",    name: "DANA",      logo: "/ewallets/dana.png",      description: "Verifikasi akun DANA dan identifikasi potensi penipuan sebelum transfer." },
  { id: "ovo",     name: "OVO",       logo: "/ewallets/ovo.png",       description: "Verifikasi akun OVO dan identifikasi potensi penipuan sebelum transfer." },
  { id: "shopeepay", name: "ShopeePay", logo: "/ewallets/shopeepay.png", description: "Verifikasi akun ShopeePay dan identifikasi potensi penipuan sebelum transfer." },
  { id: "linkaja", name: "LinkAja",   logo: "/ewallets/linkaja.png",   description: "Verifikasi akun LinkAja dan identifikasi potensi penipuan sebelum transfer." },
];

const articles = [
  { title: "Cek Nomor HP Penipu Online",      desc: "Jadilah pengguna yang cermat dengan memeriksa apakah sebuah nomor HP berpotensi melakukan penipuan sebelum Anda bertransaksi." },
  { title: "Nomor HP Mencurigakan",            desc: "Temukan riwayat laporan dari nomor HP yang mencurigakan. Kunjungi halaman database kami untuk mengetahui kredibilitas sebuah nomor." },
  { title: "Database Nomor Penipu Terlengkap", desc: "KawalTransaksi merupakan platform pengecekan nomor HP penipu terlengkap di Indonesia." },
  { title: "Cara Cek Nomor HP",                desc: "Masukkan nomor yang ingin dicek pada kolom pencarian di atas. Kemudian Anda akan mendapatkan hasilnya secara instan." },
  { title: "Laporkan Nomor Penipu",            desc: "Semua laporan yang masuk akan kami tinjau mulai dari kronologis kejadian hingga bukti sebelum dipublikasikan." },
  { title: "Nomor HP Penipu Sosial Media",     desc: "KawalTransaksi menerima laporan nomor HP untuk modus phishing, soceng, investasi bodong, dan penipuan berkedok hadiah." },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": "https://kawaltransaksi.com/cek-nomor", "url": "https://kawaltransaksi.com/cek-nomor", "name": "Cek Nomor HP Penipu - KawalTransaksi", "isPartOf": { "@id": "https://kawaltransaksi.com/#website" } },
    { "@type": "FAQPage", "mainEntity": [
      { "@type": "Question", "name": "Bagaimana cara cek nomor HP penipu?", "acceptedAnswer": { "@type": "Answer", "text": "Masukkan nomor HP pada kolom pencarian di KawalTransaksi. Hasil pengecekan akan muncul secara instan." } },
      { "@type": "Question", "name": "Apakah cek nomor HP di KawalTransaksi gratis?", "acceptedAnswer": { "@type": "Answer", "text": "Ya, pengecekan nomor HP di KawalTransaksi sepenuhnya gratis tanpa perlu mendaftar." } },
      { "@type": "Question", "name": "Nomor HP apa saja yang bisa dicek?", "acceptedAnswer": { "@type": "Answer", "text": "KawalTransaksi mendukung pengecekan semua nomor HP Indonesia termasuk WhatsApp, GoPay, DANA, OVO, ShopeePay, dan LinkAja." } },
    ]},
  ],
};

const RANK_STYLE: Record<number, string> = {
  0: "bg-red-100 text-red-600",
  1: "bg-orange-100 text-orange-500",
  2: "bg-amber-100 text-amber-500",
};

async function getStats() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/stats-nomor`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return { totalLaporan: 0, totalNomor: 0, totalKerugian: 0 };
    return (await res.json()).data ?? { totalLaporan: 0, totalNomor: 0, totalKerugian: 0 };
  } catch { return { totalLaporan: 0, totalNomor: 0, totalKerugian: 0 }; }
}

async function getLeaderboard() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/leaderboard-nomor`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return (await res.json()).data ?? [];
  } catch { return []; }
}

export default async function CekNomorPage() {
  const [{ totalLaporan, totalNomor, totalKerugian }, leaderboard] = await Promise.all([getStats(), getLeaderboard()]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <SearchHero
        title="Cek Nomor HP & WhatsApp Penipu Online"
        description="Cek nomor HP penipu dan cek nomor WA penipu sebelum bertransaksi. Identifikasi apakah sebuah nomor WhatsApp terindikasi penipuan lewat laporan komunitas."
        hint={<>Contoh: <span className="text-emerald-600 font-medium">081234567890</span></>}
      >
        <NomorSearchForm />
      </SearchHero>

      <section className="bg-white pb-10 sm:pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-14 relative z-10">
          <LiveStats
            variant="category"
            targetType="phone"
            blacklistDesc="Nomor HP telah terblacklist pada sistem kami"
            initial={{ total: totalLaporan, verified: totalNomor, totalLoss: Number(totalKerugian) }}
          />
        </div>
      </section>

      <section className="bg-white py-8 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-3">Apa itu Cek Nomor HP?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Layanan verifikasi nomor HP KawalTransaksi membantu Anda mengidentifikasi potensi risiko penipuan pada nomor yang tidak dikenal, berdasarkan laporan dan keluhan pengguna yang telah berinteraksi sebelumnya.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-6 sm:px-8 py-6 sm:py-8">
              <p className="text-slate-700 text-sm font-medium leading-relaxed text-center">&quot;KawalTransaksi hadir untuk melindungi masyarakat Indonesia dari ancaman penipuan digital yang terus berkembang setiap harinya.&quot;</p>
            </div>
          </div>
        </div>
      </section>

      {leaderboard.length > 0 && (
        <section className="bg-white pb-10 sm:pb-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-red-500" /></div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-none">Nomor Paling Banyak Dilaporkan</h2>
                <p className="text-xs text-slate-400 mt-0.5">30 hari terakhir</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {(leaderboard as any[]).map((entry, i) => {
                // Backend return camelCase dari Drizzle
                const number = entry.targetValue ?? entry.target_number ?? entry.targetvalue;
                if (!number) return null;
                const reportCount = entry.reportCount ?? entry.report_count ?? 1;
                const displayNumber = number;
                return (
                  <Link key={number} href={`/check/${encodeSlug(number)}`} className="flex items-center gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-slate-50 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm ${RANK_STYLE[i] ?? "bg-slate-100 text-slate-500"}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-black font-mono text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">{displayNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Dilaporkan {reportCount}x dalam 30 hari terakhir</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-xs font-bold text-red-600">{reportCount} laporan</span>
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
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-xl font-bold text-slate-900">Cek Per E-Wallet</h2>
            <p className="text-xs text-slate-500 mt-1">Pilih platform untuk mulai verifikasi</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {ewallets.map((w) => (
              <Link key={w.id} href={`/cek-nomor/cek-ewallet/${w.id}`} className="group bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:border-emerald-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-8 sm:w-16 sm:h-10 relative mb-3 sm:mb-4">
                    <Image src={w.logo} alt={`Logo ${w.name}`} fill className="object-contain object-left" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">{w.name}</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed hidden sm:block">{w.description}</p>
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