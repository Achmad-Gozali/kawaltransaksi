import { notFound } from "next/navigation";
import { createClient } from "@/core/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft, PlusCircle, AlertTriangle, Clock, Lock,
  ShieldAlert, ShieldX, Flame,
} from "lucide-react";
import { formatNum, decodeSlug } from "@/core/utils";
import ShareButtons from "@/features/check/ShareButtons";
import NumberCard from "@/features/check/components/NumberCard";
import ReportList from "@/features/check/components/ReportList";

export const revalidate = 60;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.kawaltransaksi.com';

interface CheckPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; bank?: string; wallet?: string }>;
}

async function fetchCheckPageData(number: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/check/${number}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { reports: [], linked: [] };
    const json = await res.json();
    return json.data ?? { reports: [], linked: [] };
  } catch {
    return { reports: [], linked: [] };
  }
}

async function fetchBlacklistData(number: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/blacklist/${number}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { blacklist: null, trend: null };
    const json = await res.json();
    return json.data ?? { blacklist: null, trend: null };
  } catch {
    return { blacklist: null, trend: null };
  }
}

export async function generateMetadata({ params }: CheckPageProps): Promise<Metadata> {
  const { slug } = await params;
  const realNumber = decodeSlug(slug);
  if (!realNumber) return { title: "Halaman tidak ditemukan - KawalTransaksi" };

  const pageData = await fetchCheckPageData(realNumber);
  const reports  = (pageData.reports as any[]).filter((r: any) => r.status !== "withdrawn");

  const verifiedCount = reports.filter((r: any) => r.status === "verified").length;
  const pendingCount  = reports.filter((r: any) => r.status === "pending").length;
  const totalLoss     = reports.reduce((sum: number, r: any) => sum + (Number(r.loss_amount) || 0), 0);
  const totalReports  = reports.length;

  const formatLoss = (n: number) => {
    if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
    if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} juta`;
    if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} ribu`;
    return `Rp ${n}`;
  };

  const formattedNumber = realNumber.replace(/(\d{4})(?=\d)/g, "$1 ");

  let title: string;
  let description: string;

  if (verifiedCount > 0) {
    title = `Nomor ${formattedNumber} - Terindikasi Penipuan (${verifiedCount} Laporan Terverifikasi) | KawalTransaksi`;
    description = totalLoss > 0
      ? `Nomor ${formattedNumber} dilaporkan ${totalReports}x sebagai penipu dengan ${verifiedCount} laporan terverifikasi dan total kerugian ${formatLoss(totalLoss)}. Cek detail laporan sebelum bertransaksi.`
      : `Nomor ${formattedNumber} dilaporkan ${totalReports}x sebagai penipu dengan ${verifiedCount} laporan terverifikasi. Jangan bertransaksi dengan nomor ini.`;
  } else if (pendingCount > 0) {
    title = `Nomor ${formattedNumber} - Dalam Investigasi (${pendingCount} Laporan Masuk) | KawalTransaksi`;
    description = `Nomor ${formattedNumber} sedang dalam proses verifikasi dengan ${pendingCount} laporan masuk. Tetap waspada sebelum melakukan transaksi.`;
  } else {
    title = `Cek Nomor ${formattedNumber} - Tidak Ada Laporan | KawalTransaksi`;
    description = `Nomor ${formattedNumber} belum memiliki laporan penipuan di database KawalTransaksi. Tetap waspada dan laporkan jika kamu menemukan aktivitas mencurigakan.`;
  }

  return {
    title, description,
    openGraph: { title, description, type: "website", locale: "id_ID", siteName: "KawalTransaksi", url: `https://kawaltransaksi.com/check/${slug}` },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `https://kawaltransaksi.com/check/${slug}` },
  };
}

