import Link from "next/link";
import Image from "next/image";
import { Phone, Landmark, Wallet, ArrowRight } from "lucide-react";
import * as motion from "motion/react-client";
import { formatDateID, encodeSlug } from "@/core/utils";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const revalidate = 60;

const ewalletNames = ["gopay", "dana", "ovo", "shopeepay", "linkaja"];

const bankLogoMap: Record<string, string> = {
  bca: "/banks/bca.png",
  bni: "/banks/bni.png",
  bri: "/banks/bri.png",
  bsi: "/banks/bsi.png",
  cimb: "/banks/cimb.png",
  mandiri: "/banks/mandiri.png",
};

const ewalletLogoMap: Record<string, string> = {
  gopay: "/ewallets/gopay.png",
  dana: "/ewallets/dana.png",
  ovo: "/ewallets/ovo.png",
  shopeepay: "/ewallets/shopeepay.png",
  linkaja: "/ewallets/linkaja.png",
};

const HOW_IT_WORKS = [
  {
    number: "#1",
    title: "Komunitas Melapor",
    desc: "Laporan nomor HP, rekening, atau e-wallet mencurigakan dikumpulkan dari komunitas pengguna beserta bukti digital.",
  },
  {
    number: "#2",
    title: "Data Terkumpul",
    desc: "Ratusan laporan masuk dan disimpan ke database terpusat setiap harinya untuk diproses lebih lanjut.",
  },
  {
    number: "#3",
    title: "Verifikasi Robot & Moderator",
    desc: "Setiap laporan dianalisis otomatis oleh robot sistem kami dan ditinjau moderator sebelum dipublikasikan ke database.",
  },
  {
    number: "#4",
    title: "Hasil Tersedia Real-time",
    desc: "Data terverifikasi langsung bisa dicek seluruh pengguna secara gratis dan real-time.",
  },
];

const DEV_USE_CASES = [
  {
    title: "Aplikasi Fintech",
    desc: "Verifikasi nomor rekening dan e-wallet secara otomatis sebelum memproses transfer atau pembayaran. Integrasikan satu endpoint untuk mengurangi risiko fraud dan melindungi aset pengguna di platform Anda.",
  },
  {
    title: "Bot Telegram & WhatsApp",
    desc: "Tambahkan fitur pengecekan nomor langsung ke dalam bot percakapan Anda. Pengguna cukup mengirimkan nomor yang ingin dicek, dan bot akan membalas dengan status keamanan secara real-time.",
  },
  {
    title: "Platform E-Commerce",
    desc: "Lindungi ekosistem jual beli Anda dengan memvalidasi nomor rekening penjual sebelum pencairan dana diproses. Tingkatkan kepercayaan pembeli dan kurangi klaim penipuan di platform Anda.",
  },
  {
    title: "Sistem Verifikasi Pembayaran",
    desc: "Tambahkan lapisan keamanan ekstra pada alur checkout atau konfirmasi pembayaran. Sistem dapat memblokir atau memberikan peringatan otomatis ketika nomor tujuan transfer terindikasi penipuan.",
  },
  {
    title: "Aplikasi Pinjaman Online (P2P Lending)",
    desc: "Perkuat proses KYC dan verifikasi identitas peminjam sebelum pengajuan pinjaman disetujui. Minimalkan risiko gagal bayar akibat data palsu dengan mencocokkan nomor kontak terhadap database penipuan.",
  },
  {
    title: "Sistem CRM & Customer Service",
    desc: "Bekali agen customer service Anda dengan kemampuan verifikasi nomor secara langsung saat menangani aduan transaksi mencurigakan. Percepat proses investigasi dan tingkatkan akurasi penanganan kasus.",
  },
];

function getPlatformLogo(type: string, bankName: string | null): string | null {
  if (!bankName) return null;
  const key = bankName.toLowerCase();
  if (type === "ewallet" || ewalletNames.includes(key))
    return ewalletLogoMap[key] ?? null;
  if (type === "bank_account") return bankLogoMap[key] ?? null;
  return null;
}

