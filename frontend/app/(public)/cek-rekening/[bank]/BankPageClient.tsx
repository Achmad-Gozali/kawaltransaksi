"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  Hash,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { encodeSlug } from "@/core/utils";

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface BankData {
  name: string;
  fullName: string;
  logo: string;
  kodeBank: string;
  callCenter: string;
  website: string;
  websiteLabel: string;
  description: string;
  transferTips: string[];
  securityTips: string[];
  faqs: { question: string; answer: string }[];
}

interface ReportRow {
  target_number: string;
  target_name: string | null;
  status: string;
  created_at: string;
  masked: string;
  dateFormatted: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface Props {
  bankData: BankData;
  bankId: string; // FIX: tambah bankId untuk query param
  reports: ReportRow[];
  totalCount: number;
  verifiedCount: number;
  pendingCount: number;
  categoryBreakdown: CategoryCount[];
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function BankPageClient({
  bankData: data,
  bankId,
  reports,
  totalCount,
  verifiedCount,
  pendingCount,
}: Props) {
  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 pb-16"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── SUBNAVBAR — mobile only ── */}
      <div className="sm:hidden bg-white border-b border-slate-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link
            href="/cek-rekening"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">
            KawalTransaksi
          </span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Kiri */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-24 h-10 relative shrink-0">
                  <Image
                    src={data.logo}
                    alt={`Logo ${data.fullName}`}
                    fill
                    className="object-contain object-left"
                  />
                </div>
                <div>
                  <h1
                    className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {data.fullName}
                  </h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] mt-0.5 font-medium">
                    Verifikasi rekening · {data.name}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed mb-5 max-w-lg">
                {data.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" /> Kunjungi website
                </a>
                <a
                  href={`tel:${data.callCenter}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" /> {data.callCenter}
                </a>
              </div>
            </div>

            {/* Kanan — sidebar: kode bank + call center */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[8px] border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="flex items-start gap-3 px-4 py-4 border-b border-slate-100">
                  <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.12em] font-medium mb-0.5">
                      Kode bank
                    </p>
                    <span
                      className="text-lg font-bold text-slate-900"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {data.kodeBank}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-4 py-4">
                  <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.12em] font-medium mb-0.5">
                      Call center
                    </p>
                    <a
                      href={`tel:${data.callCenter}`}
                      className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {data.callCenter}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              value: totalCount,
              label: "Total laporan",
              valueClass: "text-slate-900",
            },
            {
              value: verifiedCount,
              label: "Verified scam",
              valueClass: verifiedCount > 0 ? "text-red-600" : "text-slate-300",
            },
            {
              value: pendingCount,
              label: "Pending",
              valueClass:
                pendingCount > 0 ? "text-amber-500" : "text-slate-300",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-[8px] border border-slate-200/80 shadow-sm p-4 sm:p-5"
            >
              <p
                className={`text-3xl sm:text-4xl font-bold leading-none tabular-nums ${stat.valueClass}`}
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {stat.value}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.12em]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* DAFTAR LAPORAN */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-medium">
              Rekening {data.name} dilaporkan
            </p>
            <Link
              href="/report"
              className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              Lapor rekening <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {reports.length > 0 ? (
            <div className="bg-white rounded-[8px] border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Desktop table */}
              <table className="w-full text-left hidden md:table">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.12em]">
                      Nomor rekening
                    </th>
                    <th className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.12em]">
                      Status
                    </th>
                    <th className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.12em]">
                      Tanggal
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report, i) => (
                    <tr
                      key={i}
                      className="group hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p
                          className="text-sm font-medium text-slate-900 tracking-wider"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {report.masked}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          a.n. {report.target_name || "Tidak diketahui"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            report.status === "verified"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {report.status === "verified"
                            ? "Terverifikasi"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] text-slate-400">
                          {report.dateFormatted}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {/* FIX: pakai encodeSlug + ?type=bank&bank=xxx */}
                        <Link
                          href={`/check/${encodeSlug(report.target_number)}?type=bank&bank=${bankId}`}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-slate-100">
                {reports.map((report, i) => (
                  // FIX: pakai encodeSlug + ?type=bank&bank=xxx
                  <Link
                    key={i}
                    href={`/check/${encodeSlug(report.target_number)}?type=bank&bank=${bankId}`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/60 transition-colors"
                  >
                    <div>
                      <p
                        className="text-sm font-medium text-slate-900 tracking-wider"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {report.masked}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        a.n. {report.target_name || "Tidak diketahui"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          report.status === "verified"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {report.status === "verified"
                          ? "Terverifikasi"
                          : "Pending"}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[8px] border border-slate-200/80 shadow-sm p-14 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-900 mb-1">
                Belum ada laporan
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tidak ada rekening {data.name} yang dilaporkan saat ini.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-slate-900 rounded-[8px] p-7 sm:p-10 text-center shadow-sm">
          <p
            className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Cek rekening {data.name} sebelum transfer
          </p>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Verifikasi nomor rekening untuk memastikan keamanan transaksi kamu.
          </p>
          <Link
            href="/cek-rekening"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-[8px] transition-colors"
          >
            Cek rekening sekarang <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
