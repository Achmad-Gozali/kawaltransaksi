import Image from 'next/image';
import Link from 'next/link';
import { Lock, Signal } from 'lucide-react';
import { formatNum } from '@/lib/utils';

function formatSosmed(acc: string): { label: string; isUrl: boolean; href: string } {
  const cleaned = acc.trim();
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return { label: cleaned, isUrl: true, href: cleaned };
  }
  const withoutAt = cleaned.replace(/^@+/, '');
  return { label: `@${withoutAt}`, isUrl: false, href: '' };
}

function truncateUrl(url: string, maxLen = 50): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen) + '...';
}

interface CarrierInfo {
  carrier: string | null;
  type: string | null;
  location: string | null;
}

interface ReportItem {
  target_name?: string | null;
  target_type?: string | null;
  bank_name?: string | null;
  suspect_photo_url?: string | null;
  social_media_accounts?: string[] | null;
  link_url?: string | null;
  reported_to?: string[] | null;
  category?: string | null;
  platform?: string | null;
  loss_amount?: number | string | null;
  status?: string | null;
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
  config: {
    nameBadgeBg: string;
    nameBadgeText: string;
    nameBadgeBorder: string;
  };
}

const reportedToLabel: Record<string, string> = {
  polisi: 'Polisi',
  ojk: 'OJK',
  platform: 'Platform terkait',
  belum: 'Belum lapor',
};

const targetTypeLabel: Record<string, string> = {
  phone: 'Nomor HP',
  bank_account: 'Rekening Bank',
  ewallet: 'E-Wallet',
};

