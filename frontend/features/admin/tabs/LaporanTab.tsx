"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2, XCircle, Clock, Eye, ExternalLink, Phone,
  Building2, ChevronDown, ChevronUp, Loader2, Search, X,
  FilePen, Download, AtSign, ShieldAlert, UserX, Store,
  MapPin, Undo2, Bot,
} from "lucide-react";
import SectionTitle from "../components/SectionTitle";
import { updateReportStatus } from "../actions";
import { formatDateID, formatRupiah } from "@/core/utils";
import type { Report, StatusFilter } from "../types";
import { reportedToLabel } from "../types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:   { label: "Pending",         color: "bg-amber-50 text-amber-600 border-amber-200",       icon: Clock },
  verified:  { label: "Verified",        color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
  rejected:  { label: "Rejected",        color: "bg-red-50 text-red-500 border-red-200",             icon: XCircle },
  withdrawn: { label: "Sedang Direvisi", color: "bg-blue-50 text-blue-600 border-blue-200",          icon: FilePen },
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "semua",     label: "Semua" },
  { value: "pending",   label: "Pending" },
  { value: "verified",  label: "Verified" },
  { value: "rejected",  label: "Rejected" },
  { value: "withdrawn", label: "Direvisi" },
];

const TAB_COLORS: Record<StatusFilter, { active: string; inactive: string }> = {
  semua:     { active: "bg-slate-900 text-white",   inactive: "bg-white text-slate-500 border border-slate-200" },
  pending:   { active: "bg-amber-500 text-white",   inactive: "bg-white text-amber-500 border border-amber-200" },
  verified:  { active: "bg-emerald-500 text-white", inactive: "bg-white text-emerald-600 border border-emerald-200" },
  rejected:  { active: "bg-red-500 text-white",     inactive: "bg-white text-red-500 border border-red-200" },
  withdrawn: { active: "bg-blue-600 text-white",    inactive: "bg-white text-blue-600 border border-blue-200" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${className}`}>{children}</span>
  );
}

function DetailItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-xs font-medium text-slate-700 truncate ${className ?? ""}`}>{value}</p>
    </div>
  );
}

