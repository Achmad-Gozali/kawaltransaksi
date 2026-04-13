import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink, PlusCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatNum, decodeSlug } from '@/lib/utils';
import ShareButtons from './ShareButtons';
import NumberCard from './components/NumberCard';
import ReportList from './components/ReportList';

export const revalidate = 60;

interface CheckPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; bank?: string; wallet?: string }>;
}

export async function generateMetadata({ params }: CheckPageProps): Promise<Metadata> {
  const { slug } = await params;
  const realNumber = decodeSlug(slug);
  if (!realNumber) {
    return { title: 'Halaman tidak ditemukan - kawaltransaksi' };
  }
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
  'Minta transfer atau DP duluan sebelum barang/jasa dikirim',
  'Harga terlalu murah atau tidak masuk akal',
  'Menekan untuk segera bayar / "stok terbatas"',
  'Minta kode OTP, PIN, atau data pribadi',
  'Menolak video call atau bertemu langsung untuk verifikasi',
  'Rekening atas nama berbeda dengan identitas penjual',
];

const emergencyContacts = [
  { name: 'OJK', desc: 'Otoritas Jasa Keuangan', phone: '157', url: 'https://konsumen.ojk.go.id', urlLabel: 'konsumen.ojk.go.id' },
  { name: 'Polisi Siber', desc: 'Direktorat Siber Polri', phone: '110', url: 'https://patrolisiber.id', urlLabel: 'patrolisiber.id' },
  { name: 'BRTI', desc: 'Badan Regulasi Telekomunikasi', phone: null, url: 'https://layanan.kominfo.go.id', urlLabel: 'layanan.kominfo.go.id' },
];

// ── Verifikasi tambahan — sumber resmi eksternal ──────────────────────────────
const externalVerifications = [
  { name: 'BI CEKLIK', desc: 'Cek rekening di Bank Indonesia', url: 'https://ceklik.bi.go.id' },
  { name: 'CekRekening.id', desc: 'Database rekening penipu nasional', url: 'https://cekrekening.id' },
  { name: 'Lapor OJK', desc: 'Aduan resmi ke OJK', url: 'https://konsumen.ojk.go.id/MinisiteDPLK/Pengaduan' },
];

const dangerSteps = [
  { step: '01', title: 'Jangan transfer', desc: 'Batalkan segera rencana transfer ke nomor ini.' },
  { step: '02', title: 'Simpan semua bukti', desc: 'Screenshot semua percakapan dan detail transaksi sebagai barang bukti.' },
  { step: '03', title: 'Lapor ke platform', desc: 'Laporkan akun penipu ke platform tempat kamu berkomunikasi.' },
  { step: '04', title: 'Lapor ke KawalTransaksi', desc: 'Tambahkan laporanmu agar komunitas lain terlindungi.' },
];

const warningSteps = [
  { step: '01', title: 'Tunda transaksi', desc: 'Nomor ini sedang dalam investigasi. Tunda dulu transaksi sampai status jelas.' },
  { step: '02', title: 'Minta verifikasi identitas', desc: 'Minta pihak lawan untuk membuktikan identitas asli.' },
  { step: '03', title: 'Pantau perkembangan', desc: 'Cek kembali halaman ini dalam beberapa hari.' },
];

const bankNameMap: Record<string, string> = {
  bca: 'BCA', bri: 'BRI', bni: 'BNI', mandiri: 'Mandiri',
  cimb: 'CIMB Niaga', cimbniaga: 'CIMB Niaga',
  bsi: 'BSI', danamon: 'Danamon', permata: 'Permata',
  ocbcnisp: 'OCBC NISP', ocbc: 'OCBC NISP',
  panin: 'Panin', mega: 'Mega', btn: 'BTN',
  jago: 'Jago', seabank: 'SeaBank', lainnya: 'Bank Lainnya',
};