function formatTimestamp(date: Date): string {
  const diffMs  = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  if (diffSec < 60)  return "baru saja";
  if (diffMin < 60)  return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const waspadaChecklist = [
  "Minta transfer atau DP duluan sebelum barang/jasa dikirim",
  "Harga terlalu murah atau tidak masuk akal",
  'Menekan untuk segera bayar / "stok terbatas"',
  "Minta kode OTP, PIN, atau data pribadi",
  "Menolak video call atau bertemu langsung untuk verifikasi",
  "Rekening atas nama berbeda dengan identitas penjual",
];

const bankNameMap: Record<string, string> = {
  bca: "BCA", bri: "BRI", bni: "BNI", mandiri: "Mandiri",
  cimb: "CIMB Niaga", cimbniaga: "CIMB Niaga", bsi: "BSI",
  danamon: "Danamon", permata: "Permata", ocbcnisp: "OCBC NISP",
  ocbc: "OCBC NISP", panin: "Panin", mega: "Mega", btn: "BTN",
  jago: "Jago", seabank: "SeaBank", lainnya: "Bank Lainnya",
};

const walletNameMap: Record<string, string> = {
  gopay: "GoPay", dana: "DANA", ovo: "OVO",
  shopeepay: "ShopeePay", shopee: "ShopeePay",
  linkaja: "LinkAja", lainnya: "E-Wallet Lainnya",
};

interface CarrierInfo { carrier: string; type: "mobile" | "fixed" | "unknown" }

const INDONESIAN_PREFIXES: { prefix: string; carrier: string; type: "mobile" | "fixed" }[] = [
  { prefix: "0811", carrier: "Telkomsel", type: "mobile" },
  { prefix: "0812", carrier: "Telkomsel", type: "mobile" },
  { prefix: "0813", carrier: "Telkomsel", type: "mobile" },
  { prefix: "0821", carrier: "Telkomsel", type: "mobile" },
  { prefix: "0822", carrier: "Telkomsel", type: "mobile" },
  { prefix: "0823", carrier: "Telkomsel", type: "mobile" },
  { prefix: "0851", carrier: "Telkomsel (by.U)", type: "mobile" },
  { prefix: "0852", carrier: "Telkomsel", type: "mobile" },
  { prefix: "0853", carrier: "Telkomsel", type: "mobile" },
  { prefix: "0814", carrier: "Indosat Ooredoo", type: "mobile" },
  { prefix: "0815", carrier: "Indosat Ooredoo", type: "mobile" },
  { prefix: "0816", carrier: "Indosat Ooredoo", type: "mobile" },
  { prefix: "0855", carrier: "Indosat Ooredoo", type: "mobile" },
  { prefix: "0856", carrier: "Indosat Ooredoo", type: "mobile" },
  { prefix: "0857", carrier: "Indosat Ooredoo", type: "mobile" },
  { prefix: "0858", carrier: "Indosat Ooredoo", type: "mobile" },
  { prefix: "0817", carrier: "XL Axiata", type: "mobile" },
  { prefix: "0818", carrier: "XL Axiata", type: "mobile" },
  { prefix: "0819", carrier: "XL Axiata", type: "mobile" },
  { prefix: "0859", carrier: "XL Axiata", type: "mobile" },
  { prefix: "0877", carrier: "XL Axiata", type: "mobile" },
  { prefix: "0878", carrier: "XL Axiata", type: "mobile" },
  { prefix: "0831", carrier: "Axis (XL)", type: "mobile" },
  { prefix: "0832", carrier: "Axis (XL)", type: "mobile" },
  { prefix: "0833", carrier: "Axis (XL)", type: "mobile" },
  { prefix: "0838", carrier: "Axis (XL)", type: "mobile" },
  { prefix: "0895", carrier: "Tri (3)", type: "mobile" },
  { prefix: "0896", carrier: "Tri (3)", type: "mobile" },
  { prefix: "0897", carrier: "Tri (3)", type: "mobile" },
  { prefix: "0898", carrier: "Tri (3)", type: "mobile" },
  { prefix: "0899", carrier: "Tri (3)", type: "mobile" },
  { prefix: "0881", carrier: "Smartfren", type: "mobile" },
  { prefix: "0882", carrier: "Smartfren", type: "mobile" },
  { prefix: "0883", carrier: "Smartfren", type: "mobile" },
  { prefix: "0884", carrier: "Smartfren", type: "mobile" },
  { prefix: "0885", carrier: "Smartfren", type: "mobile" },
  { prefix: "0886", carrier: "Smartfren", type: "mobile" },
  { prefix: "0887", carrier: "Smartfren", type: "mobile" },
  { prefix: "0888", carrier: "Smartfren", type: "mobile" },
  { prefix: "0889", carrier: "Smartfren", type: "mobile" },
  { prefix: "0848", carrier: "Net1 Indonesia", type: "mobile" },
  { prefix: "0868", carrier: "Net1 Indonesia", type: "mobile" },
  { prefix: "0828", carrier: "Ceria", type: "mobile" },
  { prefix: "0274", carrier: "Telkom (Yogyakarta)", type: "fixed" },
  { prefix: "0411", carrier: "Telkom (Makassar)", type: "fixed" },
  { prefix: "021", carrier: "Telkom (Jakarta)", type: "fixed" },
  { prefix: "022", carrier: "Telkom (Bandung)", type: "fixed" },
  { prefix: "024", carrier: "Telkom (Semarang)", type: "fixed" },
  { prefix: "031", carrier: "Telkom (Surabaya)", type: "fixed" },
  { prefix: "061", carrier: "Telkom (Medan)", type: "fixed" },
  { prefix: "0800", carrier: "Telkom IndiHome", type: "fixed" },
];

const SORTED_PREFIXES = [...INDONESIAN_PREFIXES].sort((a, b) => b.prefix.length - a.prefix.length);

function detectCarrier(phone: string): CarrierInfo | null {
  let normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("62")) normalized = "0" + normalized.slice(2);
  if (normalized.length < 5) return null;
  for (const entry of SORTED_PREFIXES) {
    if (normalized.startsWith(entry.prefix)) return { carrier: entry.carrier, type: entry.type };
  }
  return null;
}