function getTargetMeta(type: string, bankName: string | null) {
  const key = bankName?.toLowerCase() || "";
  if (type === "ewallet" || (type === "phone" && ewalletNames.includes(key))) {
    return {
      icon: Wallet,
      label: bankName ?? "E-Wallet",
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
    };
  }
  if (type === "bank_account") {
    return {
      icon: Landmark,
      label: bankName ?? "Rekening Bank",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    };
  }
  return {
    icon: Phone,
    label: "Nomor HP",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  };
}

function formatLoss(amount: number): string {
  if (amount === 0) return "Rp0";
  if (amount >= 1_000_000_000)
    return `Rp${(amount / 1_000_000_000).toFixed(1)} M+`;
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)} Jt+`;
  if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)} Rb+`;
  return `Rp${amount.toLocaleString("id-ID")}`;
}

interface ReportItem {
  id: string;
  target_number: string;
  target_name: string | null;
  target_type: string;
  bank_name: string | null;
  category: string;
  created_at: string;
  status: string;
}

interface Stats {
  total: number;
  verified: number;
  totalLoss: number;
}

async function getRecentReports(): Promise<ReportItem[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const res = await fetch(
      `${supabaseUrl}/rest/v1/reports?select=id,target_number,target_name,target_type,bank_name,category,created_at,status&status=neq.rejected&order=created_at.desc&limit=6`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getStats(): Promise<Stats> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_stats`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      next: { revalidate: 60 },
    });
    if (!res.ok) return { total: 0, verified: 0, totalLoss: 0 };
    const data = await res.json();
    return {
      total: data.total ?? 0,
      verified: data.verified ?? 0,
      totalLoss: Number(data.total_loss) ?? 0,
    };
  } catch {
    return { total: 0, verified: 0, totalLoss: 0 };
  }
}

async function getIsLoggedIn(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    return allCookies.some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"),
    );
  } catch {
    return false;
  }
}

function HowItWorksSteps() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
      {HOW_IT_WORKS.map((item, i) => (
        <div
          key={i}
          className={`${i > 0 ? "lg:pl-8 lg:border-l border-slate-200" : ""}`}
        >
          <p className="text-3xl font-black text-emerald-600 mb-2 leading-none">
            {item.number}
          </p>
          <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug mb-2">
            {item.title}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
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
        <div className="px-5 py-5 sm:px-8 sm:py-6 border-r border-b sm:border-b-0 border-slate-100">
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            Laporan
          </p>
          <p className="text-2xl sm:text-4xl font-black text-slate-900 leading-none tabular-nums">
            {stats.total}+
          </p>
          <p className="text-xs text-slate-500 mt-1.5 leading-snug">
            Kasus dilaporkan
          </p>
        </div>
        <div className="px-5 py-5 sm:px-8 sm:py-6 border-b sm:border-b-0 border-slate-100">
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            Verified
          </p>
          <p className="text-2xl sm:text-4xl font-black text-emerald-700 leading-none tabular-nums">
            {stats.verified}+
          </p>
          <p className="text-xs text-slate-500 mt-1.5 leading-snug">
            Terbukti penipuan
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 px-5 py-5 sm:px-8 sm:py-6 sm:border-l border-slate-100">
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            Kerugian
          </p>
          <p className="text-2xl sm:text-4xl font-black text-red-500 leading-none tabular-nums">
            {formatLoss(stats.totalLoss)}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 leading-snug">
            Total kerugian dilaporkan
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default async function HomePage() {
  const [recentReports, stats, isLoggedIn] = await Promise.all([
    getRecentReports(),
    getStats(),
    getIsLoggedIn(),
  ]);

  const lihatSemuaHref = isLoggedIn
    ? "/laporan-publik"
    : "/login?redirectTo=/laporan-publik";

  return (
    <main className="bg-white text-slate-900 font-sans overflow-x-hidden">
      {/* -- 1. HERO -- */}
      <section className="relative min-h-[500px] sm:min-h-[600px] flex items-stretch overflow-hidden bg-white">
        <div className="relative z-10 flex flex-col justify-center px-5 sm:px-12 md:pl-20 lg:pl-28 py-14 md:py-20 w-full md:w-[52%]">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] uppercase mb-5 sm:mb-6">
            Transaksi <span className="text-emerald-700 italic">Aman,</span>
            <br />
            Hati Tenang
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-sm mb-7 sm:mb-8">
            Verifikasi nomor HP, rekening bank, dan e-wallet dalam hitungan
            detik. Bersama komunitas, kami berkomitmen untuk mewujudkan
            ekosistem transaksi digital yang lebih aman di Indonesia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/cek-nomor"
              className="px-5 sm:px-6 py-3 sm:py-3.5 bg-slate-900 text-white font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
            >
              <Phone className="w-4 h-4" /> cek nomor hp
            </Link>
            <Link
              href="/cek-rekening"
              className="px-5 sm:px-6 py-3 sm:py-3.5 border-2 border-slate-200 text-slate-900 font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 hover:border-slate-900 transition-colors"
            >
              <Landmark className="w-4 h-4" /> cek rekening
            </Link>
          </div>
        </div>
        <div className="hidden md:flex relative w-[48%] items-center justify-start bg-white overflow-hidden pl-4">
          <div className="relative w-[460px] h-[460px]">
            <Image
              src="/poster.png"
              alt="Ilustrasi keamanan transaksi digital"
              fill
              priority
              fetchPriority="high"
              className="object-contain"
              sizes="(max-width: 768px) 0px, 460px"
            />
          </div>
        </div>
      </section>

      {/* -- STATS CARD -- desktop -- */}
      <div className="relative bg-white hidden sm:block">
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="w-full block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 C240,80 480,30 720,60 C960,90 1200,40 1440,65 L1440,100 L0,100 Z"
            fill="#f8fafc"
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 sm:px-6 z-10">
          <div className="max-w-4xl mx-auto">
            <StatsCard stats={stats} />
          </div>
        </div>
      </div>

      {/* -- STATS CARD -- mobile -- */}
      <div className="sm:hidden bg-slate-50 px-4 pt-4 pb-6">
        <StatsCard stats={stats} />
      </div>

      {/* -- 2. APA ITU KAWALTRANSAKSI -- */}
      <section className="bg-slate-50 pt-10 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-slate-900 mb-4 sm:mb-5">
            Apa itu KawalTransaksi?
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            KawalTransaksi adalah platform komunitas anti-penipuan digital
            Indonesia. Kami membantu Anda memverifikasi nomor HP, rekening bank,
            dan e-wallet sebelum bertransaksi -- gratis, cepat, dan didukung
            laporan nyata dari komunitas.
          </p>
        </div>
      </section>

      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full block bg-slate-50 -mb-1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,80 C360,20 720,65 1080,25 C1260,5 1380,45 1440,30 L1440,80 Z"
          fill="#ffffff"
        />
      </svg>

      {/* -- 3. CARA KERJA -- */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-slate-900">
              Bagaimana KawalTransaksi Bekerja?
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2">
              Berikut ilustrasi bagaimana KawalTransaksi mengidentifikasi
              penipuan.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <HowItWorksSteps />
          </motion.div>
        </div>
      </section>

      <svg
        viewBox="0 0 1440 70"
        preserveAspectRatio="none"
        className="w-full block bg-white -mb-1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,0 C240,60 480,20 720,45 C960,70 1200,30 1440,50 L1440,70 L0,70 Z"
          fill="#f8fafc"
        />
      </svg>

      {/* -- 4. LAPORAN MASUK TERKINI -- */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-2xl font-black tracking-tighter uppercase">
              laporan masuk terkini
            </h2>
            <Link
              href={lihatSemuaHref}
              className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-emerald-700 transition-colors whitespace-nowrap"
            >
              lihat semua ->
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentReports.map((report, i) => {
              const meta = getTargetMeta(report.target_type, report.bank_name);
              const logoSrc = getPlatformLogo(
                report.target_type,
                report.bank_name,
              );
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    href={`/check/${encodeSlug(report.target_number)}`}
                    className="block bg-white border border-slate-200 p-4 sm:p-5 rounded-lg hover:border-slate-300 hover:shadow-md transition-all group h-full"
                  >
                    <div className="flex justify-between items-start mb-4 sm:mb-5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${report.status === "verified" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : report.status === "withdrawn" ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                      >
                        {report.status === "verified"
                          ? "Terverifikasi"
                          : report.status === "withdrawn"
                            ? "Sedang Direvisi"
                            : "Menunggu"}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {formatDateID(report.created_at)}
                      </span>
                    </div>
                    <div className="mb-4 sm:mb-5">
                      <p className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors font-mono">
                        {report.target_number}
                      </p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                        a.n. {report.target_name || "anonymous"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${meta.bg} ${meta.color} ${meta.border}`}
                        >
                          {logoSrc ? (
                            <Image
                              src={logoSrc}
                              alt={meta.label}
                              width={14}
                              height={14}
                              className="object-contain rounded-sm"
                            />
                          ) : (
                            <meta.icon className="w-3 h-3" />
                          )}
                          <span className="truncate max-w-[70px] sm:max-w-[80px]">
                            {meta.label}
                          </span>
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate">
                          {report.category}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full block bg-slate-50 -mb-1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,80 C360,20 720,65 1080,25 C1260,5 1380,45 1440,30 L1440,80 Z"
          fill="#ffffff"
        />
      </svg>

      {/* -- 5. CTA -- */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase text-slate-900 mb-4">
            berikan kontribusi anda.
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed">
            Bantu lindungi pengguna lain dengan melaporkan nomor yang
            mencurigakan. Setiap laporan berkontribusi pada ekosistem digital
            yang lebih aman.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/report"
              className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-emerald-700 text-white font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Buat Laporan Baru
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 border-2 border-slate-200 text-slate-900 font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl hover:border-slate-900 transition-colors"
            >
              gabung komunitas
            </Link>
          </div>
        </div>
      </section>

      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full block bg-white -mb-1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,0 C360,60 720,20 1080,50 C1260,65 1380,35 1440,45 L1440,80 L0,80 Z"
          fill="#f8fafc"
        />
      </svg>

      {/* -- 6. DEVELOPER API -- */}
      <section className="bg-slate-50 py-16 sm:py-20 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">
                Untuk Developer
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-tight text-slate-900">
                Integrasikan Data
                <br />
                Anti-Penipuan ke Aplikasi Anda
              </h2>
              <p className="text-slate-500 text-sm sm:text-base mt-4 max-w-lg leading-relaxed">
                KawalTransaksi menyediakan REST API yang sederhana dan handal
                untuk memverifikasi nomor HP, rekening bank, dan e-wallet secara
                real-time. Gratis hingga 300 request per hari, tanpa kartu
                kredit.
              </p>
            </div>
            <Link
              href="/developer"
              className="shrink-0 w-full sm:w-auto text-center px-6 py-3 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold tracking-widest uppercase rounded-xl transition-colors"
            >
              Lihat Developer API
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden mb-10 sm:mb-12">
            {[
              {
                label: "Gratis",
                value: "300 req/hari",
                sub: "Tanpa kartu kredit",
              },
              {
                label: "Endpoint",
                value: "REST API",
                sub: "HTTPS, format JSON",
              },
              {
                label: "Data",
                value: "Terverifikasi",
                sub: "Dari laporan komunitas",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white px-3 sm:px-6 py-4 sm:py-5 text-center"
              >
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {item.label}
                </p>
                <p className="text-sm sm:text-base font-black text-slate-900 mb-0.5">
                  {item.value}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                  {item.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Use cases */}
          <div className="mb-10 sm:mb-12">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              Cocok digunakan untuk
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-7">
              {DEV_USE_CASES.map((item, i) => (
                <div key={i}>
                  <p className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Code example */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-700">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Contoh Penggunaan
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="px-4 sm:px-6 py-5 overflow-x-auto">
              <pre className="text-xs sm:text-sm text-emerald-300 leading-relaxed font-mono whitespace-pre">{`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789&type=phone" \\
  -H "X-API-Key: kt_live_your_key_here"`}</pre>
              <div className="mt-5 pt-5 border-t border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Response
                </p>
                <pre className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono whitespace-pre">{`{
  "success": true,
  "data": {
    "number": "08123456789",
    "status": "danger",
    "verified_reports": 3,
    "total_loss": 5000000
  },
  "meta": {
    "requests_remaining": 297,
    "daily_limit": 300
  }
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
