import { createClient } from "@/core/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Clock, CheckCircle2, XCircle, FileText, PlusCircle,
  ArrowRight, Phone, Building2, Bot, AlertCircle,
} from "lucide-react";
import type { Metadata } from "next";
import * as motion from "motion/react-client";
import { formatDateID, maskNumber } from "@/core/utils";
import AppealButton from "@/features/report/AppealButton";

export const metadata: Metadata = {
  title: "Laporan Saya - KawalTransaksi",
  description: "Lihat laporan yang pernah kamu buat di KawalTransaksi.",
};

export const revalidate = 30;

const STATUS_CONFIG = {
  pending: {
    label: "Menunggu",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  verified: {
    label: "Terverifikasi",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Ditolak",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
} as const;

const STAT_CARDS = [
  { key: "total",    label: "Total",         color: "text-zinc-900",    sub: "Laporan dibuat" },
  { key: "pending",  label: "Menunggu",      color: "text-amber-500",   sub: "Dalam review" },
  { key: "verified", label: "Terverifikasi", color: "text-emerald-500", sub: "Dipublikasi" },
  { key: "rejected", label: "Ditolak",       color: "text-red-500",     sub: "Tidak lolos" },
] as const;

export default async function LaporanPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reports, error } = await supabase
    .from("reports")
    .select(
      "id, target_number, target_name, target_type, category, chronology, status, created_at, bank_name, loss_amount, robot_score, robot_verdict_at"
    )
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false });

  const { data: appeals } = await supabase
    .from("report_appeals")
    .select("report_id, status")
    .eq("user_id", user.id);

  const appealMap  = new Map((appeals ?? []).map(a => [a.report_id, a.status]));
  const allReports = (reports ?? []) as any[];

  const stats = {
    total:    allReports.length,
    pending:  allReports.filter(r => r.status === "pending").length,
    verified: allReports.filter(r => r.status === "verified").length,
    rejected: allReports.filter(r => r.status === "rejected").length,
  };

  const now = new Date().getTime();

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Riwayat Laporan</h1>
            <p className="text-zinc-400 text-sm mt-1 truncate max-w-xs">{user.email}</p>
          </div>
          <Link href="/report"
            className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all active:scale-95 hover:scale-[1.02] shadow-lg shadow-zinc-900/10 self-start sm:self-auto">
            <PlusCircle className="w-4 h-4" /> Buat Laporan
          </Link>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STAT_CARDS.map((item, i) => (
            <motion.div key={item.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-md hover:border-zinc-300 transition-all">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className={`text-3xl font-extrabold ${item.color}`}>{stats[item.key]}</p>
              <p className="text-xs text-zinc-400 mt-1">{item.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* List */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em] mb-5">
            Riwayat Laporan
          </motion.h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm font-medium">
              Gagal memuat laporan. Silakan refresh halaman.
            </div>
          )}

          {!error && allReports.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-white border border-zinc-200 rounded-2xl p-16 text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FileText className="w-7 h-7 text-zinc-300" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">Belum ada laporan</h3>
              <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">
                Kamu belum pernah membuat laporan. Bantu komunitas dengan melaporkan nomor penipu.
              </p>
              <Link href="/report"
                className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all active:scale-95">
                <PlusCircle className="w-4 h-4" /> Buat Laporan Pertama
              </Link>
            </motion.div>
          )}

          {allReports.length > 0 && (
            <div className="space-y-3">
              {allReports.map((report, i) => {
                const status     = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                const StatusIcon = status.icon;
                const isPhone    = report.target_type === "phone";
                const appealStatus = appealMap.get(report.id) ?? null;

                const canAppeal = report.status === "rejected"
                  && !appealStatus
                  && report.robot_verdict_at
                  && (now - new Date(report.robot_verdict_at).getTime()) < 7 * 86400000;

                return (
                  <motion.div key={report.id}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -1 }}
                    className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-md hover:border-zinc-300 transition-all">

                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                          {isPhone
                            ? <Phone className="w-4 h-4 text-zinc-500" />
                            : <Building2 className="w-4 h-4 text-zinc-500" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-base font-extrabold tracking-tight text-zinc-900">
                              {maskNumber(report.target_number)}
                            </span>
                            {report.target_name && (
                              <span className="text-sm text-zinc-400">- {report.target_name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{report.category}</span>
                            <span className="text-zinc-200">-</span>
                            <span className="text-[11px] text-zinc-400">{formatDateID(report.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status + link */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${status.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </div>
                        {report.status === "verified" && (
                          <Link href={`/check/${report.target_number}`}
                            className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all group/btn"
                            title="Lihat halaman publik">
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:text-white" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Chronology preview */}
                    <div className="mt-4 pl-14">
                      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{report.chronology}</p>
                    </div>

                    {/* Robot Score */}
                    {report.robot_score != null && (
                      <div className="mt-4 pl-14">
                        <div className="flex items-center gap-2.5">
                          <Bot className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                report.robot_score >= 60 ? "bg-emerald-500" :
                                report.robot_score >= 30 ? "bg-amber-400" : "bg-red-400"
                              }`}
                              style={{ width: `${report.robot_score}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold tabular-nums ${
                            report.robot_score >= 60 ? "text-emerald-600" :
                            report.robot_score >= 30 ? "text-amber-600" : "text-red-500"
                          }`}>
                            {report.robot_score}/100
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Status messages */}
                    {report.status === "pending" && (
                      <div className="mt-3 pl-14">
                        <p className="inline-flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Laporan sedang ditinjau sistem, maks. 1x24 jam.
                        </p>
                      </div>
                    )}
                    {report.status === "rejected" && (
                      <div className="mt-3 pl-14 space-y-1.5">
                        <p className="inline-flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          Laporan tidak memenuhi syarat verifikasi otomatis.
                        </p>
                        {canAppeal && (
                          <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                            Kamu bisa mengajukan banding dalam 7 hari sejak ditolak.
                          </p>
                        )}
                        {appealStatus === "pending" && (
                          <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Banding sedang ditinjau ulang oleh sistem.
                          </p>
                        )}
                        {appealStatus === "rejected" && (
                          <p className="text-[11px] text-red-500 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            Banding ditolak. Laporan ini tidak dapat diproses lebih lanjut.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions — hanya appeal */}
                    {canAppeal && (
                      <div className="mt-4 pl-14">
                        <AppealButton reportId={report.id} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}