function ActionBtn({
  onClick, disabled, loading, icon: Icon, label, className,
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  icon: React.ElementType; label: string; className: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors ${className}`}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LaporanTab({
  reports,
  initialSearch = "",
}: {
  reports: Report[];
  initialSearch?: string;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("semua");
  const [searchQuery, setSearchQuery]     = useState(initialSearch);
  const [bankFilter, setBankFilter]       = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [loadingId, setLoadingId]         = useState<string | null>(null);
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading]     = useState(false);

  const todayStr = new Date().toLocaleDateString("en-CA");

  const uniqueBanks = useMemo(() =>
    Array.from(new Set(reports.map(r => r.bank_name).filter(Boolean) as string[])).sort(),
    [reports]);

  const uniquePlatforms = useMemo(() =>
    Array.from(new Set(reports.map(r => r.platform).filter(Boolean) as string[])).sort(),
    [reports]);

  const filteredReports = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return reports.filter(r => {
      if (statusFilter !== "semua" && r.status !== statusFilter) return false;
      if (bankFilter && r.bank_name !== bankFilter) return false;
      if (platformFilter && r.platform !== platformFilter) return false;
      if (q && ![
        r.id,
        r.target_number, r.category, r.reporter_email ?? "",
        r.target_name ?? "", r.bank_name ?? "", r.store_name ?? "",
        r.suspect_city ?? "", ...(r.social_media_accounts ?? []),
      ].some(v => v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [reports, statusFilter, searchQuery, bankFilter, platformFilter]);

  const handleAction = async (id: string, status: "verified" | "rejected" | "pending" | "withdrawn") => {
    setLoadingId(id);
    try { await updateReportStatus(id, status); router.refresh(); }
    catch {} finally { setLoadingId(null); }
  };

  const handleBulkAction = async (status: "verified" | "rejected") => {
    if (!selectedIds.size) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => updateReportStatus(id, status)));
      setSelectedIds(new Set());
      router.refresh();
    } catch {} finally { setBulkLoading(false); }
  };

  const toggleSelect = (id: string) => {
    const n = new Set(selectedIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedIds(n);
  };

  const selectAll = () =>
    setSelectedIds(selectedIds.size === filteredReports.length
      ? new Set()
      : new Set(filteredReports.map(r => r.id)));

  const handleExportCSV = () => {
    const rows = [
      ["ID","Nomor","Nama","Tipe","Bank","Kategori","Platform","Link URL","Sosmed","Korban Lain","Lapor Ke","Kerugian","Tgl Kejadian","Nama Toko","Provinsi","Nomor Terkait","Status","Pelapor","Tgl Lapor","Robot Score","Robot Status"],
      ...reports.map(r => [
        r.id, r.target_number, r.target_name ?? "", r.target_type, r.bank_name ?? "",
        r.category, r.platform ?? "", r.link_url ?? "",
        (r.social_media_accounts ?? []).join(";"), r.has_other_victims ?? "",
        (r.reported_to ?? []).join(";"), r.loss_amount ? String(r.loss_amount) : "",
        r.incident_date ?? "", r.store_name ?? "", r.suspect_city ?? "",
        (r.target_numbers ?? []).map((t: any) => t.number).join(";"),
        r.status, r.reporter_email, r.created_at,
        r.robot_score ?? "", r.robot_status ?? "",
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `laporan-${todayStr}.csv`;
    a.click();
  };

  const getEvidenceUrls = (r: Report) => {
    if (r.evidence_urls?.length) return r.evidence_urls.filter(Boolean) as string[];
    if (r.evidence_url) return [r.evidence_url];
    return [];
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionTitle title="Laporan" />
        <button onClick={handleExportCSV}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Cari nomor, nama, toko, provinsi..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
      </div>

      {/* Filters */}
      {(uniqueBanks.length > 0 || uniquePlatforms.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {uniqueBanks.length > 0 && (
            <select value={bankFilter} onChange={e => setBankFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-sm cursor-pointer transition-all ${bankFilter ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}>
              <option value="">Bank</option>
              {uniqueBanks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          {uniquePlatforms.length > 0 && (
            <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-sm cursor-pointer transition-all ${platformFilter ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}>
              <option value="">Platform</option>
              {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          {(bankFilter || platformFilter) && (
            <button onClick={() => { setBankFilter(""); setPlatformFilter(""); }}
              className="px-3 py-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map(({ value, label }) => {
          const count = value === "semua" ? reports.length : reports.filter(r => r.status === value).length;
          const col = TAB_COLORS[value];
          return (
            <button key={value} onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${statusFilter === value ? col.active : col.inactive}`}>
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{selectedIds.size} dipilih</span>
          <div className="flex gap-2">
            <ActionBtn onClick={() => handleBulkAction("verified")} disabled={bulkLoading} loading={bulkLoading}
              icon={CheckCircle2} label="Approve" className="bg-emerald-500 hover:bg-emerald-400 text-white" />
            <ActionBtn onClick={() => handleBulkAction("rejected")} disabled={bulkLoading} loading={bulkLoading}
              icon={XCircle} label="Reject" className="bg-red-500 hover:bg-red-400 text-white" />
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-white px-2">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Select all */}
      {filteredReports.length > 0 && (
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input type="checkbox" checked={selectedIds.size === filteredReports.length}
            onChange={selectAll} className="w-4 h-4 accent-emerald-600 rounded" />
          <span className="text-xs text-slate-400 font-medium">Pilih semua ({filteredReports.length})</span>
        </label>
      )}

      {/* Empty state */}
      {filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">Tidak ada laporan ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba ubah filter pencarian</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              isExpanded={expandedId === report.id}
              isLoading={loadingId === report.id}
              isSelected={selectedIds.has(report.id)}
              onToggleExpand={() => setExpandedId(expandedId === report.id ? null : report.id)}
              onToggleSelect={() => toggleSelect(report.id)}
              onAction={handleAction}
              getEvidenceUrls={getEvidenceUrls}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── ReportCard ────────────────────────────────────────────────────────────────

function ReportCard({
  report, isExpanded, isLoading, isSelected,
  onToggleExpand, onToggleSelect, onAction, getEvidenceUrls,
}: {
  report: Report; isExpanded: boolean; isLoading: boolean; isSelected: boolean;
  onToggleExpand: () => void; onToggleSelect: () => void;
  onAction: (id: string, status: "verified" | "rejected" | "pending" | "withdrawn") => void;
  getEvidenceUrls: (r: Report) => string[];
}) {
  const st     = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const StIcon = st.icon;
  const evidenceUrls   = getEvidenceUrls(report);
  const relatedNumbers = (report.target_numbers ?? []).filter((t: any) => t.number !== report.target_number);
  const hasSocmed      = (report.social_media_accounts ?? []).filter(Boolean).length > 0;
  const hasReportedTo  = (report.reported_to ?? []).filter(Boolean).length > 0;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${isSelected ? "border-emerald-400 ring-1 ring-emerald-200" : "border-slate-200 hover:border-slate-300"}`}>
      <div className="px-3.5 py-3.5 sm:px-5">
        {/* Top row */}
        <div className="flex items-start gap-2.5">
          <input type="checkbox" checked={isSelected} onChange={onToggleSelect}
            className="w-4 h-4 accent-emerald-600 shrink-0 mt-1 rounded" />

          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${report.target_type === "phone" ? "bg-blue-50" : "bg-purple-50"}`}>
            {report.target_type === "phone"
              ? <Phone className="w-3.5 h-3.5 text-blue-500" />
              : <Building2 className="w-3.5 h-3.5 text-purple-500" />}
          </div>

          <div className="flex-grow min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="font-bold text-slate-900 text-sm font-mono">{report.target_number}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${st.color}`}>
                <StIcon className="w-2.5 h-2.5" />{st.label}
              </span>
              {/* Robot score badge */}
              {report.robot_score != null && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                  report.robot_score >= 60 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                  report.robot_score >= 30 ? "bg-amber-50 text-amber-600 border-amber-200" :
                  "bg-red-50 text-red-500 border-red-200"
                }`}>
                  <Bot className="w-2.5 h-2.5" />{report.robot_score}
                </span>
              )}
              {report.has_other_victims === "yes" && (
                <Badge className="bg-orange-50 text-orange-600 border border-orange-200">Multi korban</Badge>
              )}
              {relatedNumbers.length > 0 && (
                <Badge className="bg-slate-100 text-slate-500">+{relatedNumbers.length} terkait</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
              <Badge className="bg-slate-100 text-slate-500">{report.category}</Badge>
              <span>{formatDateID(report.created_at)}</span>
              {report.loss_amount && (
                <span className="text-red-500 font-semibold">{formatRupiah(report.loss_amount as number)}</span>
              )}
              {report.platform && <Badge className="bg-slate-100 text-slate-500">{report.platform}</Badge>}
              {report.bank_name && <Badge className="bg-slate-100 text-slate-500">{report.bank_name}</Badge>}
              {report.store_name && (
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">
                  <Store className="w-2.5 h-2.5" />{report.store_name}
                </span>
              )}
              {report.suspect_city && (
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">
                  <MapPin className="w-2.5 h-2.5" />{report.suspect_city}
                </span>
              )}
              {evidenceUrls.length > 0 && (
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">
                  <Eye className="w-2.5 h-2.5" />{evidenceUrls.length} foto
                </span>
              )}
            </div>

            {hasSocmed && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(report.social_media_accounts ?? []).filter(Boolean).slice(0, 2).map((acc, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-mono border border-slate-200">
                    @{acc.replace(/^@/, "")}
                  </span>
                ))}
                {(report.social_media_accounts ?? []).filter(Boolean).length > 2 && (
                  <span className="text-[10px] text-slate-400">
                    +{(report.social_media_accounts ?? []).filter(Boolean).length - 2} lagi
                  </span>
                )}
              </div>
            )}
          </div>

          <button onClick={onToggleExpand}
            className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3 pl-[52px]">
          {report.status === "pending" && (
            <>
              <ActionBtn onClick={() => onAction(report.id, "verified")} disabled={isLoading} loading={isLoading}
                icon={CheckCircle2} label="Approve" className="bg-emerald-500 text-white hover:bg-emerald-600" />
              <ActionBtn onClick={() => onAction(report.id, "rejected")} disabled={isLoading} loading={isLoading}
                icon={XCircle} label="Reject" className="bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500" />
            </>
          )}
          {report.status === "verified" && (
            <ActionBtn onClick={() => onAction(report.id, "rejected")} disabled={isLoading}
              icon={XCircle} label="Reject" className="bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500" />
          )}
          {report.status === "rejected" && (
            <ActionBtn onClick={() => onAction(report.id, "verified")} disabled={isLoading}
              icon={CheckCircle2} label="Approve" className="bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600" />
          )}
          {report.status === "withdrawn" && (
            <ActionBtn onClick={() => onAction(report.id, "pending")} disabled={isLoading} loading={isLoading}
              icon={Undo2} label="Restore" className="bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600" />
          )}
        </div>
      </div>

      {isExpanded && (
        <ReportDetail
          report={report}
          evidenceUrls={evidenceUrls}
          relatedNumbers={relatedNumbers}
          hasSocmed={hasSocmed}
          hasReportedTo={hasReportedTo}
        />
      )}
    </div>
  );
}

// ── ReportDetail ──────────────────────────────────────────────────────────────

function ReportDetail({
  report, evidenceUrls, relatedNumbers, hasSocmed, hasReportedTo,
}: {
  report: Report; evidenceUrls: string[]; relatedNumbers: any[];
  hasSocmed: boolean; hasReportedTo: boolean;
}) {
  const detailItems = [
    { label: "Pelapor",      value: report.reporter_email },
    report.bank_name     ? { label: "Bank",         value: report.bank_name }                                                                    : null,
    report.loss_amount   ? { label: "Kerugian",     value: formatRupiah(report.loss_amount as number), className: "text-red-600 font-semibold" } : null,
    report.incident_date ? { label: "Tgl Kejadian", value: formatDateID(report.incident_date) }                                                  : null,
    report.platform      ? { label: "Platform",     value: report.platform }                                                                      : null,
    report.store_name    ? { label: "Nama Toko",    value: report.store_name }                                                                    : null,
    report.suspect_city  ? { label: "Provinsi",     value: report.suspect_city }                                                                  : null,
    report.has_other_victims ? {
      label: "Korban Lain",
      value: report.has_other_victims === "yes" ? "⚠ Ada korban lain" : "Hanya pelapor",
      className: report.has_other_victims === "yes" ? "text-orange-600 font-semibold" : "",
    } : null,
  ].filter(Boolean) as { label: string; value: string; className?: string }[];

  return (
    <div className="border-t border-slate-100 px-3.5 sm:px-5 py-4 bg-slate-50/60 space-y-4">

      {/* Foto penipu */}
      {report.suspect_photo_url && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
          <div className="relative w-14 h-14 shrink-0">
            <Image src={report.suspect_photo_url} alt="Foto penipu" fill
              className="object-cover rounded-xl border-2 border-red-200" unoptimized />
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <UserX className="w-3 h-3" /> Foto Profil Penipu
            </p>
            <a href={report.suspect_photo_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-red-600 hover:underline flex items-center gap-1">
              Lihat ukuran penuh <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Detail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {detailItems.map((item, i) => (
          <DetailItem key={i} label={item.label} value={item.value} className={item.className} />
        ))}
        {report.link_url && (
          <div className="bg-white rounded-xl border border-slate-100 p-3 col-span-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Link URL</p>
            <a href={report.link_url} target="_blank" rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 truncate">
              {report.link_url} <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        )}
      </div>

      {/* Nomor terkait */}
      {relatedNumbers.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> Nomor Terkait
          </p>
          <div className="flex flex-wrap gap-1.5">
            {relatedNumbers.map((t: any, i: number) => (
              <a key={i} href={`/check/${t.number}`} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 hover:border-slate-400 transition-colors flex items-center gap-1.5">
                {t.number}
                {t.bank && <span className="text-slate-400">· {t.bank}</span>}
                {t.name && <span className="text-slate-400">· {t.name}</span>}
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Akun sosmed */}
      {hasSocmed && (
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <AtSign className="w-3 h-3" /> Akun Media Sosial
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(report.social_media_accounts ?? []).filter(Boolean).map((acc, i) => (
              <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700">
                {acc.startsWith("http")
                  ? <a href={acc} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1">
                      {acc} <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>
                  : `@${acc.replace(/^@/, "")}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lapor ke */}
      {hasReportedTo && (
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3" /> Sudah Lapor Ke
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(report.reported_to ?? []).filter(Boolean).map(v => (
              <span key={v} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${v === "belum" ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                {reportedToLabel[v] ?? v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Kronologi */}
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Kronologi</p>
        <div className="bg-white border border-slate-100 rounded-xl p-3.5">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{report.chronology}</p>
        </div>
      </div>

      {/* Robot Score */}
      {report.robot_score != null && (
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <Bot className="w-3 h-3" /> Skor Robot
          </p>
          <div className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    report.robot_score >= 60 ? "bg-emerald-500" :
                    report.robot_score >= 30 ? "bg-amber-400" : "bg-red-400"
                  }`}
                  style={{ width: `${report.robot_score}%` }}
                />
              </div>
              <span className={`text-sm font-bold tabular-nums w-8 text-right ${
                report.robot_score >= 60 ? "text-emerald-600" :
                report.robot_score >= 30 ? "text-amber-600" : "text-red-500"
              }`}>
                {report.robot_score}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                report.robot_status === "verified" ? "bg-emerald-50 text-emerald-600" :
                report.robot_status === "rejected" ? "bg-red-50 text-red-500" :
                "bg-amber-50 text-amber-600"
              }`}>
                {report.robot_status ?? "pending"}
              </span>
            </div>
            {report.robot_reasons && report.robot_reasons.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {report.robot_reasons.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 truncate">{r.detail}</span>
                    <span className={`text-[11px] font-bold shrink-0 ${r.points > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {r.points > 0 ? `+${r.points}` : r.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bukti foto */}
      {evidenceUrls.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <Eye className="w-3 h-3" /> Bukti Foto ({evidenceUrls.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {evidenceUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 hover:border-slate-400 transition-colors block group">
                <Image src={url} alt={`Bukti ${i + 1}`} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded font-medium">{i + 1}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-1 border-t border-slate-100">
        <a href={`/check/${report.target_number}`} target="_blank" rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors w-fit">
          <ExternalLink className="w-3.5 h-3.5" /> Halaman Publik
        </a>
      </div>
    </div>
  );
}