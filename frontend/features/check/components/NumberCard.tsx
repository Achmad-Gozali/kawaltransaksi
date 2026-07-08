"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock, Signal, MapPin, Store } from "lucide-react";
import { formatNum } from "@/core/utils";

function formatSosmed(acc: string) {
  const cleaned = acc.trim();
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://"))
    return { label: cleaned, isUrl: true, href: cleaned };
  const withoutAt = cleaned.replace(/^@+/, "");
  return { label: `@${withoutAt}`, isUrl: false, href: "" };
}

function truncateUrl(url: string, maxLen = 50) {
  return url.length <= maxLen ? url : url.slice(0, maxLen) + "...";
}

function resolveEvidenceUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

interface CarrierInfo { carrier: string; type: "mobile" | "fixed" | "unknown" }

interface ReportItem {
  targetName?: string | null;
  targetType?: string | null;
  bankName?: string | null;
  suspectPhotoUrl?: string | null;
  socialMediaAccounts?: string[] | null;
  linkUrl?: string | null;
  reportedTo?: string[] | null;
  category?: string | null;
  platform?: string | null;
  amount?: number | string | null;
  status?: string | null;
  storeName?: string | null;
  suspectCity?: string | null;
}

interface Props {
  reports: ReportItem[];
  realNumber: string;
  defaultType?: string;
  defaultBankName?: string | null;
  defaultWalletName?: string | null;
  hasTypeParam?: boolean;
  isLoggedIn?: boolean;
  carrierInfo?: CarrierInfo | null;
  config: { nameBadgeBg: string; nameBadgeText: string; nameBadgeBorder: string };
}

const reportedToLabel: Record<string, string> = {
  polisi: "Polisi", ojk: "OJK", platform: "Platform terkait", belum: "Belum lapor",
};

const targetTypeLabel: Record<string, string> = {
  phone: "Nomor HP", bank_account: "Rekening Bank", ewallet: "E-Wallet",
};

