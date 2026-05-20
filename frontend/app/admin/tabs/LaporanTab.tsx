"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  Phone,
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  FileText,
  X,
  FilePen,
  Download,
  AtSign,
  ShieldAlert,
  UserX,
  Store,
  MapPin,
  Undo2,
} from "lucide-react";
import SectionTitle from "../components/SectionTitle";
import { updateReportStatus } from "../actions";
import { formatDateID, formatRupiah } from "@/core/utils";
import type { Report, StatusFilter } from "../types";
import { reportedToLabel } from "../types";

export default function LaporanTab({
  reports,
  initialSearch = "",
}: {
  reports: Report[];
  initialSearch?: string;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [bankFilter, setBankFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const todayStr = new Date().toLocaleDateString("en-CA");

  const uniqueBanks = useMemo(
    () =>
      Array.from(
        new Set(reports.map((r) => r.bank_name).filter(Boolean) as string[]),
      ).sort(),
    [reports],
  );
  const uniquePlatforms = useMemo(
    () =>
      Array.from(
        new Set(reports.map((r) => r.platform).filter(Boolean) as string[]),
      ).sort(),
    [reports],
  );

  const filteredReports = useMemo(
    () =>
      reports.filter((r) => {
        const matchStatus =
          statusFilter === "semua" || r.status === statusFilter;
        const matchBank = !bankFilter || r.bank_name === bankFilter;
        const matchPlatform = !platformFilter || r.platform === platformFilter;
        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          r.target_number.includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.reporter_email?.toLowerCase().includes(q) ||
          r.target_name?.toLowerCase().includes(q) ||
          r.bank_name?.toLowerCase().includes(q) ||
          r.store_name?.toLowerCase().includes(q) ||
          r.suspect_city?.toLowerCase().includes(q) ||
          r.social_media_accounts?.some((a) => a.toLowerCase().includes(q));
        return matchStatus && matchBank && matchPlatform && matchSearch;
      }),
    [reports, statusFilter, searchQuery, bankFilter, platformFilter],
  );

  const statusConfig = {
    pending: {
      label: "Pending",
      color: "bg-amber-50 text-amber-600 border-amber-200",
      icon: Clock,
    },
    verified: {
      label: "Verified",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      color: "bg-red-50 text-red-500 border-red-200",
      icon: XCircle,
    },
    withdrawn: {
      label: "Sedang Direvisi",
      color: "bg-blue-50 text-blue-600 border-blue-200",
      icon: FilePen,
    },
  };

  const handleAction = async (
    id: string,
    status: "verified" | "rejected" | "pending" | "withdrawn",
  ) => {
    setLoadingId(id);
    try {
      await updateReportStatus(id, status);
      router.refresh();
    } catch {
    } finally {
      setLoadingId(null);
    }
  };

  const handleBulkAction = async (status: "verified" | "rejected") => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) => updateReportStatus(id, status)),
      );
      setSelectedIds(new Set());
      router.refresh();
    } catch {
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const n = new Set(selectedIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedIds(n);
  };

  const selectAll = () =>
    setSelectedIds(
      selectedIds.size === filteredReports.length
        ? new Set()
        : new Set(filteredReports.map((r) => r.id)),
    );

  const handleExportCSV = () => {
    const rows = [
      [
        "ID",
        "Nomor",
        "Nama",
        "Tipe",
        "Bank",
        "Kategori",
        "Platform",
        "Link URL",
        "Sosmed",
        "Korban Lain",
        "Lapor Ke",
        "Kerugian",
        "Tgl Kejadian",
        "Nama Toko",
        "Provinsi",
        "Nomor Terkait",
        "Status",
        "Pelapor",
        "Tgl Lapor",
      ],
      ...reports.map((r) => [
        r.id,
        r.target_number,
        r.target_name ?? "",
        r.target_type,
        r.bank_name ?? "",
        r.category,
        r.platform ?? "",
        r.link_url ?? "",
        (r.social_media_accounts ?? []).join(";"),
        r.has_other_victims ?? "",
        (r.reported_to ?? []).join(";"),
        r.loss_amount ? String(r.loss_amount) : "",
        r.incident_date ?? "",
        r.store_name ?? "",
        r.suspect_city ?? "",
        (r.target_numbers ?? []).map((t) => t.number).join(";"),
        r.status,
        r.reporter_email,
        r.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `laporan-${todayStr}.csv`;
    a.click();
  };

  const getEvidenceUrls = (report: Report): string[] => {
    if (report.evidence_urls && report.evidence_urls.length > 0)
      return report.evidence_urls.filter(Boolean) as string[];
    if (report.evidence_url) return [report.evidence_url];
    return [];
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <SectionTitle title="Laporan" />
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50 font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor, nama, toko, provinsi, sosmed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {uniqueBanks.length > 0 && (
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className={`px-3 py-2.5 border rounded-xl text-sm cursor-pointer transition-all ${bankFilter ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}
            >
              <option value="">Bank</option>
              {uniqueBanks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
          {uniquePlatforms.length > 0 && (
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className={`px-3 py-2.5 border rounded-xl text-sm cursor-pointer transition-all ${platformFilter ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}
            >
              <option value="">Platform</option>
              {uniquePlatforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
          {(bankFilter || platformFilter) && (
            <button
              onClick={() => {
                setBankFilter("");
                setPlatformFilter("");
              }}
              className="px-3 py-2.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            "semua",
            "pending",
            "verified",
            "rejected",
            "withdrawn",
          ] as StatusFilter[]
        ).map((f) => {
          const count =
            f === "semua"
              ? reports.length
              : reports.filter((r) => r.status === f).length;
          const colors: Record<StatusFilter, string> = {
            semua:
              statusFilter === f
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300",
            pending:
              statusFilter === f
                ? "bg-amber-500 text-white"
                : "bg-white text-amber-500 border border-amber-200 hover:border-amber-300",
            verified:
              statusFilter === f
                ? "bg-emerald-500 text-white"
                : "bg-white text-emerald-600 border border-emerald-200 hover:border-emerald-300",
            rejected:
              statusFilter === f
                ? "bg-red-500 text-white"
                : "bg-white text-red-500 border border-red-200 hover:border-red-300",
            withdrawn:
              statusFilter === f
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 border border-blue-200 hover:border-blue-300",
          };
          const labels: Record<StatusFilter, string> = {
            semua: "Semua",
            pending: "Pending",
            verified: "Verified",
            rejected: "Rejected",
            withdrawn: "Sedang Direvisi",
          };
          return (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${colors[f]}`}
            >
              {labels[f]} ({count})
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl px-5 py-3.5 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedIds.size} laporan dipilih
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("verified")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              {bulkLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}{" "}
              Approve
            </button>
            <button
              onClick={() => handleBulkAction("rejected")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-400 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              {bulkLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}{" "}
              Reject
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-400 hover:text-white px-2 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Select all */}
      {filteredReports.length > 0 && (
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredReports.length}
            onChange={selectAll}
            className="w-4 h-4 accent-emerald-600 rounded"
          />
          <span className="text-xs text-slate-400 font-medium">
            Pilih semua ({filteredReports.length})
          </span>
        </label>
      )}

      {/* Empty state */}
      {filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            Tidak ada laporan ditemukan
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Coba ubah filter pencarian
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const st =
              statusConfig[report.status as keyof typeof statusConfig] ??
              statusConfig.pending;
            const StIcon = st.icon;
            const isExp = expandedId === report.id;
            const isLd = loadingId === report.id;
            const isSel = selectedIds.has(report.id);
            const hasSocmed =
              (report.social_media_accounts ?? []).filter(Boolean).length > 0;
            const hasReportedTo =
              (report.reported_to ?? []).filter(Boolean).length > 0;
            const evidenceUrls = getEvidenceUrls(report);
            const relatedNumbers = (report.target_numbers ?? []).filter(
              (t) => t.number !== report.target_number,
            );

            return (
              <div
                key={report.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-150 ${isSel ? "border-emerald-400 ring-1 ring-emerald-200" : "border-slate-200 hover:border-slate-300"}`}
              >
                <div className="px-4 py-4 sm:px-5">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleSelect(report.id)}
                      className="w-4 h-4 accent-emerald-600 shrink-0 mt-1 rounded"
                    />
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${report.target_type === "phone" ? "bg-blue-50" : "bg-purple-50"}`}
                    >
                      {report.target_type === "phone" ? (
                        <Phone className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Building2 className="w-4 h-4 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-bold text-slate-900 text-sm font-mono tracking-wide">
                          {report.target_number}
                        </span>
                        {report.target_name && (
                          <span className="text-xs text-slate-400 hidden sm:inline">
                            · {report.target_name}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${st.color}`}
                        >
                          <StIcon className="w-2.5 h-2.5" />
                          {st.label}
                        </span>
                        {report.bank_name && (
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg font-medium hidden sm:inline">
                            {report.bank_name}
                          </span>
                        )}
                        {report.has_other_victims === "yes" && (
                          <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg font-semibold">
                            👥 Multi korban
                          </span>
                        )}
                        {relatedNumbers.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg font-medium">
                            +{relatedNumbers.length} nomor terkait
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg font-medium text-slate-500">
                          {report.category}
                        </span>
                        <span>{formatDateID(report.created_at)}</span>
                        {report.loss_amount ? (
                          <span className="text-red-500 font-semibold">
                            {formatRupiah(report.loss_amount)}
                          </span>
                        ) : null}
                        {report.platform ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">
                            {report.platform}
                          </span>
                        ) : null}
                        {report.store_name ? (
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">
                            <Store className="w-2.5 h-2.5" />
                            {report.store_name}
                          </span>
                        ) : null}
                        {report.suspect_city ? (
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">
                            <MapPin className="w-2.5 h-2.5" />
                            {report.suspect_city}
                          </span>
                        ) : null}
                        {evidenceUrls.length > 0 && (
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">
                            <Eye className="w-2.5 h-2.5" />
                            {evidenceUrls.length} foto
                          </span>
                        )}
                      </div>
                      {hasSocmed && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(report.social_media_accounts ?? [])
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((acc, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-mono border border-slate-200"
                              >
                                @{acc.replace(/^@/, "")}
                              </span>
                            ))}
                          {(report.social_media_accounts ?? []).filter(Boolean)
                            .length > 2 && (
                            <span className="text-[10px] text-slate-400">
                              +
                              {(report.social_media_accounts ?? []).filter(
                                Boolean,
                              ).length - 2}{" "}
                              lagi
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {report.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAction(report.id, "verified")}
                            disabled={isLd}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                          >
                            {isLd ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button
                            onClick={() => handleAction(report.id, "rejected")}
                            disabled={isLd}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
                          >
                            {isLd ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                        </>
                      )}
                      {report.status === "verified" && (
                        <button
                          onClick={() => handleAction(report.id, "rejected")}
                          disabled={isLd}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reject</span>
                        </button>
                      )}
                      {report.status === "rejected" && (
                        <button
                          onClick={() => handleAction(report.id, "verified")}
                          disabled={isLd}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Approve</span>
                        </button>
                      )}
                      {report.status === "withdrawn" && (
                        <button
                          onClick={() => handleAction(report.id, "pending")}
                          disabled={isLd}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50 transition-colors"
                        >
                          {isLd ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Undo2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Restore</span>
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExp ? null : report.id)}
                        className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        {isExp ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExp && (
                  <div className="border-t border-slate-100 px-4 sm:px-5 py-5 bg-slate-50/60 space-y-5">
                    {/* Foto penipu */}
                    {report.suspect_photo_url && (
                      <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <div className="relative w-16 h-16 shrink-0">
                          <Image
                            src={report.suspect_photo_url}
                            alt="Foto penipu"
                            fill
                            className="object-cover rounded-xl border-2 border-red-200"
                            unoptimized
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <UserX className="w-3 h-3" /> Foto Profil Penipu
                          </p>
                          <a
                            href={report.suspect_photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-red-600 hover:underline flex items-center gap-1"
                          >
                            Lihat ukuran penuh{" "}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Detail grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        {
                          label: "Pelapor",
                          value: report.reporter_email,
                          className: "",
                        },
                        report.bank_name
                          ? {
                              label: "Bank",
                              value: report.bank_name,
                              className: "",
                            }
                          : null,
                        report.loss_amount
                          ? {
                              label: "Kerugian",
                              value: formatRupiah(report.loss_amount),
                              className: "text-red-600 font-semibold",
                            }
                          : null,
                        report.incident_date
                          ? {
                              label: "Tgl Kejadian",
                              value: formatDateID(report.incident_date),
                              className: "",
                            }
                          : null,
                        report.platform
                          ? {
                              label: "Platform",
                              value: report.platform,
                              className: "",
                            }
                          : null,
                        report.store_name
                          ? {
                              label: "Nama Toko",
                              value: report.store_name,
                              className: "",
                            }
                          : null,
                        report.suspect_city
                          ? {
                              label: "Provinsi",
                              value: report.suspect_city,
                              className: "",
                            }
                          : null,
                        report.has_other_victims
                          ? {
                              label: "Korban Lain",
                              value:
                                report.has_other_victims === "yes"
                                  ? "⚠ Ada korban lain"
                                  : "Hanya pelapor",
                              className:
                                report.has_other_victims === "yes"
                                  ? "text-orange-600 font-semibold"
                                  : "",
                            }
                          : null,
                      ]
                        .filter(Boolean)
                        .map((item, i) => (
                          <div
                            key={i}
                            className="bg-white rounded-xl border border-slate-100 p-3.5"
                          >
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                              {item!.label}
                            </p>
                            <p
                              className={`text-xs font-medium text-slate-700 truncate ${item!.className}`}
                            >
                              {item!.value}
                            </p>
                          </div>
                        ))}
                      {report.link_url && (
                        <div className="bg-white rounded-xl border border-slate-100 p-3.5 col-span-2">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                            Link URL
                          </p>
                          <a
                            href={report.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 truncate"
                          >
                            {report.link_url}{" "}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Nomor terkait */}
                    {relatedNumbers.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> Nomor Terkait Pelaku
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {relatedNumbers.map((t, i) => (
                            <a
                              key={i}
                              href={`/check/${t.number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 hover:border-slate-400 transition-colors flex items-center gap-1.5"
                            >
                              {t.number}
                              {t.bank && (
                                <span className="text-slate-400">
                                  · {t.bank}
                                </span>
                              )}
                              {t.name && (
                                <span className="text-slate-400">
                                  · {t.name}
                                </span>
                              )}
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
                          Penipu
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(report.social_media_accounts ?? [])
                            .filter(Boolean)
                            .map((acc, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                              >
                                {acc.startsWith("http") ? (
                                  <a
                                    href={acc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    {acc}{" "}
                                    <ExternalLink className="w-2.5 h-2.5 inline" />
                                  </a>
                                ) : (
                                  `@${acc.replace(/^@/, "")}`
                                )}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Sudah lapor ke */}
                    {hasReportedTo && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                          <ShieldAlert className="w-3 h-3" /> Sudah Lapor Ke
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(report.reported_to ?? [])
                            .filter(Boolean)
                            .map((v) => (
                              <span
                                key={v}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${v === "belum" ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
                              >
                                {reportedToLabel[v] ?? v}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Kronologi */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                        Kronologi
                      </p>
                      <div className="bg-white border border-slate-100 rounded-xl p-4">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {report.chronology}
                        </p>
                      </div>
                    </div>

                    {/* Bukti foto */}
                    {evidenceUrls.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                          <Eye className="w-3 h-3" /> Bukti Foto (
                          {evidenceUrls.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {evidenceUrls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 hover:border-slate-400 transition-colors block group"
                            >
                              <Image
                                src={url}
                                alt={`Bukti ${i + 1}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded font-medium">
                                {i + 1}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer link */}
                    <div className="flex gap-4 pt-1 border-t border-slate-100">
                      <a
                        href={`/check/${report.target_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Halaman Publik
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
