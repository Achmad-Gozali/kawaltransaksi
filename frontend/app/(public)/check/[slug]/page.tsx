import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft, PlusCircle, AlertTriangle, Clock, Lock,
  ShieldAlert, ShieldX,
} from "lucide-react";
import { formatNum, decodeSlug, safeJsonLd } from "@/core/utils";
import { forwardedClientHeaders } from "@/core/http";
import ShareButtons from "@/features/check/ShareButtons";
import NumberCard from "@/features/check/components/NumberCard";
import ReportList from "@/features/check/components/ReportList";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface CheckPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; bank?: string; wallet?: string; token?: string }>;
}

/**
 * NMID QRIS alfanumerik (mis. "ID1021125405972") -- TIDAK BOLEH di-strip
 * jadi digit saja seperti nomor HP/rekening/ewallet, atau NMID-nya rusak.
 * Auto-detect: ?type=qris ATAU slug mengandung huruf (satu-satunya target
 * type yang bisa punya huruf -- phone/bank_account/ewallet submit selalu
 * di-strip jadi digit murni sebelum disimpan).
 */
function resolveRealNumber(decodedSlug: string, type?: string): { realNumber: string; isQris: boolean } {
  const isQris = type === "qris" || /[A-Za-z]/.test(decodedSlug);
  const realNumber = isQris
    ? decodedSlug.toUpperCase().replace(/[^A-Z0-9]/g, "")
    : decodedSlug.replace(/\D/g, "");
  return { realNumber, isQris };
}

async function fetchCheckPageData(number: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/check/${number}`, {
      headers: await forwardedClientHeaders(),
    });
    if (!res.ok) return { reports: [], linked: [] };
    return (await res.json()).data ?? { reports: [], linked: [] };
  } catch { return { reports: [], linked: [] }; }
}

async function fetchBlacklistData(number: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/blacklist/${number}`, {
      headers: await forwardedClientHeaders(),
    });
    if (!res.ok) return { blacklist: null, trend: null };
    return (await res.json()).data ?? { blacklist: null, trend: null };
  } catch { return { blacklist: null, trend: null }; }
}

interface QrisPreviewData {
  nmid: string;
  merchantName: string;
  merchantCity: string;
}

// Token dari /cek-qris, sudah divalidasi server (CRC + struktur EMV-QRIS)
// saat dibuat -- 404/expired diperlakukan sebagai "tidak ada preview", BUKAN
// error keras. Halaman tetap render normal, cuma fallback ke data database.
async function fetchQrisPreview(token: string | undefined): Promise<QrisPreviewData | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/qris/preview/${encodeURIComponent(token)}`);
    if (!res.ok) return null;
    return (await res.json()).data ?? null;
  } catch { return null; }
}

export async function generateMetadata({ params, searchParams }: CheckPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { type }  = await searchParams;
  const { realNumber, isQris } = resolveRealNumber(decodeSlug(slug), type);
  if (!realNumber) return { title: "Halaman tidak ditemukan - KawalTransaksi" };

  const pageData = await fetchCheckPageData(realNumber);
  const reports  = pageData.reports as any[];

  const verifiedCount = reports.filter((r: any) => r.status === "verified").length;
  const pendingCount  = reports.filter((r: any) => r.status === "pending").length;
  const totalLoss     = reports.reduce((sum: number, r: any) => sum + (Number(r.lossAmount) || 0), 0);
  const totalReports  = reports.length;

  const formatLoss = (n: number) => {
    if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
    if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} juta`;
    if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} ribu`;
    return `Rp ${n}`;
  };

  // NMID QRIS tidak diformat gaya nomor telepon (grouping per 4 digit) --
  // itu cuma masuk akal untuk string angka murni.
  const merchantName = isQris ? (reports[0]?.targetName as string | undefined) : undefined;
  const label = isQris
    ? (merchantName ? `QRIS ${merchantName} (${realNumber})` : `QRIS ${realNumber}`)
    : `Nomor ${realNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}`;
  let title: string;
  let description: string;

  if (verifiedCount > 0) {
    title = `${label} - Terindikasi Penipuan (${verifiedCount} Laporan Terverifikasi) - KawalTransaksi`;
    description = totalLoss > 0
      ? `${label} dilaporkan ${totalReports}x sebagai penipu dengan ${verifiedCount} laporan terverifikasi dan total kerugian ${formatLoss(totalLoss)}. Cek detail laporan sebelum bertransaksi.`
      : `${label} dilaporkan ${totalReports}x sebagai penipu dengan ${verifiedCount} laporan terverifikasi. Jangan bertransaksi dengan nomor ini.`;
  } else if (pendingCount > 0) {
    title = `${label} - Pending (${pendingCount} Laporan Masuk) - KawalTransaksi`;
    description = `${label} sedang dalam proses verifikasi dengan ${pendingCount} laporan masuk. Tetap waspada sebelum melakukan transaksi.`;
  } else {
    title = `Cek ${label} - Tidak Ada Laporan - KawalTransaksi`;
    description = `${label} belum memiliki laporan penipuan di database KawalTransaksi. Tetap waspada dan laporkan kalau Anda menemukan aktivitas mencurigakan.`;
  }

  return {
    title, description,
    // Selalu pakai realNumber (sudah dinormalisasi jadi digit saja), BUKAN slug
    // mentah dari URL. Slug mentah bisa berisi karakter apa pun, sehingga URL
    // sampah seperti /check/0812xxx-promo akan menghasilkan canonical yang
    // menunjuk ke dirinya sendiri (canonical poisoning / duplicate content).
    // Untuk traffic normal nilainya identik karena slug memang nomor itu sendiri.
    openGraph: { title, description, type: "website", locale: "id_ID", siteName: "KawalTransaksi", url: `https://kawaltransaksi.com/check/${realNumber}` },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `https://kawaltransaksi.com/check/${realNumber}` },
  };
}

