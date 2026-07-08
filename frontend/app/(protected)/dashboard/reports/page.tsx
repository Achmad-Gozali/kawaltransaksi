import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, CheckCircle2, XCircle, FileText, PlusCircle,
  ArrowRight, Phone, Building2,
} from 'lucide-react';
import type { Metadata } from 'next';
import { formatDateID } from '@/core/utils';
import AppealButton from '@/features/report/AppealButton';

export const metadata: Metadata = {
  title: 'Laporan Saya — KawalTransaksi',
  description: 'Lihat laporan yang pernah kamu buat di KawalTransaksi.',
};

export const dynamic = 'force-dynamic';

const STATUS_CONFIG = {
  pending:  { label: 'Menunggu',      icon: Clock,        className: 'bg-amber-50 text-amber-700 border-amber-200'       },
  verified: { label: 'Terverifikasi', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Ditolak',       icon: XCircle,      className: 'bg-red-50 text-red-700 border-red-200'             },
} as const;

const STAT_CARDS = [
  { key: 'total',    label: 'Total',         color: 'text-zinc-900',    sub: 'Laporan dibuat' },
  { key: 'pending',  label: 'Menunggu',      color: 'text-amber-500',   sub: 'Dalam review'   },
  { key: 'verified', label: 'Terverifikasi', color: 'text-emerald-500', sub: 'Dipublikasi'    },
  { key: 'rejected', label: 'Ditolak',       color: 'text-red-500',     sub: 'Tidak lolos'    },
] as const;

export default async function LaporanPage() {
  const cookieStore  = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  if (!refreshToken) redirect('/login');

  const base = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  // Ambil access token via refresh
  const refreshRes = await fetch(`${base}/api/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });

  if (!refreshRes.ok) redirect('/login');

  const { accessToken } = await refreshRes.json();

  const reportsRes = await fetch(`${base}/api/reports/my`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  const { data: reports } = await reportsRes.json().catch(() => ({ data: [] }));
  const allReports = (reports ?? []) as any[];

  const stats = {
    total:    allReports.length,
    pending:  allReports.filter(r => r.status === 'pending').length,
    verified: allReports.filter(r => r.status === 'verified').length,
    rejected: allReports.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Laporan Saya</h1>
          </div>
          <Link href="/report"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors shrink-0">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Buat Laporan</span>
            <span className="sm:hidden">Buat</span>
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
          {STAT_CARDS.map((item) => (
            <div key={item.key} className="bg-white border border-zinc-200 rounded-2xl p-3 sm:p-4">
              <p className="text-[11px] sm:text-xs text-zinc-400 mb-1">{item.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${item.color}`}>{stats[item.key]}</p>
              <p className="text-[10px] text-zinc-300 mt-0.5 hidden sm:block">{item.sub}</p>
            </div>
          ))}
        </div>

        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Riwayat</p>

        {allReports.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
            <div className="w-11 h-11 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-5 h-5 text-zinc-300" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">Belum ada laporan</h3>
            <p className="text-sm text-zinc-400 mb-5 max-w-xs mx-auto">
              Bantu komunitas dengan melaporkan nomor atau rekening penipu.
            </p>
            <Link href="/report"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors">
              <PlusCircle className="w-4 h-4" /> Buat Laporan Pertama
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {allReports.map((report) => {
            const status     = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            const isPhone    = report.targetType === 'phone';
            const canAppeal  = report.status === 'rejected';

            return (
              <div key={report.id} className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 hover:border-zinc-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      {isPhone
                        ? <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />
                        : <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900 text-sm sm:text-base">{report.targetValue}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-400">{report.category}</span>
                        <span className="text-zinc-200">·</span>
                        <span className="text-xs text-zinc-400">{formatDateID(report.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-semibold ${status.className}`}>
                      <StatusIcon className="w-3 h-3 shrink-0" />
                      <span>{status.label}</span>
                    </div>
                    {report.status === 'verified' && (
                      <Link href={`/check/${report.targetValue}`}
                        className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-900 transition-colors group">
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                      </Link>
                    )}
                  </div>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 mt-3 pl-11 sm:pl-12">
                  {report.chronology || report.description}
                </p>

                {report.status === 'pending' && (
                  <p className="mt-3 pl-11 sm:pl-12 text-xs text-amber-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    Sedang ditinjau — maks. 1×24 jam.
                  </p>
                )}

                {report.status === 'rejected' && (
                  <div className="mt-3 pl-11 sm:pl-12 space-y-1">
                    <p className="text-xs text-red-500 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      Tidak memenuhi syarat verifikasi.
                    </p>
                  </div>
                )}

                {canAppeal && (
                  <div className="mt-4 pl-11 sm:pl-12">
                    <AppealButton reportId={report.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}