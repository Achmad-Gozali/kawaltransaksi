import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ShieldCheck, ArrowLeft,
  ExternalLink,
  Globe, PlusCircle, AlertTriangle, Clock,
} from 'lucide-react';
import { formatDateID, formatNum, decodeSlug } from '@/lib/utils';
import ShareButtons from './ShareButtons';

export const revalidate = 60;

interface CheckPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CheckPageProps): Promise<Metadata> {
  const { slug } = await params;
  const realNumber = decodeSlug(slug);
  return {
    title: `cek nomor ${realNumber} - kawaltransaksi`,
    description: `hasil pengecekan nomor ${realNumber} di database laporan komunitas kawaltransaksi.`,
  };
}

function formatSosmed(acc: string): { label: string; isUrl: boolean; href: string } {
  const cleaned = acc.trim();
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return { label: cleaned, isUrl: true, href: cleaned };
  }
  const withoutAt = cleaned.replace(/^@+/, '');
  return { label: `@${withoutAt}`, isUrl: false, href: '' };
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function CheckPage({ params }: CheckPageProps) {
  const { slug } = await params;
  const realNumber = decodeSlug(slug);
  const checkedAt = new Date();

  if (!slug || slug.length > 50) {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('target_number', realNumber)
    .order('created_at', { ascending: false });

  if (error) console.error('error fetching reports:', error);

  const reports = (data as any[]) ?? [];
  const verifiedReports = reports.filter((r) => r.status === 'verified');
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const verifiedCount = verifiedReports.length;
  const totalLoss = reports.reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0);

  const allSocialAccounts: string[] = [];
  reports.forEach((r) => {
    if (Array.isArray(r.social_media_accounts)) {
      r.social_media_accounts.forEach((acc: string) => {
        if (acc && !allSocialAccounts.includes(acc)) allSocialAccounts.push(acc);
      });
    }
  });

  const suspectPhotoUrl = reports.find((r) => r.suspect_photo_url)?.suspect_photo_url ?? null;
  const hasOtherVictims = reports.some((r) => r.has_other_victims === 'yes');

  const allReportedTo: string[] = [];
  reports.forEach((r) => {
    if (Array.isArray(r.reported_to)) {
      r.reported_to.forEach((v: string) => {
        if (v && !allReportedTo.includes(v)) allReportedTo.push(v);
      });
    }
  });

  const reportedToLabel: Record<string, string> = {
    polisi: 'Polisi',
    ojk: 'OJK',
    platform: 'Platform terkait',
    belum: 'Belum lapor',
  };

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (verifiedCount > 0) status = 'danger';
  else if (pendingReports.length > 0) status = 'warning';

  const statusConfig = {
    danger: {
      barBg: 'bg-red-50',
      barLabel: 'text-red-800',
      barDesc: 'text-red-600',
      nameBadgeBg: 'bg-red-50',
      nameBadgeText: 'text-red-700',
      nameBadgeBorder: 'border-red-200',
      verdict: 'Terindikasi penipuan',
      verdictSub: `${verifiedCount} laporan telah diverifikasi oleh sistem & komunitas.`,
    },
    warning: {
      barBg: 'bg-amber-50',
      barLabel: 'text-amber-900',
      barDesc: 'text-amber-700',
      nameBadgeBg: 'bg-amber-50',
      nameBadgeText: 'text-amber-800',
      nameBadgeBorder: 'border-amber-200',
      verdict: 'Dalam investigasi',
      verdictSub: `${pendingReports.length} laporan masuk sedang diverifikasi moderator.`,
    },
    safe: {
      barBg: 'bg-emerald-50',
      barLabel: 'text-emerald-900',
      barDesc: 'text-emerald-700',
      nameBadgeBg: 'bg-emerald-50',
      nameBadgeText: 'text-emerald-800',
      nameBadgeBorder: 'border-emerald-200',
      verdict: 'Tidak ada laporan',
      verdictSub: 'Nomor ini bersih di database kami. Tetap waspada.',
    },
  };

  const config = statusConfig[status];

  const shareText = status === 'danger'
    ? `⚠️ waspada! nomor ${formatNum(realNumber)} terindikasi penipu dengan ${verifiedCount} laporan terverifikasi. cek di kawaltransaksi:`
    : status === 'warning'
      ? `⚠️ nomor ${formatNum(realNumber)} sedang dalam proses verifikasi laporan penipuan. cek di kawaltransaksi:`
      : `✅ nomor ${formatNum(realNumber)} aman — belum ada laporan penipuan di kawaltransaksi:`;

  const verificationSteps = [
    { label: 'Laporan diterima', done: true },
    { label: 'Dalam review moderator', done: status === 'warning' || status === 'danger' },
    { label: 'Terverifikasi', done: status === 'danger' },
  ];

const waspadaChecklist = [
    { text: 'Minta transfer atau DP duluan sebelum barang/jasa dikirim' },
    { text: 'Harga terlalu murah atau tidak masuk akal' },
    { text: 'Menekan untuk segera bayar / "stok terbatas"' },
    { text: 'Minta kode OTP, PIN, atau data pribadi' },
    { text: 'Menolak video call atau bertemu langsung untuk verifikasi' },
    { text: 'Rekening atas nama berbeda dengan identitas penjual' },
  ];

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
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
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">
            KawalTransaksi
          </span>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div className={`${config.barBg} px-4 sm:px-6 py-3`}>
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${config.barLabel}`}
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {config.verdict}
          </span>
          <span className={`text-xs ${config.barDesc}`}>— {config.verdictSub}</span>
          {/* Timestamp last checked */}
          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            Dicek {formatTimestamp(checkedAt)}
          </span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20">

        {/* Stats row */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              {
                value: String(reports.length),
                label: 'Laporan masuk',
                valueClass: 'text-slate-900',
                bg: 'bg-white hover:bg-slate-50',
              },
              {
                value: totalLoss > 0
                  ? new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(totalLoss)
                  : '—',
                label: 'Total kerugian',
                valueClass: totalLoss > 0 ? 'text-red-600' : 'text-slate-300',
                bg: 'bg-white hover:bg-slate-50',
              },
              {
                value: hasOtherVictims ? '!' : '—',
                label: 'Multi korban',
                valueClass: hasOtherVictims ? 'text-amber-500' : 'text-slate-300',
                bg: hasOtherVictims ? 'bg-amber-50 hover:bg-amber-100' : 'bg-white hover:bg-slate-50',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${stat.bg} rounded-lg border border-slate-200/80 shadow-sm p-4 sm:p-5 transition-colors`}
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
        )}

        {/* ── MAIN GRID ── */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* INFO NOMOR */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">
                Nomor terperiksa
              </p>
              <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">

                <div className="p-5 sm:p-6 flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[2rem] sm:text-5xl font-medium text-slate-900 tracking-tight break-all leading-none mb-4"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {formatNum(realNumber)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[11px] px-3 py-1 rounded-full font-medium border ${config.nameBadgeBg} ${config.nameBadgeText} ${config.nameBadgeBorder}`}>
                        {reports[0]?.target_name ? `a.n. ${reports[0].target_name}` : 'pemilik tidak diketahui'}
                      </span>
                      {reports[0]?.bank_name && (
                        <span className="text-[11px] px-3 py-1 rounded-full font-medium border border-slate-200 bg-slate-50 text-slate-600">
                          {reports[0].bank_name}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">
                      Data dikumpulkan dari laporan komunitas
                    </p>
                  </div>
                  {suspectPhotoUrl && (
                    <div className="shrink-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Foto penipu</p>
                      <div className="relative">
                        <img
                          src={suspectPhotoUrl}
                          alt="Foto profil penipu"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide shadow-sm">
                          Penipu
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {allSocialAccounts.length > 0 && (
                  <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] mb-2.5 font-medium">
                      Akun media sosial penipu
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allSocialAccounts.map((acc, i) => {
                        const fmt = formatSosmed(acc);
                        return (
                          <span
                            key={i}
                            className="text-[11px] px-2.5 py-1 border border-slate-200 bg-white text-slate-700 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {fmt.isUrl ? (
                              <a href={fmt.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                                {fmt.label} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : fmt.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {reports.some(r => r.link_url) && (
                  <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-red-50/30">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] mb-2.5 font-medium">
                      Tautan berbahaya terdeteksi
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="text-[11px] text-red-700 bg-white border border-red-100 px-2.5 py-1.5 rounded-lg break-all shadow-sm"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {reports.find(r => r.link_url)?.link_url}
                      </span>
                      <span className="text-[10px] font-semibold px-2.5 py-1.5 bg-red-600 text-white rounded-lg uppercase tracking-wider shrink-0 shadow-sm">
                        High risk
                      </span>
                    </div>
                  </div>
                )}

                {allReportedTo.length > 0 && (
                  <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] mb-2.5 font-medium">
                      Sudah dilaporkan ke
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allReportedTo.map((v) => (
                        <span
                          key={v}
                          className={`text-[11px] px-3 py-1 rounded-full font-medium border ${
                            v === 'belum'
                              ? 'bg-white text-slate-500 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {reportedToLabel[v] ?? v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── CHECKLIST WASPADA — hanya muncul kalau status safe ── */}
            {status === 'safe' && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">
                  Tetap waspada
                </p>
                <div className="bg-amber-50 rounded-lg border border-amber-200/80 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-amber-100 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <p className="text-xs font-semibold text-amber-800">
                      Meski belum ada laporan, waspada jika nomor ini...
                    </p>
                  </div>
                  <ul className="divide-y divide-amber-100">
                    {waspadaChecklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-amber-100/40 transition-colors">
                        <p className="text-xs text-amber-900 leading-relaxed">{item.text}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="px-5 py-3 border-t border-amber-100 bg-amber-100/30">
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Penipu bisa pakai nomor baru yang belum terdata. Jika ragu,{' '}
                      <Link href="/report" className="font-semibold underline underline-offset-2 hover:text-amber-900">
                        laporkan sekarang
                      </Link>{' '}
                      untuk melindungi orang lain.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* RIWAYAT LAPORAN */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-medium">
                  Riwayat laporan
                </p>
                <span className="text-[10px] text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full font-medium">
                  {reports.length} entri
                </span>
              </div>

              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white rounded-lg border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                            report.status === 'verified'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {report.status === 'verified' ? 'Terverifikasi' : 'Pending'}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium uppercase tracking-tight">
                            {report.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDateID(report.created_at)}
                        </div>
                      </div>

                      <div className="px-4 py-4">
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                          "{report.chronology}"
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 border-t border-slate-100 bg-slate-50/40">
                        {report.platform && (
                          <div className="text-[10px] text-slate-500 uppercase">
                            {report.platform}
                          </div>
                        )}
                        {report.loss_amount && (
                          <div className="text-[10px] font-semibold text-red-600 uppercase">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(report.loss_amount))}
                          </div>
                        )}
                        {report.incident_date && (
                          <div className="text-[10px] text-slate-400 uppercase">
                            Kejadian: {new Date(report.incident_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        {report.has_other_victims === 'yes' && (
                          <div className="text-[10px] font-semibold text-amber-600 uppercase">
                            Ada korban lain
                          </div>
                        )}
                        {report.evidence_url && (
                          <a href={report.evidence_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] text-emerald-600 hover:text-emerald-700 uppercase tracking-wide transition-colors ml-auto font-medium">
                            Lampiran <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {Array.isArray(report.social_media_accounts) && report.social_media_accounts.filter(Boolean).length > 0 && (
                        <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest mr-1">Sosmed:</span>
                          {report.social_media_accounts.filter(Boolean).map((acc: string, i: number) => {
                            const fmt = formatSosmed(acc);
                            return (
                              <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-md" style={{ fontFamily: "'DM Mono', monospace" }}>
                                {fmt.isUrl ? (
                                  <a href={fmt.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                    {fmt.label} <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : fmt.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-14 text-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-900 mb-1">Database bersih</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Tidak ditemukan riwayat laporan terkait nomor ini.
                  </p>
                </div>
              )}
            </div>

            {/* APA YANG HARUS DILAKUKAN */}
            {status !== 'safe' && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">
                  Apa yang harus kamu lakukan?
                </p>
                <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
                  {(status === 'danger' ? [
                    { step: '01', title: 'Jangan transfer', desc: 'Batalkan segera rencana transfer ke nomor ini. Uang yang sudah ditransfer sangat sulit untuk dikembalikan.' },
                    { step: '02', title: 'Simpan semua bukti', desc: 'Screenshot semua percakapan, nomor rekening, dan detail transaksi sebagai barang bukti.' },
                    { step: '03', title: 'Lapor ke platform', desc: 'Laporkan akun penipu ke platform tempat kamu berkomunikasi (WhatsApp, Instagram, Shopee, dll).' },
                    { step: '04', title: 'Lapor ke KawalTransaksi', desc: 'Tambahkan laporanmu agar komunitas lain terlindungi dari penipu yang sama.' },
                  ] : [
                    { step: '01', title: 'Tunda transaksi', desc: 'Nomor ini sedang dalam investigasi. Tunda dulu transaksi sampai status jelas.' },
                    { step: '02', title: 'Minta verifikasi identitas', desc: 'Minta pihak lawan untuk membuktikan identitas asli sebelum melanjutkan transaksi.' },
                    { step: '03', title: 'Pantau perkembangan', desc: 'Cek kembali halaman ini dalam beberapa hari. Moderator sedang memverifikasi laporan.' },
                  ]).map((item) => (
                    <div key={item.step} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                      <span className="text-[11px] text-slate-300 w-6 shrink-0 mt-0.5 font-bold tabular-nums" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {item.step}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 mb-1">{item.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STATUS VERIFIKASI */}
            {reports.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">
                  Status verifikasi
                </p>
                <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm px-6 py-5">
                  <div className="flex relative">
                    {verificationSteps.map((step, i) => (
                      <div key={i} className="relative flex flex-col items-center flex-1">
                        {i < verificationSteps.length - 1 && (
                          <div className={`absolute top-1.5 left-1/2 w-full h-[2px] z-0 ${
                            verificationSteps[i + 1].done ? 'bg-emerald-500' : 'bg-slate-200'
                          }`} />
                        )}
                        <div className={`relative z-10 w-3 h-3 rounded-full border-2 transition-colors mb-2 ${
                          step.done ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'bg-white border-slate-300'
                        }`} />
                        <p className={`text-[10px] text-center leading-snug px-1 ${
                          step.done ? 'text-slate-700 font-medium' : 'text-slate-400'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* CTA */}
            <div className="bg-slate-900 rounded-lg p-5 shadow-sm">
              <p className="text-sm font-semibold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                Punya bukti baru?
              </p>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Satu laporan dari kamu bisa melindungi ribuan orang.
              </p>
              <Link
                href="/report"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Buat laporan
              </Link>
            </div>

            {/* Share */}
            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 font-medium">
                Sebarkan peringatan
              </p>
              <ShareButtons slug={slug} shareText={shareText} />
            </div>

            {/* Tips */}
            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 font-medium">
                Tips keamanan
              </p>
              <ul className="space-y-3">
                {[
                  'Jangan pernah berikan kode OTP ke siapapun.',
                  'Gunakan rekening bersama / escrow resmi.',
                  'Verifikasi identitas sebelum transfer.',
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-500 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Kontak darurat */}
            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 font-medium">
                Kontak darurat
              </p>
              <div>
                {[
                  { name: 'OJK', desc: 'Otoritas Jasa Keuangan', phone: '157', url: 'https://konsumen.ojk.go.id', urlLabel: 'konsumen.ojk.go.id' },
                  { name: 'Polisi Siber', desc: 'Direktorat Siber Polri', phone: '110', url: 'https://patrolisiber.id', urlLabel: 'patrolisiber.id' },
                  { name: 'BRTI', desc: 'Badan Regulasi Telekomunikasi', phone: null, url: 'https://layanan.kominfo.go.id', urlLabel: 'layanan.kominfo.go.id' },
                ].map((contact, i, arr) => (
                  <div
                    key={contact.name}
                    className={`py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{contact.name}</p>
                        <p className="text-[10px] text-slate-400">{contact.desc}</p>
                      </div>
                      {contact.phone && (
                        <span className="text-sm font-bold text-slate-700 shrink-0 tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {contact.phone}
                        </span>
                      )}
                    </div>
                    <a
                      href={contact.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap 1 transition-colors font-medium"
                    >
                      {contact.urlLabel} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
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