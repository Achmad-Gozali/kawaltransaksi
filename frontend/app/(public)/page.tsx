import Link from "next/link";
import Image from "next/image";
import { Phone, Landmark, Wallet, ArrowRight, ScanLine } from "lucide-react";
import * as motion from "motion/react-client";

export const revalidate = 60;

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const ewalletNames = ["gopay", "dana", "ovo", "shopeepay", "linkaja"];

const bankLogoMap: Record<string, string> = {
  bca: "/banks/bca.png", bni: "/banks/bni.png", bri: "/banks/bri.png",
  bsi: "/banks/bsi.png", cimb: "/banks/cimb.png", mandiri: "/banks/mandiri.png",
};

const ewalletLogoMap: Record<string, string> = {
  gopay: "/ewallets/gopay.png", dana: "/ewallets/dana.png", ovo: "/ewallets/ovo.png",
  shopeepay: "/ewallets/shopeepay.png", linkaja: "/ewallets/linkaja.png",
};

const HOW_IT_WORKS = [
  {
    number: "#1",
    title: "Laporan Komunitas",
    desc: "Laporan nomor HP, rekening bank, atau e-wallet mencurigakan dikumpulkan dari komunitas pengguna beserta bukti digital pendukung.",
  },
  {
    number: "#2",
    title: "Data Terkumpul",
    desc: "Ratusan laporan masuk setiap harinya dan disimpan dalam basis data terpusat untuk diproses lebih lanjut.",
  },
  {
    number: "#3",
    title: "Verifikasi",
    desc: "Setiap laporan dianalisis otomatis oleh sistem dan ditinjau oleh moderator sebelum dipublikasikan ke basis data.",
  },
  {
    number: "#4",
    title: "Hasil Real-time",
    desc: "Data yang telah terverifikasi dapat dicek oleh seluruh pengguna secara gratis dan real-time.",
  },
];

function formatDateID(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return dateString; }
}

function formatLoss(amount: number) {
  if (amount === 0) return "Rp0";
  if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)} M+`;
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)} Jt+`;
  if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)} Rb+`;
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function getPlatformLogo(type: string, bankName: string | null, walletName: string | null) {
  const key = (walletName ?? bankName ?? "").toLowerCase();
  if (type === "ewallet" || ewalletNames.includes(key)) return ewalletLogoMap[key] ?? null;
  if (type === "bank_account") return bankLogoMap[key] ?? null;
  return null;
}

function getTargetMeta(type: string, bankName: string | null, walletName: string | null) {
  const key = (walletName ?? bankName ?? "").toLowerCase();
  if (type === "ewallet" || (type === "phone" && ewalletNames.includes(key)))
    return { icon: Wallet, label: walletName ?? bankName ?? "E-Wallet", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" };
  if (type === "bank_account")
    return { icon: Landmark, label: bankName ?? "Rekening Bank", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
  return { icon: Phone, label: "Nomor HP", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
}

interface ReportItem {
  id: string;
  targetValue: string;
  targetType: string;
  targetName: string | null;
  bankName: string | null;
  walletName: string | null;
  description: string;
  createdAt: string;
  status: string;
}

interface Stats { total: number; verified: number; totalLoss: number; }

async function getRecentReports(): Promise<ReportItem[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/recent`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
}
  
