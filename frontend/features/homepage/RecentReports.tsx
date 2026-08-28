"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Landmark, Wallet, ArrowRight } from "lucide-react";
import * as motion from "motion/react-client";
import { formatDateID } from "@/core/utils";
import { useReportStream } from "@/features/realtime/useReportStream";

// Sama dengan yang dipakai homepage saat SSR pertama kali render list ini.
const MAX_ITEMS = 6;

export interface RecentReportItem {
  id: string;
  targetValue: string;
  targetType: string;
  targetName: string | null;
  bankName: string | null;
  walletName: string | null;
  createdAt: string;
  status: string;
}

const ewalletNames = ["gopay", "dana", "ovo", "shopeepay", "linkaja"];

const bankLogoMap: Record<string, string> = {
  bca: "/banks/bca.png", bni: "/banks/bni.png", bri: "/banks/bri.png",
  bsi: "/banks/bsi.png", cimb: "/banks/cimb.png", mandiri: "/banks/mandiri.png",
};
const ewalletLogoMap: Record<string, string> = {
  gopay: "/ewallets/gopay.png", dana: "/ewallets/dana.png", ovo: "/ewallets/ovo.png",
  shopeepay: "/ewallets/shopeepay.png", linkaja: "/ewallets/linkaja.png",
};

function getPlatformLogo(type: string, bankName: string | null, walletName: string | null) {
  const key = (walletName ?? bankName ?? "").toLowerCase();
  if (type === "ewallet" || ewalletNames.includes(key)) return ewalletLogoMap[key] ?? null;
  if (type === "bank_account") return bankLogoMap[key] ?? null;
  return null;
}

function getTargetMeta(type: string, bankName: string | null, walletName: string | null) {
  const key = (walletName ?? bankName ?? "").toLowerCase();
  if (type === "ewallet" || (type === "phone" && ewalletNames.includes(key)))
    return { icon: Wallet, label: walletName ?? bankName ?? "E-Wallet", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" };
  if (type === "bank_account")
    return { icon: Landmark, label: bankName ?? "Rekening Bank", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
  return { icon: Phone, label: "Nomor HP", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
}

const statusMap: Record<string, { label: string; className: string }> = {
  verified: { label: "Terverifikasi", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function RecentReports({ initial }: { initial: RecentReportItem[] }) {
  const [items, setItems] = useState<RecentReportItem[]>(() => initial.slice(0, MAX_ITEMS));

  useReportStream((event) => {
    if (event.type !== "verified") return;
    const r = event.report;
    setItems((prev) => {
      if (prev.some((p) => p.id === r.id)) return prev;
      const card: RecentReportItem = {
        id: r.id,
        targetValue: r.targetValue,
        targetType: r.targetType,
        targetName: r.targetName,
        bankName: r.bankName,
        walletName: r.walletName,
        createdAt: r.createdAt,
        status: "verified",
      };
      return [card, ...prev].slice(0, MAX_ITEMS);
    });
  });

  if (items.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-sm">Belum ada laporan yang masuk.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((report) => {
        const meta = getTargetMeta(report.targetType, report.bankName, report.walletName);
        const logoSrc = getPlatformLogo(report.targetType, report.bankName, report.walletName);
        const statusStyle = statusMap[report.status] ?? statusMap.pending;
        const displayName = report.targetName ?? "Anonim";

        return (
          <motion.div
            key={report.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Link
              href={`/check/${encodeURIComponent(report.targetValue)}`}
              className="block bg-white border border-slate-200 p-4 sm:p-5 rounded-xl hover:border-slate-300 hover:shadow-md transition-all group h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${statusStyle.className}`}>
                  {statusStyle.label}
                </span>
                <span className="text-xs text-slate-500 font-medium">{formatDateID(report.createdAt)}</span>
              </div>
              <div className="mb-4">
                <p className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors font-mono break-all">
                  {report.targetValue}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 truncate">
                  A.N. {displayName}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border ${meta.bg} ${meta.color} ${meta.border}`}>
                  {logoSrc ? (
                    <Image src={logoSrc} alt={meta.label} width={14} height={14} className="object-contain rounded-sm" />
                  ) : (
                    <meta.icon className="w-3 h-3" />
                  )}
                  <span className="truncate max-w-[80px]">{meta.label}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