function formatTimestamp(date: Date): string {
  const diffMs   = Date.now() - date.getTime();
  const diffSec  = Math.floor(diffMs / 1000);
  const diffMin  = Math.floor(diffSec / 60);
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
  { prefix: "021",  carrier: "Telkom (Jakarta)", type: "fixed" },
  { prefix: "022",  carrier: "Telkom (Bandung)", type: "fixed" },
  { prefix: "024",  carrier: "Telkom (Semarang)", type: "fixed" },
  { prefix: "031",  carrier: "Telkom (Surabaya)", type: "fixed" },
  { prefix: "061",  carrier: "Telkom (Medan)", type: "fixed" },
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
  medium:   { label: "Terindikasi Penipu",   bg: "bg-amber-50",  border: "border-amber-300",  text: "text-amber-700",  icon: AlertTriangle },
  high:     { label: "Penipu Terkonfirmasi", bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", icon: ShieldAlert },
  critical: { label: "Penipu Berbahaya",     bg: "bg-red-50",    border: "border-red-300",    text: "text-red-700",    icon: ShieldX },
};

function BlacklistBadge({ level }: { level: BlacklistLevel }) {
  const cfg = blacklistConfig[level];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <Icon className="w-3.5 h-3.5" /> {cfg.label}
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
            Masuk untuk melihat
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
        <p className="text-sm font-semibold text-white mb-1">Pernah menjadi korban penipuan nomor ini?</p>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">Satu laporan dari Anda dapat melindungi ribuan orang.</p>
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
  const { slug }                       = await params;
  const { type, bank, wallet, token }  = await searchParams;

  if (!slug || slug.length > 50) notFound();

  const { realNumber, isQris } = resolveRealNumber(decodeSlug(slug), type);
  if (!realNumber) notFound();

  const defaultType       = isQris ? "qris" : type === "bank" ? "bank_account" : type === "ewallet" ? "ewallet" : "phone";
  const hasTypeParam      = !!type;
  const defaultBankName   = bank   ? (bankNameMap[bank]    ?? null) : null;
  const defaultWalletName = wallet ? (walletNameMap[wallet] ?? null) : null;

  const checkedAt    = new Date();
  const cookieStore  = await cookies();
  const sessionToken = cookieStore.get("refresh_token")?.value;
  const isLoggedIn   = !!sessionToken;

  const [pageData, blacklistTrendData, qrisPreview] = await Promise.all([
    fetchCheckPageData(realNumber),
    fetchBlacklistData(realNumber),
    isQris ? fetchQrisPreview(token) : Promise.resolve(null),
  ]);

  const blacklist  = blacklistTrendData.blacklist ?? null;
  const allReports = (pageData?.reports as any[]) ?? [];

  const reports = allReports.filter(r => r.status !== "rejected");

  const verifiedReports = reports.filter(r => r.status === "verified");
  const pendingReports  = reports.filter(r => r.status === "pending");
  const verifiedCount   = verifiedReports.length;
  const totalLoss       = reports.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const hasOtherVictims = reports.some(r => r.hasOtherVictims === "yes");

  const thirtyDaysAgo    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentReports    = reports.filter(r => new Date(r.createdAt) >= thirtyDaysAgo);
  const multiVictimCount = reports.filter(r => r.hasOtherVictims === "yes").length;

  const isPhoneNumber = defaultType === "phone" && !defaultBankName && !defaultWalletName;
  const carrierInfo   = isPhoneNumber ? detectCarrier(realNumber) : null;

  const riskBadges: { label: string; color: string }[] = [];
  if (recentReports.length >= 3)
    riskBadges.push({ label: `Dilaporkan ${recentReports.length}x dalam 30 hari`, color: "bg-red-50 text-red-700 border-red-200" });
  if (totalLoss >= 10_000_000)
    riskBadges.push({ label: `Kerugian besar: ${new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(totalLoss)}`, color: "bg-orange-50 text-orange-700 border-orange-200" });
  if (multiVictimCount >= 2)
    riskBadges.push({ label: `${multiVictimCount} laporan sebut ada korban lain`, color: "bg-amber-50 text-amber-700 border-amber-200" });
  let status: "safe" | "warning" | "danger" = "safe";
  if (verifiedCount > 0)              status = "danger";
  else if (pendingReports.length > 0) status = "warning";

  const statusConfig = {
    danger: {
      barBg: "bg-red-50 border-b border-red-100", barLabel: "text-red-800", barDesc: "text-red-600",
      dotBg: "bg-red-500", nameBadgeBg: "bg-red-50", nameBadgeText: "text-red-700", nameBadgeBorder: "border-red-200",
      verdict: "Terindikasi penipuan", verdictSub: `${verifiedCount} laporan telah diverifikasi oleh sistem & komunitas.`,
    },
    warning: {
      barBg: "bg-amber-50 border-b border-amber-100", barLabel: "text-amber-900", barDesc: "text-amber-700",
      dotBg: "bg-amber-500", nameBadgeBg: "bg-amber-50", nameBadgeText: "text-amber-800", nameBadgeBorder: "border-amber-200",
      verdict: "Pending", verdictSub: `${pendingReports.length} laporan masuk sedang diverifikasi moderator.`,
    },
    safe: {
      barBg: "bg-emerald-50 border-b border-emerald-100", barLabel: "text-emerald-900", barDesc: "text-emerald-700",
      dotBg: "bg-emerald-500", nameBadgeBg: "bg-emerald-50", nameBadgeText: "text-emerald-800", nameBadgeBorder: "border-emerald-200",
      verdict: "Tidak ada laporan", verdictSub: "Nomor ini bersih di database kami. Tetap hati-hati, ya.",
    },
  };

  const config = statusConfig[status];

  // NMID QRIS tidak diformat gaya nomor telepon (grouping per 4 digit).
  const displayNumLower = isQris ? `QRIS ${realNumber}` : `nomor ${formatNum(realNumber)}`;
  const displayNumTitle = isQris ? `QRIS ${realNumber}` : `Nomor ${formatNum(realNumber)}`;

  const shareText = status === "danger"
    ? `[!] waspada! ${displayNumLower} terindikasi penipu dengan ${verifiedCount} laporan terverifikasi. cek di kawaltransaksi:`
    : status === "warning"
      ? `[!] ${displayNumLower} sedang dalam proses verifikasi laporan penipuan. cek di kawaltransaksi:`
      : `[OK] ${displayNumLower} aman, belum ada laporan penipuan di kawaltransaksi:`;

  const verificationSteps = [
    { label: "Laporan diterima",       done: allReports.length > 0 },
    { label: "Dalam review moderator", done: status === "warning" || status === "danger" },
    { label: "Terverifikasi",          done: status === "danger" },
  ];

  const structuredData = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: `Apakah ${displayNumTitle} penipu?`, acceptedAnswer: { "@type": "Answer", text: status === "danger" ? `Ya, ${displayNumTitle} terindikasi penipu. Terdapat ${verifiedCount} laporan terverifikasi. Hindari bertransaksi.` : status === "warning" ? `${displayNumTitle} sedang dalam proses investigasi. Tetap waspada.` : `${displayNumTitle} belum memiliki laporan penipuan terverifikasi di database KawalTransaksi.` } },
      { "@type": "Question", name: `Berapa laporan untuk ${displayNumTitle}?`, acceptedAnswer: { "@type": "Answer", text: reports.length > 0 ? `${displayNumTitle} memiliki ${reports.length} laporan masuk, dengan ${verifiedCount} laporan terverifikasi.` : `${displayNumTitle} belum memiliki laporan penipuan.` } },
      { "@type": "Question", name: "Bagaimana cara melaporkan nomor penipu?", acceptedAnswer: { "@type": "Answer", text: "Anda dapat melaporkan nomor penipu secara gratis di KawalTransaksi. Kunjungi kawaltransaksi.com/report, lalu lengkapi data nomor penipu, kronologi kejadian, dan bukti transfer." } },
    ],
  };

  const breadcrumbData = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: "https://kawaltransaksi.com" },
      { "@type": "ListItem", position: 2, name: isQris ? "Cek QRIS" : "Cek Nomor", item: `https://kawaltransaksi.com/${isQris ? "cek-qris" : "cek-nomor"}` },
      { "@type": "ListItem", position: 3, name: displayNumTitle, item: `https://kawaltransaksi.com/check/${realNumber}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbData) }} />
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
            <span className={`text-xs ${config.barDesc} hidden sm:inline`}>&middot; {config.verdictSub}</span>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" /> {formatTimestamp(checkedAt)}
            </span>
          </div>
          <div className="max-w-5xl mx-auto sm:hidden mt-1">
            <span className={`text-xs ${config.barDesc}`}>{config.verdictSub}</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24">
          {reports.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
                <p className="text-2xl sm:text-4xl font-bold leading-none text-slate-900 tabular-nums">{reports.length}</p>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.1em]">Laporan masuk</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
                <p className={`text-2xl sm:text-4xl font-bold leading-none tabular-nums ${totalLoss > 0 ? "text-red-600" : "text-slate-300"}`}>
                  {totalLoss > 0 ? new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(totalLoss) : "—"}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.1em]">Total kerugian</p>
              </div>
              <div className={`rounded-xl border p-3 sm:p-5 ${hasOtherVictims ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
                <p className={`text-2xl sm:text-4xl font-bold leading-none ${hasOtherVictims ? "text-amber-500" : "text-slate-300"}`}>
                  {hasOtherVictims ? "!" : "—"}
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
              qrDecodedName={qrisPreview?.merchantName ?? null}
              qrDecodedCity={qrisPreview?.merchantCity ?? null}
            />

            {(riskBadges.length > 0 || blacklist) && (
              <div className="flex flex-wrap gap-2">
                {blacklist && <BlacklistBadge level={blacklist.level as BlacklistLevel} />}
                {riskBadges.map((badge, i) => (
                  <span key={i} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${badge.color}`}>{badge.label}</span>
                ))}
              </div>
            )}

            {status === "safe" && (
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
              <GatedContent isLoggedIn={isLoggedIn} label="Masuk untuk melihat kronologi & bukti lengkap" minHeight="200px">
                <ReportList reports={reports} />
              </GatedContent>
            )}

            {reports.length === 0 && (
              <ReportList reports={reports} />
            )}

            {allReports.length > 0 && (
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