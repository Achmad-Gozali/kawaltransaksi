// ============================================
// 📁 LOKASI: app/dashboard/page.tsx
// ✅ FIX:
//    1. Branding konsisten: KawalTransaksi
//    2. maskNumber() pakai dari lib/utils.ts (hapus duplikat lokal)
// ============================================

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  PlusCircle,
  ExternalLink,
  User,
  Phone,
  Building2,
} from 'lucide-react';
import type { Metadata } from 'next';
import type { Report } from '@/types/database';
import { formatDateID, maskNumber } from '@/lib/utils';

// ✅ FIX: Branding konsisten
export const metadata: Metadata = {
  title: 'Dashboard - KawalTransaksi',
  description: 'Lihat laporan yang pernah kamu buat di KawalTransaksi.',
};

export const revalidate = 30;

const statusConfig = {
  pending: {
    label: 'Menunggu',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
  verified: {
    label: 'Terverifikasi',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400',
  },
  rejected: {
    label: 'Ditolak',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-400',
  },
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: reports, error } = await supabase
    .from('reports')
    .select(
      'id, target_number, target_name, target_type, category, chronology, status, created_at'
    )
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  const allReports: Report[] = (reports ?? []) as Report[];

  const stats = {
    total: allReports.length,
    pending: allReports.filter((r) => r.status === 'pending').length,
    verified: allReports.filter((r) => r.status === 'verified').length,
    rejected: allReports.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Bar */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              <User className="w-3 h-3" />
              Dashboard
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              Laporan Saya
            </h1>
            <p className="text-zinc-400 text-sm mt-1 truncate max-w-xs">
              {user.email}
            </p>
          </div>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-zinc-900/10 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Buat Laporan
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Total',
              value: stats.total,
              color: 'text-zinc-900',
              sub: 'Laporan dibuat',
            },
            {
              label: 'Menunggu',
              value: stats.pending,
              color: 'text-amber-500',
              sub: 'Dalam review',
            },
            {
              label: 'Terverifikasi',
              value: stats.verified,
              color: 'text-emerald-500',
              sub: 'Dipublikasi',
            },
            {
              label: 'Ditolak',
              value: stats.rejected,
              color: 'text-red-500',
              sub: 'Tidak lolos',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white border border-zinc-200 rounded-2xl p-5"
            >
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                {item.label}
              </p>
              <p className={`text-3xl font-extrabold ${item.color}`}>
                {item.value}
              </p>
              <p className="text-xs text-zinc-400 mt-1">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Reports List */}
        <div>
          <h2 className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em] mb-5">
            Riwayat Laporan
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm font-medium">
              Gagal memuat laporan. Silakan refresh halaman.
            </div>
          )}

          {!error && allReports.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FileText className="w-7 h-7 text-zinc-300" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">
                Belum ada laporan
              </h3>
              <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">
                Kamu belum pernah membuat laporan. Bantu komunitas dengan
                melaporkan nomor penipu.
              </p>
              <Link
                href="/report"
                className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                Buat Laporan Pertama
              </Link>
            </div>
          )}

          {allReports.length > 0 && (
            <div className="space-y-3">
              {allReports.map((report) => {
                const status = statusConfig[report.status];
                const isPhone = report.target_type === 'phone';

                return (
                  <div
                    key={report.id}
                    className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-md hover:border-zinc-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                          {isPhone ? (
                            <Phone className="w-4 h-4 text-zinc-500" />
                          ) : (
                            <Building2 className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {/* ✅ FIX: Pakai maskNumber dari utils */}
                            <span className="text-base font-extrabold text-zinc-900 tracking-tight">
                              {maskNumber(report.target_number)}
                            </span>
                            {report.target_name && (
                              <span className="text-sm text-zinc-400">
                                · {report.target_name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                              {report.category}
                            </span>
                            <span className="text-zinc-200">·</span>
                            <span className="text-[11px] text-zinc-400">
                              {formatDateID(report.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${status.className}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                          />
                          {status.label}
                        </div>
                        {report.status === 'verified' && (
                          <Link
                            href={`/check/${report.target_number}`}
                            className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all group/btn"
                            title="Lihat halaman publik"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:text-white" />
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pl-14">
                      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
                        {report.chronology}
                      </p>
                    </div>

                    {report.status === 'pending' && (
                      <div className="mt-4 pl-14">
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Laporan sedang ditinjau moderator, maks. 1×24 jam.
                        </div>
                      </div>
                    )}
                    {report.status === 'rejected' && (
                      <div className="mt-4 pl-14">
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          Laporan tidak memenuhi syarat. Hubungi kami jika ada
                          pertanyaan.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}