export default function NumberCard({
  reports,
  realNumber,
  config,
  defaultType = 'phone',
  defaultBankName = null,
  defaultWalletName = null,
  hasTypeParam = false,
  isLoggedIn = false,
  carrierInfo = null,
}: Props) {
  const hasVerified = reports.some((r) => r.status === 'verified');

  const canSeeIdentity = hasVerified && isLoggedIn;

  const allSocialAccounts: string[] = [];
  reports.forEach((r) => {
    if (Array.isArray(r.social_media_accounts)) {
      r.social_media_accounts.forEach((acc) => {
        if (acc && !allSocialAccounts.includes(acc)) allSocialAccounts.push(acc);
      });
    }
  });

  const allReportedTo: string[] = [];
  reports.forEach((r) => {
    if (Array.isArray(r.reported_to)) {
      r.reported_to.forEach((v) => {
        if (v && !allReportedTo.includes(v)) allReportedTo.push(v);
      });
    }
  });

  const suspectPhotoUrl = canSeeIdentity
    ? (reports.find((r) => r.suspect_photo_url)?.suspect_photo_url ?? null)
    : null;

  const hasPhotoButGated =
    hasVerified && !isLoggedIn && !!reports.find((r) => r.suspect_photo_url)?.suspect_photo_url;

  const targetName = canSeeIdentity
    ? (reports[0]?.target_name ?? null)
    : null;

  const hasNameButGated = hasVerified && !isLoggedIn && !!reports[0]?.target_name;

  const dangerLink = reports.find((r) => r.link_url)?.link_url ?? null;
  const category = reports[0]?.category ?? null;
  const platform = reports.find((r) => r.platform)?.platform ?? null;
  const totalLoss = reports.reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0);

  const bankNameFromDB = reports[0]?.bank_name ?? null;
  const targetType = reports[0]?.target_type ?? defaultType;

  const displayLabel = (() => {
    if (bankNameFromDB) return bankNameFromDB;
    if (defaultBankName) return defaultBankName;
    if (defaultWalletName) return defaultWalletName;
    return targetTypeLabel[targetType] ?? null;
  })();

  const hasContext = reports.length > 0 || defaultBankName !== null || defaultWalletName !== null || hasTypeParam;
  const showLabel = hasContext && displayLabel !== null;

  // Format carrier info untuk ditampilin
  const showCarrier = carrierInfo && (carrierInfo.carrier || carrierInfo.location);
  const carrierLabel = [
    carrierInfo?.carrier,
    carrierInfo?.location,
  ].filter(Boolean).join(' · ');

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">
        Nomor terperiksa
      </p>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">

        {/* Nomor + nama + foto */}
        <div className="p-4 sm:p-6 flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-2xl sm:text-5xl font-medium text-slate-900 tracking-tight break-all leading-none mb-3 font-mono">
              {formatNum(realNumber)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {/* Nama — keliatan kalau verified + login */}
              {targetName && (
                <span className={`text-[11px] px-2.5 py-1 rounded-md font-medium border ${config.nameBadgeBg} ${config.nameBadgeText} ${config.nameBadgeBorder}`}>
                  a.n. {targetName}
                </span>
              )}

              {/* Nama ada tapi belum login */}
              {hasNameButGated && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md font-medium border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  a.n. ••••••
                </Link>
              )}

              {/* Belum verified */}
              {!hasVerified && reports.length > 0 && (
                <span className="text-[11px] px-2.5 py-1 rounded-md font-medium border border-amber-200 bg-amber-50 text-amber-700">
                  Identitas belum dapat ditampilkan — laporan sedang diverifikasi
                </span>
              )}

              {showLabel && (
                <span className="text-[11px] px-2.5 py-1 rounded-md font-medium border border-slate-200 bg-slate-50 text-slate-500">
                  {displayLabel}
                </span>
              )}

              {/* Badge carrier/provider */}
              {showCarrier && (
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md font-medium border border-slate-200 bg-slate-50 text-slate-500">
                  <Signal className="w-3 h-3 text-slate-400" />
                  {carrierLabel}
                </span>
              )}
            </div>
            {reports.length > 0 && (
              <p className="text-[11px] text-slate-400 mt-2.5">Data dikumpulkan dari laporan komunitas</p>
            )}
          </div>

          {/* Foto — keliatan kalau verified + login */}
          {suspectPhotoUrl && (
            <div className="shrink-0">
              <p className="text-[10px] text-slate-400 mb-1.5">Foto penipu</p>
              <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                <Image
                  src={suspectPhotoUrl}
                  alt="Foto profil penipu"
                  fill
                  className="object-cover rounded-lg border border-slate-200"
                  unoptimized
                />
                <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                  Penipu
                </span>
              </div>
            </div>
          )}

          {/* Foto ada tapi belum login */}
          {hasPhotoButGated && (
            <div className="shrink-0">
              <p className="text-[10px] text-slate-400 mb-1.5">Foto penipu</p>
              <Link href="/login">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Detail row */}
        {(category || platform || totalLoss > 0) && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {category && (
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">Kategori</p>
                <p className="text-xs font-medium text-slate-800 leading-snug">{category}</p>
              </div>
            )}
            {platform && (
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">Platform</p>
                <p className="text-xs font-medium text-slate-800">{platform}</p>
              </div>
            )}
            {totalLoss > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">Kerugian</p>
                <p className="text-xs font-medium text-red-600">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalLoss)}
                </p>
                {!hasVerified && (
                  <p className="text-[10px] text-slate-400 mt-0.5">belum dikonfirmasi</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Akun media sosial */}
        {allSocialAccounts.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 mb-2">Akun media sosial penipu</p>
            <div className="flex flex-wrap gap-2">
              {allSocialAccounts.map((acc, i) => {
                const fmt = formatSosmed(acc);
                return (
                  <span key={i} className="text-[11px] px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-700 rounded-md font-mono">
                    {fmt.isUrl ? (
                      <a href={fmt.href} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 transition-colors">
                        {truncateUrl(fmt.label, 35)}
                      </a>
                    ) : fmt.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Tautan berbahaya */}
        {dangerLink && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-red-50/40">
            <p className="text-[10px] text-slate-400 mb-2">Tautan berbahaya terdeteksi</p>
            <div className="bg-white border border-red-200 rounded-lg p-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-red-700 font-mono break-all">
                {truncateUrl(dangerLink, 55)}
              </span>
              <span className="text-[10px] font-bold px-2 py-1 bg-red-600 text-white rounded-md uppercase tracking-wider shrink-0">
                High risk
              </span>
            </div>
            <p className="text-[10px] text-red-500 mt-1.5">
              Jangan klik atau bagikan tautan ini kepada siapapun.
            </p>
          </div>
        )}

        {/* Sudah dilaporkan ke */}
        {allReportedTo.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 mb-2">Sudah dilaporkan ke</p>
            <div className="flex flex-wrap gap-2">
              {allReportedTo.map((v) => (
                <span key={v} className={`text-[11px] px-2.5 py-1 rounded-md font-medium border ${
                  v === 'belum'
                    ? 'bg-white text-slate-500 border-slate-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
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