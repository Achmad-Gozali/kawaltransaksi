import Image from 'next/image';
import { ExternalLink, AlertTriangle } from 'lucide-react';
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
}

interface Props {
  reports: ReportItem[];
  realNumber: string;
  defaultType?: string;
  defaultBankName?: string | null;   // FIX: nama bank dari query param (e.g. "BCA")
  defaultWalletName?: string | null; // FIX: nama wallet dari query param (e.g. "GoPay")
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
}: Props) {
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

  const suspectPhotoUrl = reports.find((r) => r.suspect_photo_url)?.suspect_photo_url ?? null;
  const targetName = reports[0]?.target_name ?? null;

  // FIX: Prioritas label:
  // 1. bank_name dari DB (paling akurat, dari laporan yang sudah masuk)
  // 2. defaultBankName atau defaultWalletName dari query param
  // 3. targetTypeLabel dari target_type DB atau defaultType
  const bankNameFromDB = reports[0]?.bank_name ?? null;
  const targetType = reports[0]?.target_type ?? defaultType;

  const displayLabel = (() => {
    if (bankNameFromDB) return bankNameFromDB;
    if (defaultBankName) return defaultBankName;
    if (defaultWalletName) return defaultWalletName;
    return targetTypeLabel[targetType] ?? targetTypeLabel['phone'];
  })();

  const dangerLink = reports.find((r) => r.link_url)?.link_url ?? null;
  const category = reports[0]?.category ?? null;
  const platform = reports.find((r) => r.platform)?.platform ?? null;
  const totalLoss = reports.reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0);

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">
        Nomor terperiksa
      </p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

        {/* ── Nomor + nama + foto ── */}
        <div className="p-5 sm:p-6 flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[2rem] sm:text-5xl font-medium text-slate-900 tracking-tight break-all leading-none mb-4 font-mono">
              {formatNum(realNumber)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {targetName && (
                <span className={`text-[11px] px-3 py-1 rounded-full font-medium border ${config.nameBadgeBg} ${config.nameBadgeText} ${config.nameBadgeBorder}`}>
                  a.n. {targetName}
                </span>
              )}
              {/* FIX: pakai displayLabel yang sudah menggabungkan semua prioritas */}
              <span className="text-[11px] px-3 py-1 rounded-full font-medium border border-slate-200 bg-slate-50 text-slate-500">
                {displayLabel}
              </span>
            </div>
            {reports.length > 0 && (
              <p className="text-[11px] text-slate-400 mt-3">Data dikumpulkan dari laporan komunitas</p>
            )}
          </div>

          {suspectPhotoUrl && (
            <div className="shrink-0">
              <p className="text-[10px] text-slate-400 mb-1.5">Foto penipu</p>
              <div className="relative w-16 h-16">
                <Image
                  src={suspectPhotoUrl}
                  alt="Foto profil penipu"
                  fill
                  className="object-cover rounded-xl border border-slate-200"
                  unoptimized
                />
                <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                  Penipu
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Detail row: kategori, platform, kerugian ── */}
        {(category || platform || totalLoss > 0) && (
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 grid grid-cols-3 gap-4">
            {category && (
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Kategori</p>
                <p className="text-xs font-medium text-slate-800">{category}</p>
              </div>
            )}
            {platform && (
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Platform</p>
                <p className="text-xs font-medium text-slate-800">{platform}</p>
              </div>
            )}
            {totalLoss > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Kerugian</p>
                <p className="text-xs font-medium text-red-600">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalLoss)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Akun media sosial ── */}
        {allSocialAccounts.length > 0 && (
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 mb-2.5">Akun media sosial penipu</p>
            <div className="flex flex-wrap gap-2">
              {allSocialAccounts.map((acc, i) => {
                const fmt = formatSosmed(acc);
                return (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg font-mono"
                  >
                    {fmt.isUrl ? (
                      <a
                        href={fmt.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                      >
                        {truncateUrl(fmt.label, 35)}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : fmt.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tautan berbahaya ── */}
        {dangerLink && (
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-red-50/40">
            <p className="text-[10px] text-slate-400 mb-2.5">Tautan berbahaya terdeteksi</p>
            <div className="bg-white border border-red-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-[11px] text-red-700 font-mono break-all">
                  {truncateUrl(dangerLink, 55)}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-red-600 text-white rounded-lg uppercase tracking-wider shrink-0">
                High risk
              </span>
            </div>
            <p className="text-[10px] text-red-500 mt-2">
              Jangan klik atau bagikan tautan ini kepada siapapun.
            </p>
          </div>
        )}

        {/* ── Sudah dilaporkan ke ── */}
        {allReportedTo.length > 0 && (
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 mb-2.5">Sudah dilaporkan ke</p>
            <div className="flex flex-wrap gap-2">
              {allReportedTo.map((v) => (
                <span
                  key={v}
                  className={`text-[11px] px-3 py-1 rounded-full font-medium border ${
                    v === 'belum'
                      ? 'bg-white text-slate-500 border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
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