export default function NumberCard({
  reports, realNumber, config,
  defaultType = "phone", defaultBankName = null, defaultWalletName = null,
  hasTypeParam = false, isLoggedIn = false, carrierInfo = null,
}: Props) {
  const hasVerified     = reports.some(r => r.status === "verified");
  const canSeeIdentity  = hasVerified && isLoggedIn;

  const allSocialAccounts = [...new Set(
    reports.flatMap(r => r.socialMediaAccounts ?? []).filter(Boolean)
  )];

  const allReportedTo = [...new Set(
    reports.flatMap(r => r.reportedTo ?? []).filter(Boolean)
  )];

  const suspectPhotoUrl  = canSeeIdentity ? (reports.find(r => r.suspectPhotoUrl)?.suspectPhotoUrl ?? null) : null;
  const hasPhotoButGated = hasVerified && !isLoggedIn && !!reports.find(r => r.suspectPhotoUrl)?.suspectPhotoUrl;
  const targetName       = canSeeIdentity ? (reports[0]?.targetName ?? null) : null;
  const hasNameButGated  = hasVerified && !isLoggedIn && !!reports[0]?.targetName;

  const dangerLink  = reports.find(r => r.linkUrl)?.linkUrl ?? null;
  const category    = reports[0]?.category ?? null;
  const platform    = reports.find(r => r.platform)?.platform ?? null;
  const totalLoss   = reports.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const storeName   = reports.find(r => r.storeName)?.storeName ?? null;
  const suspectCity = reports.find(r => r.suspectCity)?.suspectCity ?? null;

  const bankNameFromDB = reports[0]?.bankName ?? null;
  const targetType     = reports[0]?.targetType ?? defaultType;

  const displayLabel = bankNameFromDB ?? defaultBankName ?? defaultWalletName ?? (targetTypeLabel[targetType] ?? null);
  const hasContext   = reports.length > 0 || defaultBankName !== null || defaultWalletName !== null || hasTypeParam;
  const showLabel    = hasContext && displayLabel !== null;

  const infoGrid = [
    category    ? { label: "Kategori",   value: category,    className: "text-slate-800" } : null,
    platform    ? { label: "Platform",   value: platform,    className: "text-slate-800" } : null,
    totalLoss > 0 ? { label: "Kerugian", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalLoss), className: "text-red-600", sub: !hasVerified ? "belum dikonfirmasi" : null } : null,
    storeName   ? { label: "Nama Toko",  value: storeName,   className: "text-slate-800" } : null,
    suspectCity ? { label: "Provinsi",   value: suspectCity, className: "text-slate-800" } : null,
  ].filter(Boolean) as { label: string; value: string; className: string; sub?: string | null }[];

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2 font-medium px-0.5">Nomor terperiksa</p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[28px] sm:text-5xl font-semibold text-slate-900 tracking-tight break-all leading-none mb-3 font-mono">
                {formatNum(realNumber)}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {targetName && (
                  <span className={`text-[11px] px-2.5 py-1 rounded-md font-medium border ${config.nameBadgeBg} ${config.nameBadgeText} ${config.nameBadgeBorder}`}>
                    a.n. {targetName}
                  </span>
                )}
                {hasNameButGated && (
                  <Link href="/login" className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-medium border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors">
                    <Lock className="w-3 h-3" /> a.n. ••••••••
                  </Link>
                )}
                {!hasVerified && reports.length > 0 && (
                  <span className="text-[11px] px-2.5 py-1 rounded-md font-medium border border-amber-200 bg-amber-50 text-amber-700">
                    Identitas dalam proses verifikasi
                  </span>
                )}
                {showLabel && (
                  <span className="text-[11px] px-2.5 py-1 rounded-md font-medium border border-slate-200 bg-slate-50 text-slate-500">
                    {displayLabel}
                  </span>
                )}
                {carrierInfo?.carrier && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-medium border border-slate-200 bg-slate-50 text-slate-500">
                    <Signal className="w-3 h-3 text-slate-400" /> {carrierInfo.carrier}
                  </span>
                )}
              </div>
              {reports.length > 0 && (
                <p className="text-[11px] text-slate-400 mt-2">Data dikumpulkan dari laporan komunitas</p>
              )}
            </div>

            {suspectPhotoUrl && (
              <div className="shrink-0">
                <p className="text-[10px] text-slate-400 mb-1.5 text-right">Foto penipu</p>
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  <Image src={resolveEvidenceUrl(suspectPhotoUrl)} alt="Foto profil penipu" fill className="object-cover rounded-xl border border-slate-200" unoptimized />
                  <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide">Penipu</span>
                </div>
              </div>
            )}

            {hasPhotoButGated && (
              <div className="shrink-0">
                <p className="text-[10px] text-slate-400 mb-1.5 text-right">Foto penipu</p>
                <Link href="/login">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {infoGrid.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3.5">
            {infoGrid.map(item => (
              <div key={item.label}>
                <p className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
                  {item.label === "Nama Toko" && <Store className="w-2.5 h-2.5" />}
                  {item.label === "Provinsi" && <MapPin className="w-2.5 h-2.5" />}
                  {item.label}
                </p>
                <p className={`text-xs font-semibold leading-snug ${item.className}`}>{item.value}</p>
                {item.sub && <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>}
              </div>
            ))}
          </div>
        )}

        {allSocialAccounts.length > 0 && (
          <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 mb-2 font-medium">Akun media sosial penipu</p>
            <div className="flex flex-wrap gap-1.5">
              {allSocialAccounts.map((acc, i) => {
                const fmt = formatSosmed(acc);
                return (
                  <span key={i} className="text-[11px] px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg font-mono">
                    {fmt.isUrl ? (
                      <a href={fmt.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                        {truncateUrl(fmt.label, 35)}
                      </a>
                    ) : fmt.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {dangerLink && (
          <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-red-50/50">
            <p className="text-[10px] text-slate-500 mb-2 font-medium">Tautan berbahaya terdeteksi</p>
            <div className="bg-white border border-red-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-red-700 font-mono break-all leading-relaxed">{truncateUrl(dangerLink, 55)}</span>
              <span className="text-[10px] font-bold px-2 py-1 bg-red-600 text-white rounded-lg uppercase tracking-wider shrink-0">Berbahaya</span>
            </div>
            <p className="text-[10px] text-red-500 mt-1.5">Jangan klik atau bagikan tautan ini kepada siapapun.</p>
          </div>
        )}

        {allReportedTo.length > 0 && (
          <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 mb-2 font-medium">Sudah dilaporkan ke</p>
            <div className="flex flex-wrap gap-1.5">
              {allReportedTo.map(v => (
                <span key={v} className={`text-[11px] px-2.5 py-1 rounded-lg font-medium border ${v === "belum" ? "bg-white text-slate-500 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  {reportedToLabel[v] ?? v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}