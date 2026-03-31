import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ShieldCheck, ArrowLeft,
  ExternalLink,
  MessageSquare, DollarSign, Calendar, FileText, Users,
  AtSign, ShieldAlert, Globe, PlusCircle,
} from 'lucide-react';
import { formatDateID, formatNum } from '@/lib/utils';
import ShareButtons from './ShareButtons';

export const revalidate = 60;

interface CheckPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CheckPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `cek nomor ${slug} - kawaltransaksi`,
    description: `hasil pengecekan nomor ${slug} di database laporan komunitas kawaltransaksi.`,
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

export default async function CheckPage({ params }: CheckPageProps) {
  const { slug } = await params;

  if (!slug || !/^[0-9a-zA-Z\-]+$/.test(slug) || slug.length > 20) {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('target_number', slug)
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
      barBorder: 'border-l-red-500',
      barBg: 'bg-red-50',
      barDot: 'bg-red-500',
      barLabel: 'text-red-800',
      barDesc: 'text-red-700',
      nameBadgeBg: 'bg-red-50',
      nameBadgeText: 'text-red-800',
      nameBadgeBorder: 'border-red-200',
      verdict: 'Terindikasi penipuan',
      verdictSub: `${verifiedCount} laporan telah diverifikasi oleh sistem & komunitas.`,
      reportBorder: 'border-l-red-400',
      statusBadgeBg: 'bg-red-50',
      statusBadgeText: 'text-red-700',
      statusBadgeBorder: 'border-red-200',
    },
    warning: {
      barBorder: 'border-l-amber-400',
      barBg: 'bg-amber-50',
      barDot: 'bg-amber-400',
      barLabel: 'text-amber-900',
      barDesc: 'text-amber-800',
      nameBadgeBg: 'bg-amber-50',
      nameBadgeText: 'text-amber-800',
      nameBadgeBorder: 'border-amber-200',
      verdict: 'Dalam investigasi',
      verdictSub: `${pendingReports.length} laporan masuk sedang diverifikasi moderator.`,
      reportBorder: 'border-l-amber-400',
      statusBadgeBg: 'bg-amber-50',
      statusBadgeText: 'text-amber-700',
      statusBadgeBorder: 'border-amber-200',
    },
    safe: {
      barBorder: 'border-l-emerald-500',
      barBg: 'bg-emerald-50',
      barDot: 'bg-emerald-500',
      barLabel: 'text-emerald-900',
      barDesc: 'text-emerald-800',
      nameBadgeBg: 'bg-emerald-50',
      nameBadgeText: 'text-emerald-800',
      nameBadgeBorder: 'border-emerald-200',
      verdict: 'Tidak ada laporan',
      verdictSub: 'Nomor ini bersih di database kami. Tetap waspada.',
      reportBorder: 'border-l-emerald-400',
      statusBadgeBg: 'bg-emerald-50',
      statusBadgeText: 'text-emerald-700',
      statusBadgeBorder: 'border-emerald-200',
    },
  };

  const config = statusConfig[status];

  const shareText = status === 'danger'
    ? `⚠️ waspada! nomor ${formatNum(slug)} terindikasi penipu dengan ${verifiedCount} laporan terverifikasi. cek di kawaltransaksi:`
    : status === 'warning'
      ? `⚠️ nomor ${formatNum(slug)} sedang dalam proses verifikasi laporan penipuan. cek di kawaltransaksi:`
      : `✅ nomor ${formatNum(slug)} aman — belum ada laporan penipuan di kawaltransaksi:`;

  const verificationSteps = [
    { label: 'Laporan diterima', done: true },
    { label: 'Dalam review moderator', done: status === 'warning' || status === 'danger' },
    { label: 'Terverifikasi', done: status === 'danger' },
  ];

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── TOP NAV ── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/cek-nomor"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <span className="hidden sm:block text-[10px] text-slate-300 uppercase tracking-widest">
            KawalTransaksi · Database Registry
          </span>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div className={`border-l-4 ${config.barBorder} ${config.barBg} px-4 sm:px-6 py-3`}>
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full shrink-0 ${config.barDot}`} />
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${config.barLabel}`}
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {config.verdict}
          </span>
          <span className={`text-xs ${config.barDesc}`}>— {config.verdictSub}</span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">

        {/* Stats row */}
        {reports.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-slate-50 p-4">
              <p
                className="text-2xl font-bold text-slate-900 leading-none"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {reports.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">Laporan</p>
            </div>
            <div className="bg-slate-50 p-4">
              <p
                className="text-2xl font-bold text-slate-900 leading-none"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {totalLoss > 0
                  ? new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(totalLoss)
                  : '—'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">Total rugi</p>
            </div>
            <div className="bg-slate-50 p-4">
              <p
                className={`text-2xl font-bold leading-none ${hasOtherVictims ? 'text-amber-500' : 'text-slate-300'}`}
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {hasOtherVictims ? '!' : '—'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">Multi korban</p>
            </div>
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* INFO PENIPU — single block */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Nomor terperiksa</p>
              <div className="border border-slate-200">

                {/* Number + name + photo */}
                <div className="p-5 flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-3xl sm:text-4xl font-medium text-slate-900 tracking-tight break-all"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {formatNum(slug)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className={`text-[11px] px-2.5 py-1 border ${config.nameBadgeBg} ${config.nameBadgeText} ${config.nameBadgeBorder}`}
                      >
                        {reports[0]?.target_name ? `a.n. ${reports[0].target_name}` : 'pemilik tidak diketahui'}
                      </span>
                      {reports[0]?.bank_name && (
                        <span className="text-[11px] px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-600">
                          {reports[0].bank_name}
                        </span>
                      )}
                    </div>
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-3">
                      <Users className="w-3 h-3" />
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
                          className="w-16 h-16 object-cover border border-red-200"
                        />
                        <span className="absolute -bottom-0 -right-0 bg-red-600 text-white text-[8px] font-medium px-1.5 py-0.5 uppercase">
                          Penipu
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sosmed */}
                {allSocialAccounts.length > 0 && (
                  <div className="px-5 py-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <AtSign className="w-3 h-3" /> Akun media sosial penipu
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allSocialAccounts.map((acc, i) => {
                        const fmt = formatSosmed(acc);
                        return (
                          <span
                            key={i}
                            className="text-[11px] px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-700"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {fmt.isUrl ? (
                              <a
                                href={fmt.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {fmt.label} <ExternalLink className="w-2.5 h-2.5 inline" />
                              </a>
                            ) : fmt.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tautan berbahaya */}
                {reports.some(r => r.link_url) && (
                  <div className="px-5 py-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Tautan berbahaya terdeteksi
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="text-[11px] text-red-700 bg-red-50 border border-red-100 px-2.5 py-1 break-all"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {reports.find(r => r.link_url)?.link_url}
                      </span>
                      <span className="text-[10px] font-medium px-2.5 py-1 bg-red-600 text-white uppercase tracking-wider shrink-0">
                        High risk
                      </span>
                    </div>
                  </div>
                )}

                {/* Dilaporkan ke */}
                {allReportedTo.length > 0 && (
                  <div className="px-5 py-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-3 h-3" /> Sudah dilaporkan ke
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allReportedTo.map((v) => (
                        <span
                          key={v}
                          className={`text-[11px] px-2.5 py-1 border ${
                            v === 'belum'
                              ? 'bg-slate-50 text-slate-500 border-slate-200'
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

            {/* RIWAYAT LAPORAN */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Riwayat laporan
                </p>
                <span className="text-[10px] text-slate-400">{reports.length} entri</span>
              </div>

              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className={`border border-slate-200 border-l-4 ${config.reportBorder}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 border ${
                              report.status === 'verified'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {report.status === 'verified' ? 'Terverifikasi' : 'Pending'}
                          </span>
                          <span className="text-[11px] text-slate-600 uppercase tracking-tight">
                            {report.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {formatDateID(report.created_at)}
                        </div>
                      </div>

                      <div className="px-4 py-4">
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                          "{report.chronology}"
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                        {report.platform && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase">
                            <MessageSquare className="w-3 h-3 text-slate-400" />
                            {report.platform}
                          </div>
                        )}
                        {report.loss_amount && (
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-red-600 uppercase">
                            <DollarSign className="w-3 h-3" />
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(report.loss_amount))}
                          </div>
                        )}
                        {report.incident_date && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase">
                            <Calendar className="w-3 h-3" />
                            Kejadian: {new Date(report.incident_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        {report.has_other_victims === 'yes' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 uppercase">
                            <Users className="w-3 h-3" /> Ada korban lain
                          </div>
                        )}
                        {report.evidence_url && (
                          <a
                            href={report.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] text-emerald-600 hover:text-emerald-700 uppercase tracking-wide transition-colors ml-auto"
                          >
                            Lampiran <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {Array.isArray(report.social_media_accounts) && report.social_media_accounts.filter(Boolean).length > 0 && (
                        <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 items-center bg-white">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest mr-1">
                            Sosmed:
                          </span>
                          {report.social_media_accounts.filter(Boolean).map((acc: string, i: number) => {
                            const fmt = formatSosmed(acc);
                            return (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600"
                                style={{ fontFamily: "'DM Mono', monospace" }}
                              >
                                {fmt.isUrl ? (
                                  <a href={fmt.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                    {fmt.label} <ExternalLink className="w-2.5 h-2.5 inline" />
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
                <div className="border border-slate-200 p-14 text-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900 mb-1">Database bersih</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Tidak ditemukan riwayat laporan terkait nomor ini.
                  </p>
                </div>
              )}
            </div>

            {/* APA YANG HARUS DILAKUKAN */}
            {status !== 'safe' && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">
                  Apa yang harus kamu lakukan?
                </p>
                <div className="border border-slate-200 divide-y divide-slate-100">
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
                    <div key={item.step} className="flex items-start gap-4 px-4 py-4">
                      <span
                        className="text-[11px] text-slate-400 w-6 shrink-0 mt-0.5"
                        style={{ fontFamily: "'Syne', sans-serif" }}
                      >
                        {item.step}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-slate-900 mb-1">{item.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STATUS VERIFIKASI MODERATOR */}
            {reports.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">
                  Status verifikasi
                </p>
                <div className="border border-slate-200 px-5 py-4">
                  <div className="flex items-center gap-0">
                    {verificationSteps.map((step, i) => (
                      <div key={i} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1.5 flex-1">
                          <div
                            className={`w-2.5 h-2.5 rounded-full border-2 ${
                              step.done
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'bg-white border-slate-300'
                            }`}
                          />
                          <p className={`text-[10px] text-center leading-snug ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                        </div>
                        {i < verificationSteps.length - 1 && (
                          <div
                            className={`h-px flex-1 mb-4 ${
                              verificationSteps[i + 1].done ? 'bg-emerald-400' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="lg:col-span-1 space-y-6">

            {/* CTA Laporan */}
            <div>
              <p
                className="text-sm font-medium text-slate-900 mb-1"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Punya bukti baru?
              </p>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Satu laporan dari kamu bisa melindungi ribuan orang.
              </p>
              <Link
                href="/report"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Buat laporan
              </Link>
            </div>

            <div className="border-t border-slate-100" />

            {/* Share */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">
                Sebarkan peringatan
              </p>
              <ShareButtons slug={slug} shareText={shareText} />
            </div>

            <div className="border-t border-slate-100" />

            {/* Tips keamanan */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">
                Tips keamanan
              </p>
              <ul className="space-y-3">
                {[
                  'Jangan pernah berikan kode OTP ke siapapun.',
                  'Gunakan rekening bersama / escrow resmi.',
                  'Verifikasi identitas sebelum transfer.',
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-500 leading-relaxed">
                    <span className="text-[10px] text-slate-300 shrink-0 mt-0.5 font-medium">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-100" />

            {/* Kontak darurat */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">
                Kontak darurat
              </p>
              <div className="space-y-3">
                {[
                  {
                    name: 'OJK',
                    desc: 'Otoritas Jasa Keuangan',
                    phone: '157',
                    url: 'https://konsumen.ojk.go.id',
                    urlLabel: 'konsumen.ojk.go.id',
                  },
                  {
                    name: 'Polisi Siber',
                    desc: 'Direktorat Siber Polri',
                    phone: '110',
                    url: 'https://patrolisiber.id',
                    urlLabel: 'patrolisiber.id',
                  },
                  {
                    name: 'BRTI',
                    desc: 'Badan Regulasi Telekomunikasi',
                    phone: null,
                    url: 'https://layanan.kominfo.go.id',
                    urlLabel: 'layanan.kominfo.go.id',
                  },
                ].map((contact) => (
                  <div key={contact.name} className="border border-slate-100 px-3 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-xs font-medium text-slate-800">{contact.name}</p>
                        <p className="text-[10px] text-slate-400">{contact.desc}</p>
                      </div>
                      {contact.phone && (
                        <span
                          className="text-xs font-medium text-slate-700 shrink-0"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {contact.phone}
                        </span>
                      )}
                    </div>
                    <a
                      href={contact.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      {contact.urlLabel}
                      <ExternalLink className="w-2.5 h-2.5" />
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