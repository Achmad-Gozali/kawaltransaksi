import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, CheckCircle2, XCircle, FileText,
  PlusCircle, ArrowRight, Phone, Building2, FilePen,
} from 'lucide-react';
import type { Metadata } from 'next';
import * as motion from 'motion/react-client';
import { formatDateID, maskNumber } from '@/lib/utils';
import WithdrawButton from '@/components/WithdrawButton';
import EditReportButton from '@/components/EditReportButton';
import DownloadPDFButton from '@/components/DownloadPDFButton';

export const metadata: Metadata = {
  title: 'Laporan Saya - KawalTransaksi',
  description: 'Lihat laporan yang pernah kamu buat di KawalTransaksi.',
};

export const revalidate = 30;

const statusConfig = {
  pending:   { label: 'Menunggu',        icon: Clock,        className: 'bg-amber-50 text-amber-700 border-amber-200'     },
  verified:  { label: 'Terverifikasi',   icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:  { label: 'Ditolak',         icon: XCircle,      className: 'bg-red-50 text-red-700 border-red-200'           },
  withdrawn: { label: 'Sedang Direvisi', icon: FilePen,      className: 'bg-blue-50 text-blue-700 border-blue-200'        },
};

export default async function LaporanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ── Fetch profile untuk nama pelapor ────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const reporterName  = profile?.full_name ?? null;
  const reporterEmail = user.email ?? '';

  // ── Fetch laporan milik user ──────────────────────────────────────────────
  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, target_number, target_name, target_type, category, chronology, status, created_at, bank_name, loss_amount, incident_date, platform, link_url, social_media_accounts, has_other_victims, reported_to, store_name, suspect_city')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  const allReports = (reports ?? []) as any[];

  const stats = {
    total:    allReports.length,
    pending:  allReports.filter(r => r.status === 'pending').length,
    verified: allReports.filter(r => r.status === 'verified').length,
    rejected: allReports.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Riwayat Laporan</h1>
            <p className="text-zinc-400 text-sm mt-1 truncate max-w-xs">{user.email}</p>
          </div>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all active:scale-95 hover:scale-[1.02] shadow-lg shadow-zinc-900/10 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Buat Laporan
          </Link>
        </motion.div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total',         value: stats.total,    color: 'text-zinc-900',    sub: 'Laporan dibuat' },
            { label: 'Menunggu',      value: stats.pending,  color: 'text-amber-500',   sub: 'Dalam review'   },
            { label: 'Terverifikasi', value: stats.verified, color: 'text-emerald-500', sub: 'Dipublikasi'    },
            { label: 'Ditolak',       value: stats.rejected, color: 'text-red-500',     sub: 'Tidak lolos'    },
          ].map((item, i) => (
            <motion.div key={item.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-md hover:border-zinc-300 transition-all"
            >
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className={`text-3xl font-extrabold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-zinc-400 mt-1">{item.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── List Laporan ── */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em] mb-5"
          >
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
              className="bg-white border border-zinc-200 rounded-2xl p-16 text-center"
            >
              <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FileText className="w-7 h-7 text-zinc-300" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">Belum ada laporan</h3>
              <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">
                Kamu belum pernah membuat laporan. Bantu komunitas dengan melaporkan nomor penipu.
              </p>
              <Link href="/report" className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all active:scale-95">
                <PlusCircle className="w-4 h-4" /> Buat Laporan Pertama
              </Link>
            </motion.div>
          )}

          {allReports.length > 0 && (
            <div className="space-y-3">
              {allReports.map((report, i) => {
                const status     = statusConfig[report.status as keyof typeof statusConfig] ?? statusConfig.pending;
                const StatusIcon = status.icon;
                const isPhone    = report.target_type === 'phone';
                const isWithdrawn = report.status === 'withdrawn';

                return (
                  <motion.div key={report.id}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -1 }}
                    className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all ${isWithdrawn ? 'border-blue-100' : 'border-zinc-200 hover:border-zinc-300'}`}
                  >
                    {/* ── Row utama ── */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                          {isPhone
                            ? <Phone className="w-4 h-4 text-zinc-500" />
                            : <Building2 className="w-4 h-4 text-zinc-500" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-base font-extrabold tracking-tight text-zinc-900">{maskNumber(report.target_number)}</span>
                            {report.target_name && <span className="text-sm text-zinc-400">· {report.target_name}</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{report.category}</span>
                            <span className="text-zinc-200">·</span>
                            <span className="text-[11px] text-zinc-400">{formatDateID(report.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${status.className}`}>
                          <StatusIcon className="w-3 h-3" />{status.label}
                        </div>
                        {report.status === 'verified' && (
                          <Link
                            href={`/check/${report.target_number}`}
                            className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all group/btn"
                            title="Lihat halaman publik"
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:text-white" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Kronologi preview */}
                    <div className="mt-4 pl-14">
                      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{report.chronology}</p>
                    </div>

                    {/* Status info */}
                    {report.status === 'pending' && (
                      <div className="mt-4 pl-14">
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                          <Clock className="w-3.5 h-3.5" /> Laporan sedang ditinjau moderator, maks. 1×24 jam.
                        </div>
                      </div>
                    )}
                    {report.status === 'rejected' && (
                      <div className="mt-4 pl-14">
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Laporan tidak memenuhi syarat. Hubungi kami jika ada pertanyaan.
                        </div>
                      </div>
                    )}
                    {report.status === 'withdrawn' && (
                      <div className="mt-4 pl-14">
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 font-medium">
                          <FilePen className="w-3.5 h-3.5" /> Laporan sedang kamu revisi. Edit dan kirim ulang untuk direview admin.
                        </div>
                      </div>
                    )}

                    {/* ── Action buttons ── */}
                    <div className="mt-4 pl-14 flex items-center gap-2 flex-wrap">
                      {(report.status === 'pending' || report.status === 'verified') && (
                        <WithdrawButton reportId={report.id} />
                      )}
                      {report.status === 'withdrawn' && (
                        <EditReportButton report={report} />
                      )}

                      {/* Download PDF — muncul di semua status */}
                      <DownloadPDFButton
                        report={report}
                        reporterName={reporterName}
                        reporterEmail={reporterEmail}
                      />
                    </div>
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