'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, ArrowRight,
  Phone, ShieldCheck, Globe, ExternalLink,
} from 'lucide-react';

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface EwalletData {
  name: string;
  fullName: string;
  logo: string;
  callCenter: string;
  website: string;
  websiteLabel: string;
  helpUrl: string;
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
  walletData: EwalletData;
  reports: ReportRow[];
  totalCount: number;
  verifiedCount: number;
  pendingCount: number;
  categoryBreakdown: CategoryCount[];
}

// ── SOCIAL MEDIA MAP ──────────────────────────────────────────────────────────
const SOCIALS: Record<string, { instagram?: string; tiktok?: string }> = {
  GoPay: {
    instagram: 'https://www.instagram.com/gopayindonesia?igsh=amo1enhtbHRocnAx',
    tiktok: 'https://www.tiktok.com/@gopayindonesia?_r=1&_t=ZS-95BnWJjSmDV',
  },
  DANA: {
    instagram: 'https://www.instagram.com/dana.id?igsh=MXNwa2JyN29temV6Zg==',
    tiktok: 'https://www.tiktok.com/@dana.indonesia?_r=1&_t=ZS-95BnaGLA0N2',
  },
  LinkAja: {
    instagram: 'https://www.instagram.com/linkaja?igsh=ejNjdjg4c3R4YnY4',
    tiktok: 'https://www.tiktok.com/@linkajaid?_r=1&_t=ZS-95BnjrE9TnA',
  },
  ShopeePay: {
    instagram: 'https://www.instagram.com/shopee_id?igsh=MW9sa2hsc2JiMWZ1bA==',
    tiktok: 'https://www.tiktok.com/@shopee_id?_r=1&_t=ZS-95Bo2gL2ZGe',
  },
  OVO: {
    instagram: 'https://www.instagram.com/ovo_id?igsh=MWZiczE3NnYybDQ1Zw==',
    tiktok: 'https://www.tiktok.com/@ovo.id?_r=1&_t=ZS-95BoCLQZGOT',
  },
};

// ── SOCIAL ICONS (SVG inline) ─────────────────────────────────────────────────
function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
    </svg>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function EwalletPageClient({
  walletData: data,
  reports,
  totalCount,
  verifiedCount,
  pendingCount,
}: Props) {
  const socials = SOCIALS[data.name] ?? {};
  const hasSocials = socials.instagram || socials.tiktok;

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 pb-16"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── SUBNAVBAR — mobile only ── */}
      <div className="sm:hidden bg-white border-b border-slate-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link
            href="/cek-nomor"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">KawalTransaksi</span>
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
                    Verifikasi akun · {data.name}
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

            {/* Kanan — sidebar sosmed */}
            {hasSocials && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-[8px] border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.12em] font-medium">
                      Akun resmi {data.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                      Pastikan hanya berinteraksi dengan akun terverifikasi berikut.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {socials.instagram && (
                      <a
                        href={socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/60 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-pink-50 border border-pink-100 rounded-[8px] flex items-center justify-center shrink-0 text-pink-500">
                            <InstagramIcon />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-900">Instagram</p>
                            <p className="text-[10px] text-slate-400">@{socials.instagram.split('/').filter(Boolean).pop()?.split('?')[0]}</p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </a>
                    )}

                    {socials.tiktok && (
                      <a
                        href={socials.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/60 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-slate-900 border border-slate-800 rounded-[8px] flex items-center justify-center shrink-0 text-white">
                            <TiktokIcon />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-900">TikTok</p>
                            <p className="text-[10px] text-slate-400">@{socials.tiktok.split('@')[1]?.split('?')[0]}</p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: totalCount, label: 'Total laporan', valueClass: 'text-slate-900' },
            { value: verifiedCount, label: 'Verified scam', valueClass: verifiedCount > 0 ? 'text-red-600' : 'text-slate-300' },
            { value: pendingCount, label: 'Pending', valueClass: pendingCount > 0 ? 'text-amber-500' : 'text-slate-300' },
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
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.12em]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* DAFTAR LAPORAN */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-medium">
              Akun {data.name} dilaporkan
            </p>
            <Link
              href="/report"
              className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              Lapor akun <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {reports.length > 0 ? (
            <div className="bg-white rounded-[8px] border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Desktop table */}
              <table className="w-full text-left hidden md:table">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.12em]">ID akun / nomor HP</th>
                    <th className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.12em]">Status</th>
                    <th className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.12em]">Tanggal</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report, i) => (
                    <tr key={i} className="group hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <p
                          className="text-sm font-medium text-slate-900 tracking-wider"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {report.masked}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          a.n. {report.target_name || 'Tidak diketahui'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            report.status === 'verified'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {report.status === 'verified' ? 'Terverifikasi' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] text-slate-400">{report.dateFormatted}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/check/${report.target_number}`}
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
                  <Link
                    key={i}
                    href={`/check/${report.target_number}`}
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
                        a.n. {report.target_name || 'Tidak diketahui'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          report.status === 'verified'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {report.status === 'verified' ? 'Terverifikasi' : 'Pending'}
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
              <p className="text-sm font-semibold text-slate-900 mb-1">Belum ada laporan</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tidak ada akun {data.name} yang dilaporkan saat ini.
              </p>
            </div>
          )}
        </div>

        {/* CTA CEK REKENING */}
        <div className="bg-slate-900 rounded-[8px] p-7 sm:p-10 text-center shadow-sm">
          <p
            className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight uppercase tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            ragu sama nomor rekening tujuan?
          </p>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            jangan asal transfer. pastikan nomor rekening tujuan aman dan tidak memiliki riwayat penipuan di database kami.
          </p>
          <Link
            href="/cek-rekening"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-[8px] transition-colors uppercase tracking-wider"
          >
            cek rekening sekarang <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}