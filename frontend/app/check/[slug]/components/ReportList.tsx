import Image from 'next/image';
import { ShieldCheck, ExternalLink, ImageIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

// ── HELPERS ───────────────────────────────────────────────────────────────────
function cleanChronology(text: string): string {
  return text.replace(/^["'""]+|["'""]+$/g, '').trim();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface ReportItem {
  id: string;
  status: string;
  category: string;
  chronology: string;
  created_at: string;
  platform?: string | null;
  loss_amount?: number | string | null;
  incident_date?: string | null;
  has_other_victims?: string | null;
  evidence_url?: string | null;
  evidence_urls?: string[] | null;
  social_media_accounts?: string[] | null;
}

interface Props {
  reports: ReportItem[];
  hasWithdrawn?: boolean;
}

// ── Evidence URL helpers ──────────────────────────────────────────────────────
function getAllEvidenceUrls(reports: ReportItem[]): string[] {
  const urlSet = new Set<string>();
  reports.forEach((r) => {
    if (Array.isArray(r.evidence_urls) && r.evidence_urls.length > 0) {
      r.evidence_urls.forEach((url) => { if (url) urlSet.add(url); });
    } else if (r.evidence_url) {
      urlSet.add(r.evidence_url);
    }
  });
  return Array.from(urlSet);
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function ReportList({ reports, hasWithdrawn = false }: Props) {
  const allEvidenceUrls = getAllEvidenceUrls(reports);

  return (
    <div className="space-y-5">

      {/* ── 1. Riwayat laporan ── */}
      <div>
        <div className="mb-2.5 px-0.5 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-medium">Riwayat laporan</p>
          {reports.length > 0 && (
            <p className="text-[10px] text-slate-400">{reports.length} laporan dari {reports.length} korban berbeda</p>
          )}
        </div>

        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report, index) => {
              const isVerified = report.status === 'verified';
              return (
                <div
                  key={report.id}
                  className={`bg-white rounded-xl border transition-colors overflow-hidden ${
                    isVerified ? 'border-emerald-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Header per laporan */}
                  <div className={`flex items-center justify-between px-5 py-2.5 border-b ${
                    isVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isVerified ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isVerified ? 'text-emerald-700' : 'text-amber-600'
                      }`}>
                        Laporan #{index + 1} · {isVerified ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDate(report.incident_date || report.created_at)}
                    </span>
                  </div>

                  {/* Isi kronologi */}
                  <div className="px-5 py-4">
                    <p
                      className="text-sm text-slate-600 leading-relaxed break-all overflow-hidden"
                      style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
                    >
                      &quot;{cleanChronology(report.chronology)}&quot;
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : hasWithdrawn ? (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-10 text-center">
            <Clock className="w-7 h-7 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-amber-800 mb-1">Laporan sedang diperbarui</p>
            <p className="text-xs text-amber-600 max-w-xs mx-auto leading-relaxed">
              Pelapor sedang merevisi laporannya. Detail akan kembali muncul setelah disetujui moderator.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-14 text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-900 mb-1">Database bersih</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Tidak ditemukan riwayat laporan terkait nomor ini.
            </p>
          </div>
        )}
      </div>

      {/* ── 2. Bukti lampiran ── */}
      {allEvidenceUrls.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">
            Bukti lampiran
          </p>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {allEvidenceUrls.slice(0, 3).map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-slate-400 transition-all"
                >
                  <Image
                    src={url}
                    alt={`Bukti ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    {i + 1}
                  </div>
                </a>
              ))}
              {allEvidenceUrls.length > 3 && (
                <a
                  href={allEvidenceUrls[3]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                  <p className="text-[11px] text-slate-500 font-medium">+{allEvidenceUrls.length - 3} lagi</p>
                </a>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">
              Klik foto untuk lihat ukuran penuh · {allEvidenceUrls.length} foto bukti
            </p>
          </div>
        </div>
      )}
    </div>
  );
}