type BlacklistLevel = "medium" | "high" | "critical";

const blacklistConfig: Record<BlacklistLevel, { label: string; bg: string; border: string; text: string; icon: React.ElementType }> = {
  medium:   { label: "Terindikasi Penipu",    bg: "bg-amber-50",  border: "border-amber-300",  text: "text-amber-700",  icon: AlertTriangle },
  high:     { label: "Penipu Terkonfirmasi",  bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", icon: ShieldAlert },
  critical: { label: "Penipu Berbahaya",      bg: "bg-red-50",    border: "border-red-300",    text: "text-red-700",    icon: ShieldX },
};

function BlacklistBadge({ level }: { level: BlacklistLevel }) {
  const cfg  = blacklistConfig[level];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function GatedContent({ isLoggedIn, label, children, minHeight }: { isLoggedIn: boolean; label: string; children: React.ReactNode; minHeight?: string }) {
  if (isLoggedIn) return <>{children}</>;
  return (
    <div className="relative overflow-hidden rounded-xl" style={minHeight ? { minHeight } : {}}>
      <div className="blur-[2px] select-none pointer-events-none" aria-hidden="true">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white/20 via-white/70 to-white/90">
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shadow-lg">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <Link href="/login" className="mt-1 inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
            Login untuk melihat
          </Link>
        </div>
      </div>
    </div>
  );
}

function CtaShareCard({ slug, shareText }: { slug: string; shareText: string }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-sm font-semibold text-white mb-1">Pernah kena tipu nomor ini?</p>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">Satu laporan dari kamu bisa melindungi ribuan orang.</p>
        <Link href="/report" className="flex items-center justify-center gap-2 w-full py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold rounded-lg transition-colors">
          <PlusCircle className="w-3.5 h-3.5" /> Buat laporan
        </Link>
      </div>
      <div className="bg-white px-5 py-4 sm:px-6">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 font-medium">Sebarkan peringatan</p>
        <ShareButtons slug={slug} shareText={shareText} />
      </div>
    </div>
  );
}

export default async function CheckPage({ params, searchParams }: CheckPageProps) {
  const { slug }               = await params;
  const { type, bank, wallet } = await searchParams;

  if (!slug || slug.length > 50) notFound();

  const realNumber = decodeSlug(slug);
  if (!realNumber || !/^\d+$/.test(realNumber)) notFound();

  const defaultType       = type === "bank" ? "bank_account" : type === "ewallet" ? "ewallet" : "phone";
  const hasTypeParam      = !!type;
  const defaultBankName   = bank   ? (bankNameMap[bank]   ?? null) : null;
  const defaultWalletName = wallet ? (walletNameMap[wallet] ?? null) : null;

  const checkedAt = new Date();
  const supabase  = await createClient();

  const [
    { data: { user } },
    pageData,
    blacklistTrendData,
  ] = await Promise.all([
    supabase.auth.getUser(),
    fetchCheckPageData(realNumber),
    fetchBlacklistData(realNumber),
  ]);

  const isLoggedIn    = !!user;
  const blacklist     = blacklistTrendData.blacklist ?? null;
  const isViral       = blacklistTrendData.trend?.is_viral ?? false;
  const viralCount    = blacklistTrendData.trend?.report_count ?? 0;
  const allReports    = (pageData?.reports as any[]) ?? [];
  const linkedReports = (pageData?.linked  as any[]) ?? [];

  const linkedHasVerified = linkedReports.some((r: any) => r.status === "verified");
  const reports = allReports.filter(r => r.status !== "withdrawn" && r.status !== "rejected");
  const withdrawnReports  = allReports.filter(r => r.status === "withdrawn");
  const hasWithdrawn      = withdrawnReports.length > 0;

  const verifiedReports = reports.filter(r => r.status === "verified");
  const pendingReports  = reports.filter(r => r.status === "pending");
  const verifiedCount   = verifiedReports.length;
  const totalLoss       = reports.reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0);
  const hasOtherVictims = reports.some(r => r.has_other_victims === "yes");

  const now = checkedAt.getTime();
  const thirtyDaysAgo   = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const recentReports   = reports.filter(r => new Date(r.created_at) >= thirtyDaysAgo);
  const uniquePlatforms = Array.from(new Set(reports.map(r => r.platform).filter(Boolean)));
  const multiVictimCount = reports.filter(r => r.has_other_victims === "yes").length;

  const isPhoneNumber = defaultType === "phone" && !defaultBankName && !defaultWalletName;
  const carrierInfo   = isPhoneNumber ? detectCarrier(realNumber) : null;

  const riskBadges: { label: string; color: string }[] = [];
  if (recentReports.length >= 3)
    riskBadges.push({ label: `Dilaporkan ${recentReports.length}x dalam 30 hari`, color: "bg-red-50 text-red-700 border-red-200" });
  if (totalLoss >= 10_000_000)
    riskBadges.push({ label: `Kerugian besar -- ${new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(totalLoss)}`, color: "bg-orange-50 text-orange-700 border-orange-200" });
  if (multiVictimCount >= 2)
    riskBadges.push({ label: `${multiVictimCount} laporan sebut ada korban lain`, color: "bg-amber-50 text-amber-700 border-amber-200" });
  if (uniquePlatforms.length >= 2)
    riskBadges.push({ label: `Aktif di ${uniquePlatforms.length} platform berbeda`, color: "bg-slate-100 text-slate-600 border-slate-200" });
  if (isViral)
    riskBadges.push({ label: ` Sedang viral -- ${viralCount} laporan dalam 24 jam`, color: "bg-red-50 text-red-700 border-red-200" });

  let status: "safe" | "warning" | "danger" = "safe";
  if (verifiedCount > 0)         status = "danger";
  else if (pendingReports.length > 0) status = "warning";
  else if (hasWithdrawn)         status = "warning";
  else if (linkedReports.length > 0)  status = "warning";

  const statusConfig = {
    danger: {
      barBg: "bg-red-50 border-b border-red-100", barLabel: "text-red-800", barDesc: "text-red-600",
      dotBg: "bg-red-500", nameBadgeBg: "bg-red-50", nameBadgeText: "text-red-700", nameBadgeBorder: "border-red-200",
      verdict: "Terindikasi penipuan", verdictSub: `${verifiedCount} laporan telah diverifikasi oleh sistem & komunitas.`,
    },
    warning: {
      barBg: linkedHasVerified ? "bg-red-50 border-b border-red-100" : "bg-amber-50 border-b border-amber-100",
      barLabel: linkedHasVerified ? "text-red-800" : "text-amber-900",
      barDesc: linkedHasVerified ? "text-red-600" : "text-amber-700",
      dotBg: linkedHasVerified ? "bg-red-500" : "bg-amber-500",
      nameBadgeBg: linkedHasVerified ? "bg-red-50" : "bg-amber-50",
      nameBadgeText: linkedHasVerified ? "text-red-800" : "text-amber-800",
      nameBadgeBorder: linkedHasVerified ? "border-red-200" : "border-amber-200",
      verdict: hasWithdrawn && pendingReports.length === 0 && verifiedCount === 0
        ? "Ada riwayat laporan" : linkedHasVerified ? "Terkait pelaku terverifikasi" : "Dalam investigasi",
      verdictSub: hasWithdrawn && pendingReports.length === 0 && verifiedCount === 0
        ? "Laporan untuk nomor ini sedang dalam proses revisi oleh pelapor."
        : linkedHasVerified
          ? "Nomor ini terbukti terkait pelaku yang sudah diverifikasi. Hindari bertransaksi."
          : `${pendingReports.length} laporan masuk sedang diverifikasi moderator.`,
    },
    safe: {
      barBg: "bg-emerald-50 border-b border-emerald-100", barLabel: "text-emerald-900", barDesc: "text-emerald-700",
      dotBg: "bg-emerald-500", nameBadgeBg: "bg-emerald-50", nameBadgeText: "text-emerald-800", nameBadgeBorder: "border-emerald-200",
      verdict: "Tidak ada laporan", verdictSub: "Nomor ini bersih di database kami. Tetap waspada.",
    },
  };

  const config = statusConfig[status];

  const shareText = status === "danger"
    ? `[!] waspada! nomor ${formatNum(realNumber)} terindikasi penipu dengan ${verifiedCount} laporan terverifikasi. cek di kawaltransaksi:`
    : status === "warning"
      ? `[!] nomor ${formatNum(realNumber)} sedang dalam proses verifikasi laporan penipuan. cek di kawaltransaksi:`
      : `[OK] nomor ${formatNum(realNumber)} aman -- belum ada laporan penipuan di kawaltransaksi:`;

  const verificationSteps = linkedHasVerified && reports.length > 0 && verifiedCount === 0
    ? [{ label: "Nomor ditemukan", done: true }, { label: "Terkait laporan terverifikasi", done: true }, { label: "Laporan langsung menunggu review", done: false }]
    : linkedHasVerified && reports.length === 0
      ? [{ label: "Nomor ditemukan", done: true }, { label: "Terkait laporan terverifikasi", done: true }, { label: "Belum ada laporan langsung", done: false }]
      : [
          { label: "Laporan diterima",       done: allReports.length > 0 },
          { label: "Dalam review moderator", done: status === "warning" || status === "danger" },
          { label: "Terverifikasi",          done: status === "danger" },
        ];

  const relatedEntries: { number: string; type: string; bank: string | null; name: string | null }[] = [];
  const seenNumbers = new Set<string>();
  allReports.forEach((r: any) => {
    if (!Array.isArray(r.target_numbers)) return;
    r.target_numbers.forEach((item: any) => {
      if (typeof item === "object" && item !== null && item.number) {
        if (item.number !== realNumber && !seenNumbers.has(item.number)) {
          seenNumbers.add(item.number);
          relatedEntries.push({ number: item.number, type: item.type ?? "phone", bank: item.bank ?? null, name: item.name ?? null });
        }
      } else if (typeof item === "string" && item !== realNumber && !seenNumbers.has(item)) {
        seenNumbers.add(item);
        relatedEntries.push({ number: item, type: "phone", bank: null, name: null });
      }
    });
  });

  const buildTypeParam = (type: string, bank: string | null) => {
    if (type === "bank_account") {
      const bankKey = bank ? bank.toLowerCase().replace(/\s/g, "").replace(/[^a-z]/g, "") : "";
      return `?type=bank${bankKey ? `&bank=${bankKey}` : ""}`;
    }
    if (type === "ewallet") {
      const walletKey = bank ? bank.toLowerCase().replace(/\s/g, "").replace(/[^a-z]/g, "") : "";
      return `?type=ewallet${walletKey ? `&wallet=${walletKey}` : ""}`;
    }
    return "?type=phone";
  };

  const typeLabel: Record<string, string> = { phone: "Nomor HP", bank_account: "Rekening Bank", ewallet: "E-Wallet" };

  const formatLossForSchema = (n: number) => {
    if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} miliar`;
    if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} juta`;
    if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} ribu`;
    return `Rp ${n}`;
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Apakah nomor ${formatNum(realNumber)} penipu?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            status === "danger"
              ? `Ya, nomor ${formatNum(realNumber)} terindikasi penipu. Terdapat ${verifiedCount} laporan terverifikasi${totalLoss > 0 ? ` dengan total kerugian ${formatLossForSchema(totalLoss)}` : ""}. Hindari bertransaksi dengan nomor ini.`
              : status === "warning"
                ? `Nomor ${formatNum(realNumber)} sedang dalam proses investigasi. Terdapat laporan masuk yang belum selesai diverifikasi. Tetap waspada sebelum bertransaksi.`
                : `Nomor ${formatNum(realNumber)} belum memiliki laporan penipuan terverifikasi di database KawalTransaksi. Tetap waspada dan laporkan jika menemukan aktivitas mencurigakan.`,
        },
      },
      {
        "@type": "Question",
        name: `Berapa laporan untuk nomor ${formatNum(realNumber)}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            reports.length > 0
              ? `Nomor ${formatNum(realNumber)} memiliki ${reports.length} laporan masuk, dengan ${verifiedCount} laporan terverifikasi.`
              : `Nomor ${formatNum(realNumber)} belum memiliki laporan penipuan di database KawalTransaksi.`,
        },
      },
      {
        "@type": "Question",
        name: "Bagaimana cara melaporkan nomor penipu?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Kamu bisa melaporkan nomor penipu secara gratis di KawalTransaksi. Kunjungi kawaltransaksi.com/report, isi data nomor penipu, kronologi kejadian, dan bukti transfer. Laporan akan diverifikasi oleh tim moderator.",
        },
      },
    ],
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: "https://kawaltransaksi.com" },
      { "@type": "ListItem", position: 2, name: "Cek Nomor", item: "https://kawaltransaksi.com/cek-nomor" },
      { "@type": "ListItem", position: 3, name: `Nomor ${formatNum(realNumber)}`, item: `https://kawaltransaksi.com/check/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

        <div className="sm:hidden bg-white border-b border-slate-100 sticky top-16 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link href="/cek-nomor" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Link>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">KawalTransaksi</span>
          </div>
        </div>

        <div className={`${config.barBg} px-4 sm:px-6 py-3`}>
          <div className="max-w-5xl mx-auto flex items-center gap-2 flex-wrap">
            <div className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${config.dotBg}`} />
            <span className={`text-xs font-semibold uppercase tracking-widest ${config.barLabel}`}>{config.verdict}</span>
            <span className={`text-xs ${config.barDesc} hidden sm:inline`}>-- {config.verdictSub}</span>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" /> {formatTimestamp(checkedAt)}
            </span>
          </div>
          <div className="max-w-5xl mx-auto sm:hidden mt-1">
            <span className={`text-xs ${config.barDesc}`}>{config.verdictSub}</span>
          </div>
        </div>

        {blacklist && (
          <div className={`px-4 sm:px-6 py-3 border-b ${
            blacklist.level === "critical" ? "bg-red-600 border-red-700" :
            blacklist.level === "high"     ? "bg-orange-500 border-orange-600" :
                                             "bg-amber-400 border-amber-500"
          }`}>
            <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
              {blacklist.level === "critical" ? <ShieldX className="w-4 h-4 text-white shrink-0" /> :
               blacklist.level === "high"     ? <ShieldAlert className="w-4 h-4 text-white shrink-0" /> :
                                                <AlertTriangle className="w-4 h-4 text-white shrink-0" />}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {blacklist.level === "critical" ? "[!] Penipu Berbahaya -- Jangan Bertransaksi" :
                   blacklist.level === "high"     ? "Penipu Terkonfirmasi" :
                                                    "Terindikasi Penipu"}
                </span>
                <span className="text-xs text-white/80 ml-2">
                  {blacklist.unique_reporters} orang berbeda melaporkan nomor ini
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24">

          {reports.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
                <p className="text-2xl sm:text-4xl font-bold leading-none text-slate-900 tabular-nums">{reports.length}</p>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.1em]">Laporan masuk</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
                <p className={`text-2xl sm:text-4xl font-bold leading-none tabular-nums ${totalLoss > 0 ? "text-red-600" : "text-slate-300"}`}>
                  {totalLoss > 0 ? new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(totalLoss) : "--"}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.1em]">Total kerugian</p>
              </div>
              <div className={`rounded-xl border p-3 sm:p-5 ${hasOtherVictims ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
                <p className={`text-2xl sm:text-4xl font-bold leading-none ${hasOtherVictims ? "text-amber-500" : "text-slate-300"}`}>
                  {hasOtherVictims ? "!" : "--"}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.1em]">Multi korban</p>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">

            <NumberCard
              reports={reports} realNumber={realNumber} config={config}
              defaultType={defaultType} defaultBankName={defaultBankName}
              defaultWalletName={defaultWalletName} hasTypeParam={hasTypeParam}
              isLoggedIn={isLoggedIn} carrierInfo={carrierInfo}
            />

            {(riskBadges.length > 0 || blacklist) && (
              <div className="flex flex-wrap gap-2">
                {blacklist && <BlacklistBadge level={blacklist.level as BlacklistLevel} />}
                {riskBadges.map((badge, i) => (
                  <span key={i} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${badge.color}`}>
                    {badge.label}
                  </span>
                ))}
              </div>
            )}

            {linkedReports.length > 0 && reports.length === 0 && (
              <div className={`rounded-xl overflow-hidden border ${linkedHasVerified ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                <div className={`px-4 sm:px-5 py-4 border-b ${linkedHasVerified ? "border-red-100" : "border-amber-100"}`}>
                  <p className={`text-xs leading-relaxed ${linkedHasVerified ? "text-red-700" : "text-amber-700"}`}>
                    {linkedHasVerified
                      ? "Nomor ini disebutkan dalam laporan yang telah diverifikasi. Berdasarkan bukti yang ada, pelaku diketahui menggunakan beberapa nomor secara bergantian. Kami menyarankan untuk tidak melanjutkan transaksi."
                      : "Meski belum ada laporan langsung untuk nomor ini, nomor ini disebutkan sebagai nomor milik pelaku yang sudah dilaporkan. Pelaku yang sama diduga menggunakan beberapa nomor berbeda."}
                  </p>
                </div>
                <div className={`divide-y ${linkedHasVerified ? "divide-red-100" : "divide-amber-100"}`}>
                  {linkedReports.map((r: any, i: number) => (
                    <a key={i} href={`/check/${r.target_number}`}
                      className={`flex items-center justify-between px-4 sm:px-5 py-3.5 transition-colors group ${linkedHasVerified ? "hover:bg-red-100/40" : "hover:bg-amber-100/40"}`}>
                      <div>
                        <p className={`text-sm font-mono font-semibold tracking-wide ${linkedHasVerified ? "text-red-900" : "text-amber-900"}`}>
                          {r.target_number.replace(/(\d{4})(?=\d)/g, "$1 ")}
                        </p>
                        <p className={`text-xs mt-0.5 ${linkedHasVerified ? "text-red-600" : "text-amber-600"}`}>
                          {r.status === "verified" ? "Laporan terverifikasi" : "Laporan dalam investigasi"}
                          {r.target_name ? ` - a.n. ${r.target_name}` : ""}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold whitespace-nowrap ${linkedHasVerified ? "text-red-600 group-hover:text-red-800" : "text-amber-700 group-hover:text-amber-900"}`}>
                        Lihat &rarr;
                      </span>
                    </a>
                  ))}
                </div>
                <div className={`px-4 sm:px-5 py-3 ${linkedHasVerified ? "bg-red-100/30" : "bg-amber-100/30"}`}>
                  <p className={`text-xs ${linkedHasVerified ? "text-red-600" : "text-amber-600"}`}>
                    {linkedHasVerified
                      ? "Perhatian: Pelaku diketahui menggunakan beberapa nomor secara bergantian untuk menghindari deteksi."
                      : "Waspada! Penipu sering berganti nomor untuk menghindari deteksi."}
                  </p>
                </div>
              </div>
            )}

            {status === "safe" && linkedReports.length === 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2 font-medium px-0.5">Tetap waspada</p>
                <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <p className="text-xs font-medium text-amber-800">Meski belum ada laporan, waspada jika nomor ini...</p>
                  </div>
                  <ul className="divide-y divide-amber-100">
                    {waspadaChecklist.map((item, i) => (
                      <li key={i} className="px-4 py-3 flex items-start gap-2.5">
                        <span className="text-amber-400 mt-0.5 shrink-0">-</span>
                        <p className="text-xs text-amber-900 leading-relaxed">{item}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-3 border-t border-amber-100 bg-amber-100/30">
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Penipu bisa pakai nomor baru yang belum terdata. Jika ragu,{" "}
                      <Link href="/report" className="font-semibold underline underline-offset-2 hover:text-amber-900">laporkan sekarang</Link>{" "}
                      untuk melindungi orang lain.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {reports.length > 0 && (
              <GatedContent isLoggedIn={isLoggedIn} label="Login untuk lihat kronologi & bukti lengkap" minHeight="200px">
                <ReportList reports={reports} hasWithdrawn={hasWithdrawn}
                  hasLinkedReports={linkedReports.length > 0 && reports.length === 0}
                  linkedHasVerified={linkedHasVerified} />
              </GatedContent>
            )}

            {reports.length === 0 && (
              <ReportList reports={reports} hasWithdrawn={hasWithdrawn}
                hasLinkedReports={linkedReports.length > 0 && reports.length === 0}
                linkedHasVerified={linkedHasVerified} />
            )}

            {relatedEntries.length > 0 && (
              <GatedContent isLoggedIn={isLoggedIn} label="Login untuk lihat nomor lain terkait pelaku" minHeight="160px">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2 font-medium px-0.5">Nomor lain terkait pelaku ini</p>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                      <p className="text-xs text-slate-500 leading-relaxed">Pelapor menyebutkan bahwa pelaku yang sama juga menggunakan nomor-nomor berikut.</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {relatedEntries.map((entry, i) => (
                        <a key={i} href={`/check/${entry.number}${buildTypeParam(entry.type, entry.bank)}`}
                          className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                          <div>
                            <span className="text-sm font-mono font-semibold text-slate-700 tracking-wide">
                              {entry.number.replace(/(\d{4})(?=\d)/g, "$1 ")}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {[entry.bank ? entry.bank : (typeLabel[entry.type] ?? "Nomor HP"), entry.name ? `a.n. ${entry.name}` : null].filter(Boolean).join(" - ")}
                            </p>
                          </div>
                          <span className="text-xs text-emerald-600 font-semibold group-hover:underline whitespace-nowrap">Cek &rarr;</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </GatedContent>
            )}

            {(allReports.length > 0 || linkedHasVerified) && !(hasWithdrawn && reports.length === 0) && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2 font-medium px-0.5">Status verifikasi</p>
                <div className="bg-white rounded-xl border border-slate-200 px-4 sm:px-6 py-4 sm:py-5">
                  <div className="flex relative">
                    {verificationSteps.map((step, i) => (
                      <div key={i} className="relative flex flex-col items-center flex-1">
                        {i < verificationSteps.length - 1 && (
                          <div className={`absolute top-1.5 left-1/2 w-full h-[2px] z-0 ${verificationSteps[i + 1].done ? "bg-emerald-500" : "bg-slate-200"}`} />
                        )}
                        <div className={`relative z-10 w-3 h-3 rounded-full border-2 transition-colors mb-2 ${step.done ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300"}`} />
                        <p className={`text-[10px] text-center leading-snug px-1 ${step.done ? "text-slate-700 font-medium" : "text-slate-400"}`}>{step.label}</p>
                      </div>
                    ))}
                  </div>
                  {linkedHasVerified && verifiedCount === 0 && (
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-4 pt-3 border-t border-slate-100">
                      {reports.length > 0
                        ? "Laporan di nomor ini sedang direview moderator. Namun nomor ini sudah terbukti terkait pelaku yang telah diverifikasi -- tetap waspada."
                        : "Belum ada laporan langsung di nomor ini. Namun nomor ini sudah terbukti terkait pelaku yang telah diverifikasi -- hindari bertransaksi."}
                    </p>
                  )}
                </div>
              </div>
            )}

            <CtaShareCard slug={slug} shareText={shareText} />
          </div>
        </div>
      </div>
    </>
  );
}