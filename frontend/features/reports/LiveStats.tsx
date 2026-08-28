"use client";

import { useState } from "react";
import * as motion from "motion/react-client";
import { formatRupiah } from "@/core/utils";
import { useReportStream } from "@/features/realtime/useReportStream";

export type LiveStatsTargetType = "phone" | "bank_account" | "ewallet" | "qris";

interface LiveStatsProps {
  /** Angka awal dari SSR. */
  initial: { total: number; verified: number; totalLoss: number };
  variant: "home" | "category";
  /**
   * Kalau diisi, hanya event dengan targetType ini yang diproses
   * (dipakai 3 halaman kategori). Kosong = proses semua (homepage).
   */
  targetType?: LiveStatsTargetType;
  /** Deskripsi stat tengah, khusus variant "category". */
  blacklistDesc?: string;
}

function useLiveCounters(
  initial: LiveStatsProps["initial"],
  targetType?: LiveStatsTargetType,
) {
  const [total, setTotal] = useState(initial.total);
  const [verified, setVerified] = useState(initial.verified);
  const [totalLoss, setTotalLoss] = useState(initial.totalLoss);

  useReportStream((event) => {
    const eventType =
      event.type === "submitted" ? event.targetType : event.report.targetType;
    if (targetType && eventType !== targetType) return;

    if (event.type === "submitted") {
      setTotal((n) => n + 1);
    } else {
      setVerified((n) => n + 1);
      setTotalLoss((n) => n + (Number(event.report.amount) || 0));
    }
  });

  return { total, verified, totalLoss };
}

const catIcons = {
  file: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
  ),
  star: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
  ),
  trend: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
  ),
};

export default function LiveStats({
  initial,
  variant,
  targetType,
  blacklistDesc = "Nomor telah terblacklist pada sistem kami",
}: LiveStatsProps) {
  const { total, verified, totalLoss } = useLiveCounters(initial, targetType);

  if (variant === "home") {
    const items = [
      { label: "Laporan", value: `${total}+`, sub: "Kasus dilaporkan", color: "text-slate-900", border: "border-r border-b sm:border-b-0 border-slate-100" },
      { label: "Terverifikasi", value: `${verified}+`, sub: "Penipuan terkonfirmasi", color: "text-emerald-700", border: "border-b sm:border-b-0 border-slate-100" },
      { label: "Kerugian", value: formatRupiah(totalLoss), sub: "Total kerugian dilaporkan", color: "text-red-500", border: "col-span-2 sm:col-span-1" },
    ];
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100 overflow-hidden"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 sm:divide-x divide-slate-100">
          {items.map((item, i) => (
            <div key={i} className={`px-5 py-5 sm:px-8 sm:py-6 ${item.border}`}>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{item.label}</p>
              <p className={`text-2xl sm:text-4xl font-black leading-none tabular-nums transition-colors ${item.color}`}>{item.value}</p>
              <p className="text-xs text-slate-500 mt-1.5 leading-snug">{item.sub}</p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const stats = [
    { icon: catIcons.file, value: total > 0 ? `${total.toLocaleString("id-ID")}+` : "0", desc: "Kasus penipuan yang telah dilaporkan pengguna" },
    { icon: catIcons.star, value: verified > 0 ? `${verified.toLocaleString("id-ID")}+` : "0", desc: blacklistDesc },
    { icon: catIcons.trend, value: totalLoss > 0 ? formatRupiah(totalLoss) : "Rp0", desc: "Total kerugian yang dilaporkan sejak platform berdiri" },
  ];

  return (
    <>
      <div className="grid grid-cols-3 sm:hidden bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden divide-x divide-slate-100">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col items-center py-4 px-2.5 text-center">
            <div className="text-emerald-600 mb-1.5">{s.icon}</div>
            <p className="text-base font-black text-emerald-600 leading-none mb-1 tabular-nums">{s.value}</p>
            <p className="text-[10px] text-slate-500 leading-tight">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="hidden sm:grid grid-cols-3 bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden divide-x divide-slate-100">
        {stats.map((s, i) => (
          <div key={i} className="flex items-start gap-4 px-8 py-8">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">{s.icon}</div>
            <div>
              <p className="text-2xl font-black text-emerald-600 mb-1 tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
