// ============================================
// 📁 LOKASI: app/check/[slug]/page.tsx
// ✅ FIX:
//    1. Branding konsisten: KawalTransaksi
//    2. formatNum() pakai dari lib/utils.ts (hapus duplikat lokal)
//    3. Hapus 'as any' casts
// ============================================

import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { formatDateID, formatNum } from '@/lib/utils';
import ShareButtons from './ShareButtons';

export const revalidate = 60;

interface CheckPageProps {
  params: Promise<{ slug: string }>;
}

// ✅ FIX: Branding konsisten
export async function generateMetadata({
  params,
}: CheckPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Cek Nomor ${slug} - KawalTransaksi`,
    description: `Hasil pengecekan nomor ${slug} di database laporan komunitas KawalTransaksi.`,
  };
}

export default async function CheckPage({ params }: CheckPageProps) {
  const { slug } = await params;

  if (!slug || !/^[0-9a-zA-Z\-]+$/.test(slug) || slug.length > 20) {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .select(
      'id, target_number, target_name, target_type, category, chronology, evidence_url, status, created_at'
    )
    .eq('target_number', slug)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching reports:', error);

  const reports = data ?? [];
  const verifiedReports = reports.filter((r) => r.status === 'verified');
  const pendingReports = reports.filter((r) => r.status === 'pending');

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (verifiedReports.length > 0) status = 'danger';
  else if (pendingReports.length > 0) status = 'warning';

  const statusConfig = {
    danger: {
      bg: 'bg-red-600',
      icon: ShieldAlert,
      title: 'Nomor Terindikasi Berbahaya',
      subtitle: 'Nomor ini memiliki laporan terverifikasi dari komunitas.',
    },
    warning: {
      bg: 'bg-amber-500',
      icon: AlertTriangle,
      title: 'Ada Laporan Pending',
      subtitle: 'Nomor ini sedang dalam proses verifikasi oleh moderator.',
    },
    safe: {
      bg: 'bg-emerald-600',
      icon: ShieldCheck,
      title: 'Belum Ada Laporan',
      subtitle: 'Nomor ini belum pernah dilaporkan oleh komunitas.',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const shareText =
    status === 'danger'
      ? `⚠️ WASPADA! Nomor ${formatNum(slug)} terindikasi PENIPU dengan ${verifiedReports.length} laporan terverifikasi. Cek di KawalTransaksi:`
      : status === 'warning'
        ? `⚠️ Nomor ${formatNum(slug)} sedang dalam proses verifikasi laporan penipuan. Cek di KawalTransaksi:`
        : `✅ Nomor ${formatNum(slug)} aman — belum ada laporan penipuan di KawalTransaksi:`;

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

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Status Card */}
        <div
          className={`${config.bg} rounded-2xl p-8 sm:p-10 text-white mb-10 relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
              <StatusIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-grow">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">
                Hasil Pengecekan
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
                {config.title}
              </h1>
              <p className="text-white/70 text-sm">{config.subtitle}</p>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">
                Nomor
              </p>
              {/* ✅ FIX: Pakai formatNum dari utils */}
              <p className="text-xl sm:text-2xl font-extrabold font-mono tracking-wider">
                {formatNum(slug)}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Terjadi kesalahan saat mengambil data.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-extrabold text-zinc-900">
                  {reports.length}
                </p>
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                  Total
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-extrabold text-red-600">
                  {verifiedReports.length}
                </p>
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                  Verified
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-extrabold text-amber-500">
                  {pendingReports.length}
                </p>
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                  Pending
                </p>
              </div>
            </div>

            {/* Reports List */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Riwayat Laporan
              </h2>
              <span className="text-xs text-zinc-400 font-medium">
                {reports.length} laporan
              </span>
            </div>

            {reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-md hover:border-zinc-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            report.status === 'verified'
                              ? 'bg-red-50 text-red-600'
                              : report.status === 'rejected'
                                ? 'bg-zinc-100 text-zinc-400'
                                : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {report.status === 'verified' && (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {report.status === 'pending' && (
                            <Clock className="w-3 h-3" />
                          )}
                          {report.status === 'rejected' && (
                            <XCircle className="w-3 h-3" />
                          )}
                          {report.status}
                        </span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {report.category}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 font-medium">
                        {formatDateID(report.created_at)}
                      </span>
                    </div>

                    <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4 mb-3">
                      <p className="text-sm text-zinc-600 leading-relaxed italic">
                        &quot;{report.chronology}&quot;
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      {report.target_name ? (
                        <p className="text-xs text-zinc-400">
                          <span className="font-bold uppercase tracking-wider mr-1.5">
                            a.n.
                          </span>
                          <span className="font-medium text-zinc-600">
                            {report.target_name}
                          </span>
                        </p>
                      ) : (
                        <div />
                      )}
                      {report.evidence_url && (
                        <a
                          href={report.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          Bukti <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">
                  Tidak Ditemukan
                </h3>
                <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                  Nomor ini belum pernah dilaporkan oleh komunitas kami.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-2xl p-6 text-white">
              <h3 className="text-base font-bold mb-2">
                Punya Bukti Penipuan?
              </h3>
              <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                Bantu lindungi orang lain dengan melaporkan nomor ini ke
                database kami.
              </p>
              <Link
                href="/report"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-zinc-900 font-bold text-sm rounded-xl hover:bg-zinc-100 transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                Buat Laporan
              </Link>
            </div>

            <ShareButtons slug={slug} shareText={shareText} />

            <div className="bg-white border border-zinc-200 rounded-2xl p-6">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4">
                Tips Keamanan
              </h4>
              <div className="space-y-4">
                {[
                  'Jangan berikan kode OTP kepada siapapun, termasuk yang mengaku dari bank.',
                  'Verifikasi identitas penjual sebelum melakukan transfer pembayaran.',
                  'Gunakan marketplace resmi atau rekening bersama untuk transaksi online.',
                ].map((tip, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 shrink-0 bg-zinc-100 rounded-md flex items-center justify-center">
                      <span className="text-[10px] font-bold text-zinc-500">
                        {i + 1}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}