const walletNameMap: Record<string, string> = {
  gopay: 'GoPay', dana: 'DANA', ovo: 'OVO',
  shopeepay: 'ShopeePay', shopee: 'ShopeePay',
  linkaja: 'LinkAja', lainnya: 'E-Wallet Lainnya',
};

export default async function CheckPage({ params, searchParams }: CheckPageProps) {
  const { slug } = await params;
  const { type, bank, wallet } = await searchParams;

  if (!slug || slug.length > 50) notFound();

  const realNumber = decodeSlug(slug);
  if (!realNumber || !/^\d+$/.test(realNumber)) notFound();

  const defaultType = type === 'bank' ? 'bank_account' : type === 'ewallet' ? 'ewallet' : 'phone';
  const hasTypeParam = !!type; // true kalau ada ?type= di URL
  const defaultBankName = bank ? (bankNameMap[bank] ?? null) : null;
  const defaultWalletName = wallet ? (walletNameMap[wallet] ?? null) : null;

  const checkedAt = new Date();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('target_number', realNumber)
    .order('created_at', { ascending: false });

  if (error) console.error('error fetching reports:', error);

  const { data: linkedData } = await supabase
    .from('reports')
    .select('id, target_number, target_name, target_type, bank_name, status, created_at, target_numbers')
    .filter('target_numbers', 'cs', `[{"number":"${realNumber}"}]`)
    .neq('target_number', realNumber)
    .in('status', ['verified', 'pending'])
    .order('created_at', { ascending: false })
    .limit(5);

  const linkedReports = (linkedData as any[]) ?? [];
  const linkedHasVerified = linkedReports.some((r: any) => r.status === 'verified');

  const allReports = (data as any[]) ?? [];
  const reports = allReports.filter((r) => r.status !== 'withdrawn');
  const withdrawnReports = allReports.filter((r) => r.status === 'withdrawn');
  const hasWithdrawn = withdrawnReports.length > 0;

  const verifiedReports = reports.filter((r) => r.status === 'verified');
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const verifiedCount = verifiedReports.length;
  const totalLoss = reports.reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0);
  const hasOtherVictims = reports.some((r) => r.has_other_victims === 'yes');

  // ── Rule-based detection ──────────────────────────────────────────────────
  const nowMs = checkedAt.getTime();
  const thirtyDaysAgo = new Date(nowMs - 30 * 24 * 60 * 60 * 1000);
  const recentReports = reports.filter((r) => new Date(r.created_at) >= thirtyDaysAgo);
  const uniquePlatforms = Array.from(new Set(reports.map((r) => r.platform).filter(Boolean)));
  const multiVictimCount = reports.filter((r) => r.has_other_victims === 'yes').length;

  const riskBadges: { label: string; color: string }[] = [];
  if (recentReports.length >= 3) {
    riskBadges.push({ label: `Dilaporkan ${recentReports.length}x dalam 30 hari`, color: 'bg-red-50 text-red-700 border-red-200' });
  }
  if (totalLoss >= 10_000_000) {
    riskBadges.push({ label: `Kerugian besar — ${new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(totalLoss)}`, color: 'bg-orange-50 text-orange-700 border-orange-200' });
  }
  if (multiVictimCount >= 2) {
    riskBadges.push({ label: `${multiVictimCount} laporan sebut ada korban lain`, color: 'bg-amber-50 text-amber-700 border-amber-200' });
  }
  if (uniquePlatforms.length >= 2) {
    riskBadges.push({ label: `Aktif di ${uniquePlatforms.length} platform berbeda`, color: 'bg-slate-100 text-slate-600 border-slate-200' });
  }

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (verifiedCount > 0) status = 'danger';
  else if (pendingReports.length > 0) status = 'warning';
  else if (hasWithdrawn) status = 'warning';
  else if (linkedReports.length > 0) status = 'warning';

  const statusConfig = {
    danger: {
      barBg: 'bg-red-50 border-b border-red-100', barLabel: 'text-red-800', barDesc: 'text-red-600',
      dotBg: 'bg-red-500', nameBadgeBg: 'bg-red-50', nameBadgeText: 'text-red-700', nameBadgeBorder: 'border-red-200',
      verdict: 'Terindikasi penipuan',
      verdictSub: `${verifiedCount} laporan telah diverifikasi oleh sistem & komunitas.`,
    },
    warning: {
      barBg: linkedHasVerified ? 'bg-red-50 border-b border-red-100' : 'bg-amber-50 border-b border-amber-100',
      barLabel: linkedHasVerified ? 'text-red-800' : 'text-amber-900',
      barDesc: linkedHasVerified ? 'text-red-600' : 'text-amber-700',
      dotBg: linkedHasVerified ? 'bg-red-500' : 'bg-amber-500',
      nameBadgeBg: linkedHasVerified ? 'bg-red-50' : 'bg-amber-50',
      nameBadgeText: linkedHasVerified ? 'text-red-800' : 'text-amber-800',
      nameBadgeBorder: linkedHasVerified ? 'border-red-200' : 'border-amber-200',
      verdict: hasWithdrawn && pendingReports.length === 0 && verifiedCount === 0
        ? 'Ada riwayat laporan'
        : linkedHasVerified
        ? 'Terkait pelaku terverifikasi'
        : 'Dalam investigasi',
      verdictSub: hasWithdrawn && pendingReports.length === 0 && verifiedCount === 0
        ? 'Laporan untuk nomor ini sedang dalam proses revisi oleh pelapor.'
        : linkedHasVerified
        ? 'Nomor ini terbukti terkait pelaku yang sudah diverifikasi. Hindari bertransaksi.'
        : `${pendingReports.length} laporan masuk sedang diverifikasi moderator.`,
    },
    safe: {
      barBg: 'bg-emerald-50 border-b border-emerald-100', barLabel: 'text-emerald-900', barDesc: 'text-emerald-700',
      dotBg: 'bg-emerald-500', nameBadgeBg: 'bg-emerald-50', nameBadgeText: 'text-emerald-800', nameBadgeBorder: 'border-emerald-200',
      verdict: 'Tidak ada laporan', verdictSub: 'Nomor ini bersih di database kami. Tetap waspada.',
    },
  };

  const config = statusConfig[status];

  const shareText = status === 'danger'
    ? `⚠️ waspada! nomor ${formatNum(realNumber)} terindikasi penipu dengan ${verifiedCount} laporan terverifikasi. cek di kawaltransaksi:`
    : status === 'warning'
      ? `⚠️ nomor ${formatNum(realNumber)} sedang dalam proses verifikasi laporan penipuan. cek di kawaltransaksi:`
      : `✅ nomor ${formatNum(realNumber)} aman — belum ada laporan penipuan di kawaltransaksi:`;

  const verificationSteps = linkedHasVerified && reports.length > 0 && verifiedCount === 0
    ? [
        { label: 'Nomor ditemukan', done: true },
        { label: 'Terkait laporan terverifikasi', done: true },
        { label: 'Laporan langsung menunggu review', done: false },
      ]
    : linkedHasVerified && reports.length === 0
    ? [
        { label: 'Nomor ditemukan', done: true },
        { label: 'Terkait laporan terverifikasi', done: true },
        { label: 'Belum ada laporan langsung', done: false },
      ]
    : [
        { label: 'Laporan diterima', done: allReports.length > 0 },
        { label: 'Dalam review moderator', done: status === 'warning' || status === 'danger' },
        { label: 'Terverifikasi', done: status === 'danger' },
      ];

  const actionSteps = status === 'danger' || linkedHasVerified ? dangerSteps : warningSteps;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="sm:hidden bg-white border-b border-slate-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/cek-nomor" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">KawalTransaksi</span>
        </div>
      </div>

      <div className={`${config.barBg} px-4 sm:px-6 py-3`}>
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <div className={`w-2 h-2 rounded-full shrink-0 ${config.dotBg}`} />
          <span className={`text-xs font-semibold uppercase tracking-widest ${config.barLabel}`}>{config.verdict}</span>
          <span className={`text-xs ${config.barDesc}`}>— {config.verdictSub}</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" /> Dicek {formatTimestamp(checkedAt)}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20">
        {reports.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-5">
              <p className="text-2xl sm:text-4xl font-medium leading-none text-slate-900 tabular-nums">{reports.length}</p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.12em]">Laporan masuk</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-5">
              <p className={`text-2xl sm:text-4xl font-medium leading-none tabular-nums ${totalLoss > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                {totalLoss > 0 ? new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(totalLoss) : '—'}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.12em]">Total kerugian</p>
            </div>
            <div className={`rounded-lg border p-3 sm:p-5 ${hasOtherVictims ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
              <p className={`text-2xl sm:text-4xl font-medium leading-none ${hasOtherVictims ? 'text-amber-500' : 'text-slate-300'}`}>
                {hasOtherVictims ? '!' : '—'}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.12em]">Multi korban</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-5">
            <NumberCard
              reports={reports}
              realNumber={realNumber}
              config={config}
              defaultType={defaultType}
              defaultBankName={defaultBankName}
              defaultWalletName={defaultWalletName}
              hasTypeParam={hasTypeParam}
            />

            {/* ── Rule-based risk badges ── */}
            {riskBadges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {riskBadges.map((badge, i) => (
                  <span key={i} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${badge.color}`}>
                    {badge.label}
                  </span>
                ))}
              </div>
            )}

            {/* ── BANNER: Nomor terkait laporan lain ── */}
            {linkedReports.length > 0 && reports.length === 0 && (
              <div className={`rounded-lg overflow-hidden border ${linkedHasVerified ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className={`px-5 py-4 flex items-start gap-3 border-b ${linkedHasVerified ? 'border-red-100' : 'border-amber-100'}`}>
                  <div>
                    <p className={`text-xs leading-relaxed ${linkedHasVerified ? 'text-red-700' : 'text-amber-700'}`}>
                      {linkedHasVerified
                        ? 'Nomor ini disebutkan dalam laporan yang telah diverifikasi. Berdasarkan bukti yang ada, pelaku diketahui menggunakan beberapa nomor secara bergantian. Kami menyarankan untuk tidak melanjutkan transaksi.'
                        : 'Meski belum ada laporan langsung untuk nomor ini, nomor ini disebutkan sebagai nomor milik pelaku yang sudah dilaporkan. Pelaku yang sama diduga menggunakan beberapa nomor berbeda.'}
                    </p>
                  </div>
                </div>
                <div className={`divide-y ${linkedHasVerified ? 'divide-red-100' : 'divide-amber-100'}`}>
                  {linkedReports.map((r: any, i: number) => (
                    <a key={i} href={`/check/${r.target_number}`}
                      className={`flex items-center justify-between px-5 py-3.5 transition-colors group ${linkedHasVerified ? 'hover:bg-red-100/40' : 'hover:bg-amber-100/40'}`}>
                      <div>
                        <p className={`text-sm font-mono font-semibold tracking-wide ${linkedHasVerified ? 'text-red-900' : 'text-amber-900'}`}>
                          {r.target_number.replace(/(\d{4})(?=\d)/g, '$1 ')}
                        </p>
                        <p className={`text-xs mt-0.5 ${linkedHasVerified ? 'text-red-600' : 'text-amber-600'}`}>
                          {r.status === 'verified' ? 'Laporan terverifikasi' : 'Laporan dalam investigasi'}
                          {r.target_name ? ` · a.n. ${r.target_name}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${linkedHasVerified ? 'text-red-600 group-hover:text-red-800' : 'text-amber-700 group-hover:text-amber-900'}`}>
                        Lihat laporan →
                      </span>
                    </a>
                  ))}
                </div>
                <div className={`px-5 py-3 ${linkedHasVerified ? 'bg-red-100/30' : 'bg-amber-100/30'}`}>
                  <p className={`text-xs ${linkedHasVerified ? 'text-red-600' : 'text-amber-600'}`}>
                    {linkedHasVerified
                      ? 'Perhatian : Pelaku diketahui menggunakan beberapa nomor secara bergantian untuk menghindari deteksi sistem.'
                      : 'Waspada! Penipu sering berganti nomor untuk menghindari deteksi.'}
                  </p>
                </div>
              </div>
            )}

            {status === 'safe' && linkedReports.length === 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">Tetap waspada</p>
                <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-amber-100 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <p className="text-xs font-medium text-amber-800">Meski belum ada laporan, waspada jika nomor ini...</p>
                  </div>
                  <ul className="divide-y divide-amber-100">
                    {waspadaChecklist.map((item, i) => (
                      <li key={i} className="px-4 py-3 hover:bg-amber-100/40 transition-colors">
                        <p className="text-xs text-amber-900 leading-relaxed">{item}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-3 border-t border-amber-100 bg-amber-100/30">
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Penipu bisa pakai nomor baru yang belum terdata. Jika ragu,{' '}
                      <Link href="/report" className="font-semibold underline underline-offset-2 hover:text-amber-900">laporkan sekarang</Link>{' '}
                      untuk melindungi orang lain.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ReportList
              reports={reports}
              hasWithdrawn={hasWithdrawn}
              hasLinkedReports={linkedReports.length > 0 && reports.length === 0}
              linkedHasVerified={linkedHasVerified}
            />

            {/* Nomor lain terkait pelaku ini */}
            {(() => {
              // Kumpulkan semua nomor terkait dari JSONB target_numbers
              // Format baru: [{ number, type, bank }]
              // Format lama: string (fallback)
              const relatedEntries: { number: string; type: string; bank: string | null; name: string | null }[] = [];
              const seenNumbers = new Set<string>();

              allReports.forEach((r: any) => {
                if (!Array.isArray(r.target_numbers)) return;
                r.target_numbers.forEach((item: any) => {
                  if (typeof item === 'object' && item !== null && item.number) {
                    if (item.number !== realNumber && !seenNumbers.has(item.number)) {
                      seenNumbers.add(item.number);
                      relatedEntries.push({
                        number: item.number,
                        type: item.type ?? 'phone',
                        bank: item.bank ?? null,
                        name: item.name ?? null,
                      });
                    }
                  } else if (typeof item === 'string' && item !== realNumber && !seenNumbers.has(item)) {
                    seenNumbers.add(item);
                    relatedEntries.push({ number: item, type: 'phone', bank: null, name: null });
                  }
                });
              });

              if (relatedEntries.length === 0) return null;

              // Bangun typeParam per nomor berdasarkan tipenya masing-masing
              const buildTypeParam = (type: string, bank: string | null) => {
                if (type === 'bank_account') {
                  const bankKey = bank ? bank.toLowerCase().replace(/\s/g, '').replace(/[^a-z]/g, '') : '';
                  return `?type=bank${bankKey ? `&bank=${bankKey}` : ''}`;
                }
                if (type === 'ewallet') {
                  const walletKey = bank ? bank.toLowerCase().replace(/\s/g, '').replace(/[^a-z]/g, '') : '';
                  return `?type=ewallet${walletKey ? `&wallet=${walletKey}` : ''}`;
                }
                return '?type=phone';
              };

              const typeLabel: Record<string, string> = {
                phone: 'Nomor HP',
                bank_account: 'Rekening Bank',
                ewallet: 'E-Wallet',
              };

              return (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">
                    Nomor lain terkait pelaku ini
                  </p>
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Pelapor menyebutkan bahwa pelaku yang sama juga menggunakan nomor-nomor berikut.
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {relatedEntries.map((entry, i) => (
                        <a key={i} href={`/check/${entry.number}${buildTypeParam(entry.type, entry.bank)}`}
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group">
                          <div>
                            <span className="text-sm font-mono font-semibold text-slate-700 tracking-wide">
                              {entry.number.replace(/(\d{4})(?=\d)/g, '$1 ')}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {[
                                entry.bank ? entry.bank : typeLabel[entry.type] ?? 'Nomor HP',
                                entry.name ? `a.n. ${entry.name}` : null,
                              ].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          <span className="text-xs text-emerald-600 font-semibold group-hover:underline">
                            Cek →
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {status !== 'safe' && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">Apa yang harus kamu lakukan?</p>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {actionSteps.map((item) => (
                    <div key={item.step} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                      <span className="text-[11px] text-slate-300 w-6 shrink-0 mt-0.5 font-medium tabular-nums">{item.step}</span>
                      <div>
                        <p className="text-xs font-medium text-slate-800 mb-1">{item.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(allReports.length > 0 || linkedHasVerified) && !(hasWithdrawn && reports.length === 0) && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5 font-medium px-0.5">Status verifikasi</p>
                <div className="bg-white rounded-lg border border-slate-200 px-6 py-5">
                  <div className="flex relative">
                    {verificationSteps.map((step, i) => (
                      <div key={i} className="relative flex flex-col items-center flex-1">
                        {i < verificationSteps.length - 1 && (
                          <div className={`absolute top-1.5 left-1/2 w-full h-[2px] z-0 ${verificationSteps[i + 1].done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        )}
                        <div className={`relative z-10 w-3 h-3 rounded-full border-2 transition-colors mb-2 ${step.done ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`} />
                        <p className={`text-[10px] text-center leading-snug px-1 ${step.done ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{step.label}</p>
                      </div>
                    ))}
                  </div>
                  {linkedHasVerified && verifiedCount === 0 && (
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-4 pt-3 border-t border-slate-100">
                      {reports.length > 0
                        ? 'Laporan di nomor ini sedang direview moderator. Namun nomor ini sudah terbukti terkait pelaku yang telah diverifikasi — tetap waspada.'
                        : 'Belum ada laporan langsung di nomor ini. Namun nomor ini sudah terbukti terkait pelaku yang telah diverifikasi — hindari bertransaksi.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── SIDEBAR KANAN ── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 rounded-lg p-4 sm:p-5">
              <p className="text-sm font-medium text-white mb-1.5">Pernah kena tipu nomor ini?</p>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">Satu laporan dari kamu bisa melindungi ribuan orang.</p>
              <Link href="/report" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-medium rounded-lg transition-colors">
                <PlusCircle className="w-3.5 h-3.5" /> Buat laporan
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 font-medium">Sebarkan peringatan</p>
              <ShareButtons slug={slug} shareText={shareText} />
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 font-medium">Tips keamanan</p>
              <ul className="space-y-3">
                {['Jangan pernah berikan kode OTP ke siapapun.', 'Gunakan rekening bersama / escrow resmi.', 'Verifikasi identitas sebelum transfer.'].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-500 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Verifikasi tambahan — sumber resmi ── */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-1 font-medium">Verifikasi tambahan</p>
              <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Cek juga di sumber resmi berikut untuk informasi lebih lengkap.</p>
              <div className="space-y-2">
                {externalVerifications.map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            </div>

            {/* ── Kontak darurat ── */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 font-medium">Kontak darurat</p>
              <div>
                {emergencyContacts.map((contact, i) => (
                  <div key={contact.name} className={`py-3 hover:bg-slate-50 -mx-1 px-1 sm:-mx-2 sm:px-2 rounded-lg transition-colors ${i < emergencyContacts.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="text-xs font-medium text-slate-800">{contact.name}</p>
                        <p className="text-[10px] text-slate-400">{contact.desc}</p>
                      </div>
                      {contact.phone && <span className="text-sm font-medium text-slate-700 shrink-0 tabular-nums">{contact.phone}</span>}
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