async function getStats(): Promise<Stats> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/stats`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return { total: 0, verified: 0, totalLoss: 0 };
    const json = await res.json();
    return json.data ?? { total: 0, verified: 0, totalLoss: 0 };
  } catch { return { total: 0, verified: 0, totalLoss: 0 }; }
}

function StatsCard({ stats }: { stats: Stats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100 overflow-hidden"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 sm:divide-x divide-slate-100">
        {[
          { label: "Laporan", value: `${stats.total}+`, sub: "Kasus dilaporkan", color: "text-slate-900", border: "border-r border-b sm:border-b-0 border-slate-100" },
          { label: "Terverifikasi", value: `${stats.verified}+`, sub: "Penipuan terkonfirmasi", color: "text-emerald-700", border: "border-b sm:border-b-0 border-slate-100" },
          { label: "Kerugian", value: formatLoss(stats.totalLoss), sub: "Total kerugian dilaporkan", color: "text-red-500", border: "col-span-2 sm:col-span-1" },
        ].map((item, i) => (
          <div key={i} className={`px-5 py-5 sm:px-8 sm:py-6 ${item.border}`}>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{item.label}</p>
            <p className={`text-2xl sm:text-4xl font-black leading-none tabular-nums ${item.color}`}>{item.value}</p>
            <p className="text-xs text-slate-500 mt-1.5 leading-snug">{item.sub}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default async function HomePage() {
  const [recentReports, stats] = await Promise.all([getRecentReports(), getStats()]);

  return (
    <main className="bg-white text-slate-900 font-sans overflow-x-hidden">
      {/* HERO */}
      <section className="relative bg-slate-100 pt-24 sm:pt-32 pb-0 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 pb-16 sm:pb-24">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-snug">
                Transaksi <span className="text-emerald-600 italic">Aman,</span>{" "}
                <br className="hidden sm:block" />Hati Tenang
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mb-8 leading-relaxed max-w-md">
                Verifikasi nomor HP, rekening bank, dan e-wallet dalam hitungan detik. Bersama komunitas, kami berkomitmen untuk mewujudkan ekosistem transaksi digital yang lebih aman di Indonesia.
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <Link
                  href="/cek-nomor"
                  className="px-6 py-3 bg-slate-900 text-white font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Cek Nomor HP
                </Link>
                <Link
                  href="/cek-rekening"
                  className="px-6 py-3 border-2 border-slate-300 text-slate-900 font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 hover:border-slate-900 transition-colors bg-white"
                >
                  <Landmark className="w-4 h-4" /> Cek Rekening
                </Link>
                <Link
                  href="/cek-qris"
                  className="px-6 py-3 border-2 border-slate-300 text-slate-900 font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 hover:border-slate-900 transition-colors bg-white"
                >
                  <ScanLine className="w-4 h-4" /> Cek QRIS
                </Link>
              </div>
            </div>
            <div className="hidden md:flex flex-shrink-0 items-end justify-start -ml-6 lg:-ml-10">
              <div className="relative w-[420px] h-[310px] lg:w-[500px] lg:h-[370px]">
                <Image src="/ilustrasi-hero.png" alt="Ilustrasi keamanan transaksi digital" fill priority className="object-contain" />
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
          <StatsCard stats={stats} />
        </div>
      </section>

      {/* WHAT IS */}
      <section className="bg-white py-8 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-4">Apa itu KawalTransaksi?</h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            KawalTransaksi adalah platform komunitas anti-penipuan digital Indonesia. Kami membantu Anda memverifikasi nomor HP, rekening bank, dan e-wallet sebelum bertransaksi — gratis, cepat, dan didukung laporan nyata dari komunitas.
          </p>
        </div>
      </section>

      <div className="bg-white overflow-hidden">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 sm:h-14 block">
          <path d="M0,0 C480,60 960,0 1440,40 L1440,60 L0,60 Z" fill="#f1f5f9" />
        </svg>
      </div>

      {/* HOW IT WORKS */}
      <section className="bg-slate-100 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Bagaimana KawalTransaksi Bekerja?</h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {HOW_IT_WORKS.map((item, i) => (
                <div key={i} className={i > 0 ? "lg:pl-8 lg:border-l border-slate-200" : ""}>
                  <p className="text-3xl font-black text-emerald-600 mb-2 leading-none">{item.number}</p>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug mb-2">{item.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="bg-slate-100 overflow-hidden">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 sm:h-14 block">
          <path d="M0,40 C360,0 1080,60 1440,20 L1440,60 L0,60 Z" fill="#ffffff" />
        </svg>
      </div>

      {/* RECENT REPORTS */}
      <section className="bg-white py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Laporan Masuk Terkini</h2>
            <Link
              href="/laporan-publik"
              className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-emerald-700 transition-colors whitespace-nowrap"
            >
              Lihat semua →
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">Belum ada laporan yang masuk.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentReports.map((report, i) => {
                const meta = getTargetMeta(report.targetType, report.bankName, report.walletName);
                const logoSrc = getPlatformLogo(report.targetType, report.bankName, report.walletName);
                const statusMap: Record<string, { label: string; className: string }> = {
                  verified: { label: "Terverifikasi", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  pending:  { label: "Pending",        className: "bg-amber-50 text-amber-700 border-amber-200" },
                };
                const statusStyle = statusMap[report.status] ?? statusMap.pending;
                const displayName = report.targetName ?? "Anonim";
                const displayNumber = report.targetValue;

                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Link
                      href={`/check/${encodeURIComponent(report.targetValue)}`}
                      className="block bg-white border border-slate-200 p-4 sm:p-5 rounded-xl hover:border-slate-300 hover:shadow-md transition-all group h-full"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${statusStyle.className}`}>
                          {statusStyle.label}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{formatDateID(report.createdAt)}</span>
                      </div>
                      <div className="mb-4">
                        <p className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors font-mono break-all">
                          {displayNumber}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 truncate">
                          A.N. {displayName}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border ${meta.bg} ${meta.color} ${meta.border}`}>
                          {logoSrc ? (
                            <Image src={logoSrc} alt={meta.label} width={14} height={14} className="object-contain rounded-sm" />
                          ) : (
                            <meta.icon className="w-3 h-3" />
                          )}
                          <span className="truncate max-w-[80px]">{meta.label}</span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="bg-white overflow-hidden">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 sm:h-14 block">
          <path d="M0,20 C360,60 1080,0 1440,50 L1440,60 L0,60 Z" fill="#f1f5f9" />
        </svg>
      </div>

      {/* CTA */}
      <section className="bg-slate-100 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">Berikan Kontribusi Anda</h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
            Bantu lindungi pengguna lain dengan melaporkan nomor yang mencurigakan. Setiap laporan berkontribusi pada ekosistem digital yang lebih aman.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/report"
              className="w-full sm:w-auto px-7 py-3 bg-emerald-600 text-white font-bold text-sm tracking-wide rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Buat Laporan Baru
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3 border-2 border-slate-300 bg-white text-slate-900 font-bold text-sm tracking-wide rounded-xl hover:border-slate-900 transition-colors"
            >
              Gabung Komunitas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}