import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowLeft, ExternalLink,
  PlusCircle, AlertTriangle, Clock,
} from 'lucide-react';
import { formatDateID, formatNum, decodeSlug } from '@/lib/utils';
import ShareButtons from './ShareButtons';
import NumberCard from './components/NumberCard';
import ReportList from './components/ReportList';

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

const waspadaChecklist = [
  { text: 'Minta transfer atau DP duluan sebelum barang/jasa dikirim' },
  { text: 'Harga terlalu murah atau tidak masuk akal' },
  { text: 'Menekan untuk segera bayar / "stok terbatas"' },
  { text: 'Minta kode OTP, PIN, atau data pribadi' },
  { text: 'Menolak video call atau bertemu langsung untuk verifikasi' },
  { text: 'Rekening atas nama berbeda dengan identitas penjual' },
];

export default async function CheckPage({ params }: CheckPageProps) {
  const { slug } = await params;
  const realNumber = decodeSlug(slug);
  const checkedAt = new Date();

  if (!slug || slug.length > 50) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('target_number', realNumber)
    .order('created_at', { ascending: false });

  if (error) console.error('error fetching reports:', error);

  const reports = ((data as any[]) ?? []).filter((r) => r.status !== 'withdrawn'); // ✅ sembunyikan withdrawn dari publik
  const verifiedReports = reports.filter((r) => r.status === 'verified');
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const verifiedCount = verifiedReports.length;
  const totalLoss = reports.reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0);
  const hasOtherVictims = reports.some((r) => r.has_other_victims === 'yes');

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (verifiedCount > 0) status = 'danger';
  else if (pendingReports.length > 0) status = 'warning';

  const statusConfig = {
    danger: {
      barBg: 'bg-red-50', barLabel: 'text-red-800', barDesc: 'text-red-600',
      nameBadgeBg: 'bg-red-50', nameBadgeText: 'text-red-700', nameBadgeBorder: 'border-red-200',
      verdict: 'Terindikasi penipuan',
      verdictSub: `${verifiedCount} laporan telah diverifikasi oleh sistem & komunitas.`,
    },
    warning: {
      barBg: 'bg-amber-50', barLabel: 'text-amber-900', barDesc: 'text-amber-700',
      nameBadgeBg: 'bg-amber-50', nameBadgeText: 'text-amber-800', nameBadgeBorder: 'border-amber-200',
      verdict: 'Dalam investigasi',
      verdictSub: `${pendingReports.length} laporan masuk sedang diverifikasi moderator.`,
    },
    safe: {
      barBg: 'bg-emerald-50', barLabel: 'text-emerald-900', barDesc: 'text-emerald-700',
      nameBadgeBg: 'bg-emerald-50', nameBadgeText: 'text-emerald-800', nameBadgeBorder: 'border-emerald-200',
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Mobile subnav */}
      <div className="sm:hidden bg-white border-b border-slate-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/cek-nomor" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">KawalTransaksi</span>
        </div>
      </div>

      {/* Status bar */}
      <div className={`${config.barBg} px-4 sm:px-6 py-3`}>
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-semibold uppercase tracking-widest ${config.barLabel}`}>
            {config.verdict}
          </span>
          <span className={`text-xs ${config.barDesc}`}>— {config.verdictSub}</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" /> Dicek {formatTimestamp(checkedAt)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20">

        {/* Stats */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              { value: String(reports.length), label: 'Laporan masuk', valueClass: 'text-slate-900', bg: 'bg-white hover:bg-slate-50' },
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
              <div key={stat.label} className={`${stat.bg} rounded-lg border border-slate-200/80 shadow-sm p-4 sm:p-5 transition-colors`}>
                <p className={`text-3xl sm:text-4xl font-bold leading-none tabular-nums ${stat.valueClass}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.12em]">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">

            <NumberCard reports={reports} realNumber={realNumber} config={config} />

            {/* Checklist waspada */}
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
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
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

            <ReportList reports={reports} />

            {/* Apa yang harus dilakukan */}
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
                      <span className="text-[11px] text-slate-300 w-6 shrink-0 mt-0.5 font-bold tabular-nums">{item.step}</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 mb-1">{item.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status verifikasi */}
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
                          <div className={`absolute top-1.5 left-1/2 w-full h-[2px] z-0 ${verificationSteps[i + 1].done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        )}
                        <div className={`relative z-10 w-3 h-3 rounded-full border-2 transition-colors mb-2 ${step.done ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'bg-white border-slate-300'}`} />
                        <p className={`text-[10px] text-center leading-snug px-1 ${step.done ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1 space-y-4">

            <div className="bg-slate-900 rounded-lg p-5 shadow-sm">
              <p className="text-sm font-semibold text-white mb-1">Pernah kena tipu nomor ini?</p>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">Satu laporan dari kamu bisa melindungi ribuan orang.</p>
              <Link href="/report" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold rounded-lg transition-colors">
                <PlusCircle className="w-3.5 h-3.5" /> Buat laporan
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 font-medium">Sebarkan peringatan</p>
              <ShareButtons slug={slug} shareText={shareText} />
            </div>

            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 font-medium">Tips keamanan</p>
              <ul className="space-y-3">
                {['Jangan pernah berikan kode OTP ke siapapun.', 'Gunakan rekening bersama / escrow resmi.', 'Verifikasi identitas sebelum transfer.'].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-500 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 font-medium">Kontak darurat</p>
              <div>
                {[
                  { name: 'OJK', desc: 'Otoritas Jasa Keuangan', phone: '157', url: 'https://konsumen.ojk.go.id', urlLabel: 'konsumen.ojk.go.id' },
                  { name: 'Polisi Siber', desc: 'Direktorat Siber Polri', phone: '110', url: 'https://patrolisiber.id', urlLabel: 'patrolisiber.id' },
                  { name: 'BRTI', desc: 'Badan Regulasi Telekomunikasi', phone: null, url: 'https://layanan.kominfo.go.id', urlLabel: 'layanan.kominfo.go.id' },
                ].map((contact, i, arr) => (
                  <div key={contact.name} className={`py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{contact.name}</p>
                        <p className="text-[10px] text-slate-400">{contact.desc}</p>
                      </div>
                      {contact.phone && (
                        <span className="text-sm font-bold text-slate-700 shrink-0 tabular-nums">{contact.phone}</span>
                      )}
                    </div>
                    <a href={contact.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors font-medium">
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