import Link from 'next/link';
import Image from 'next/image';
import { Phone, Landmark, Wallet, ArrowRight } from 'lucide-react';
import * as motion from 'motion/react-client';
import { formatDateID, encodeSlug } from '@/lib/utils';

export const revalidate = 60;

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ewalletNames = ['gopay', 'dana', 'ovo', 'shopeepay', 'linkaja'];

const bankLogoMap: Record<string, string> = {
  bca: '/banks/bca.png',
  bni: '/banks/bni.png',
  bri: '/banks/bri.png',
  bsi: '/banks/bsi.png',
  cimb: '/banks/cimb.png',
  mandiri: '/banks/mandiri.png',
};

const ewalletLogoMap: Record<string, string> = {
  gopay: '/ewallets/gopay.png',
  dana: '/ewallets/dana.png',
  ovo: '/ewallets/ovo.png',
  shopeepay: '/ewallets/shopeepay.png',
  linkaja: '/ewallets/linkaja.png',
};

const HOW_IT_WORKS = [
  {
    number: '#1',
    title: 'Komunitas Melapor',
    desc: 'Laporan nomor HP, rekening, atau e-wallet mencurigakan dikumpulkan dari komunitas pengguna beserta bukti digital.',
  },
  {
    number: '#2',
    title: 'Data Terkumpul',
    desc: 'Ratusan laporan masuk dan disimpan ke database terpusat setiap harinya untuk diproses lebih lanjut.',
  },
  {
    number: '#3',
    title: 'Verifikasi AI & Moderator',
    desc: 'Setiap laporan dianalisis oleh sistem AI dan ditinjau moderator sebelum dipublikasikan ke database.',
  },
  {
    number: '#4',
    title: 'Hasil Tersedia Real-time',
    desc: 'Data terverifikasi langsung bisa dicek seluruh pengguna secara gratis dan real-time.',
  },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getPlatformLogo(type: string, bankName: string | null): string | null {
  if (!bankName) return null;
  const key = bankName.toLowerCase();
  if (type === 'ewallet' || ewalletNames.includes(key)) return ewalletLogoMap[key] ?? null;
  if (type === 'bank_account') return bankLogoMap[key] ?? null;
  return null;
}

function getTargetMeta(type: string, bankName: string | null) {
  const key = bankName?.toLowerCase() || '';
  if (type === 'ewallet' || (type === 'phone' && ewalletNames.includes(key))) {
    return { icon: Wallet, label: bankName ?? 'E-Wallet', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' };
  }
  if (type === 'bank_account') {
    return { icon: Landmark, label: bankName ?? 'Rekening Bank', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  }
  return { icon: Phone, label: 'Nomor HP', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
}

function formatLoss(amount: number): string {
  if (amount === 0) return 'Rp0';
  if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)} M+`;
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)} Jt+`;
  if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)} Rb+`;
  return `Rp${amount.toLocaleString('id-ID')}`;
}

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface ReportItem {
  id: string;
  target_number: string;
  target_name: string | null;
  target_type: string;
  bank_name: string | null;
  category: string;
  created_at: string;
  status: string;
}

interface Stats {
  total: number;
  verified: number;
  totalLoss: number;
}

// ── DATA FETCHING ─────────────────────────────────────────────────────────────
async function getRecentReports(): Promise<ReportItem[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const res = await fetch(
      `${supabaseUrl}/rest/v1/reports?select=id,target_number,target_name,target_type,bank_name,category,created_at,status&order=created_at.desc&limit=6`,
      {
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getStats(): Promise<Stats> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const headers = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Prefer': 'count=exact',
    };

    const [totalRes, verifiedRes, lossRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/reports?select=id&status=in.(verified,pending)`, { headers, next: { revalidate: 60 } }),
      fetch(`${supabaseUrl}/rest/v1/reports?select=id&status=eq.verified`, { headers, next: { revalidate: 60 } }),
      fetch(`${supabaseUrl}/rest/v1/reports?select=loss_amount&status=eq.verified`, { headers, next: { revalidate: 60 } }),
    ]);

    const totalData = totalRes.ok ? await totalRes.json() : [];
    const verifiedData = verifiedRes.ok ? await verifiedRes.json() : [];
    const lossData = lossRes.ok ? await lossRes.json() : [];

    const totalLoss = lossData.reduce((sum: number, r: { loss_amount: string | null }) =>
      sum + (Number(r.loss_amount) || 0), 0);

    return { total: totalData.length, verified: verifiedData.length, totalLoss };
  } catch {
    return { total: 0, verified: 0, totalLoss: 0 };
  }
}

// ── CARA KERJA STEPS ─────────────────────────────────────────────────────────
function HowItWorksSteps() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
      {HOW_IT_WORKS.map((item, i) => (
        <div key={i} className={`${i > 0 ? 'lg:pl-8 lg:border-l border-slate-200' : ''}`}>
          <p className="text-3xl font-black text-emerald-500 mb-2 leading-none">{item.number}</p>
          <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-snug mb-2">{item.title}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const [recentReports, stats] = await Promise.all([getRecentReports(), getStats()]);

  return (
    <main className="bg-white text-slate-900 font-sans overflow-x-hidden">

      {/* ── 1. HERO ── */}
      <section className="relative min-h-[500px] sm:min-h-[600px] flex items-stretch overflow-hidden bg-white">
        <div className="relative z-10 flex flex-col justify-center px-5 sm:px-12 md:pl-20 lg:pl-28 py-14 md:py-20 w-full md:w-[52%]">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] uppercase mb-5 sm:mb-6">
            Transaksi{' '}
            <span className="text-emerald-600 italic">Aman,</span>
            <br />
            Hati Tenang
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-sm mb-7 sm:mb-8">
            Verifikasi nomor HP atau rekening bank dalam hitungan detik.
            Bersama komunitas, kita hentikan penipuan digital.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/cek-nomor"
              className="px-5 sm:px-6 py-3 sm:py-3.5 bg-slate-900 text-white font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
            >
              <Phone className="w-4 h-4" /> cek nomor hp
            </Link>
            <Link
              href="/cek-rekening"
              className="px-5 sm:px-6 py-3 sm:py-3.5 border-2 border-slate-200 text-slate-900 font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 hover:border-slate-900 transition-colors"
            >
              <Landmark className="w-4 h-4" /> cek rekening
            </Link>
          </div>
        </div>

        <div className="hidden md:flex relative w-[48%] items-center justify-start bg-white overflow-hidden pl-4">
          <div className="relative w-[460px] h-[460px]">
            <Image
              src="/poster1.png"
              alt="Ilustrasi keamanan transaksi digital"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── WAVE + FLOATING STATS CARD ── */}
      {/* Desktop: floating card overlap wave */}
      <div className="relative bg-white hidden sm:block">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="w-full block" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 C240,80 480,30 720,60 C960,90 1200,40 1440,65 L1440,100 L0,100 Z" fill="#f8fafc" />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 sm:px-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100 grid grid-cols-3 divide-x divide-slate-100 overflow-hidden"
          >
            <div className="px-5 py-5 sm:px-8 sm:py-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total laporan</p>
              <p className="text-2xl sm:text-4xl font-black text-slate-900 leading-none tabular-nums">{stats.total}+</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Dari seluruh Indonesia</p>
            </div>
            <div className="px-5 py-5 sm:px-8 sm:py-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Terverifikasi</p>
              <p className="text-2xl sm:text-4xl font-black text-emerald-600 leading-none tabular-nums">{stats.verified}+</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Dikonfirmasi moderator</p>
            </div>
            <div className="px-5 py-5 sm:px-8 sm:py-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total kerugian</p>
              <p className="text-2xl sm:text-4xl font-black text-red-500 leading-none tabular-nums">{formatLoss(stats.totalLoss)}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Dilaporkan komunitas</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile: stats card inline (tidak floating) */}
      <div className="sm:hidden bg-white px-4 pb-6">
        <svg viewBox="0 0 1440 50" preserveAspectRatio="none" className="w-full block" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 C240,40 480,10 720,30 C960,50 1200,20 1440,35 L1440,50 L0,50 Z" fill="#f8fafc" />
        </svg>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm grid grid-cols-3 divide-x divide-slate-100 overflow-hidden"
        >
          <div className="px-3 py-4 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Laporan</p>
            <p className="text-xl font-black text-slate-900 leading-none tabular-nums">{stats.total}+</p>
          </div>
          <div className="px-3 py-4 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Verified</p>
            <p className="text-xl font-black text-emerald-600 leading-none tabular-nums">{stats.verified}+</p>
          </div>
          <div className="px-3 py-4 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kerugian</p>
            <p className="text-xl font-black text-red-500 leading-none tabular-nums">{formatLoss(stats.totalLoss)}</p>
          </div>
        </motion.div>
      </div>

      {/* ── 2. APA ITU KAWALTRANSAKSI — slate-50 ── */}
      <section className="bg-slate-50 pt-10 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Tentang Platform</p>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-slate-900 mb-4 sm:mb-5">
            Apa itu KawalTransaksi?
          </h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
            KawalTransaksi adalah platform komunitas anti-penipuan digital Indonesia. Kami membantu kamu memverifikasi nomor HP, rekening bank, dan e-wallet sebelum bertransaksi. gratis, cepat, dan didukung laporan nyata dari komunitas.
          </p>
        </div>
      </section>

      {/* Wave: slate-50 → putih */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full block bg-slate-50 -mb-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C360,20 720,65 1080,25 C1260,5 1380,45 1440,30 L1440,80 Z" fill="#ffffff" />
      </svg>

      {/* ── 3. CARA KERJA — putih ── */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-slate-900">
              Bagaimana KawalTransaksi Bekerja?
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Berikut ilustrasi bagaimana KawalTransaksi mengidentifikasi penipuan.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <HowItWorksSteps />
          </motion.div>
        </div>
      </section>

      {/* Wave: putih → slate-50 */}
      <svg viewBox="0 0 1440 70" preserveAspectRatio="none" className="w-full block bg-white -mb-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 C240,60 480,20 720,45 C960,70 1200,30 1440,50 L1440,70 L0,70 Z" fill="#f8fafc" />
      </svg>

      {/* ── 4. LAPORAN MASUK TERKINI — slate-50 ── */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-2xl font-black tracking-tighter uppercase">laporan masuk terkini</h2>
            <Link
              href="/database"
              className="text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-emerald-600 transition-colors whitespace-nowrap"
            >
              lihat semua →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentReports.map((report, i) => {
              const meta = getTargetMeta(report.target_type, report.bank_name);
              const logoSrc = getPlatformLogo(report.target_type, report.bank_name);

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    href={`/check/${encodeSlug(report.target_number)}`}
                    className="block bg-white border border-slate-200 p-4 sm:p-5 rounded-lg hover:border-slate-300 hover:shadow-md transition-all group h-full"
                  >
                    <div className="flex justify-between items-start mb-4 sm:mb-5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                        report.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : report.status === 'withdrawn'
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {report.status === 'verified' ? 'Terverifikasi' : report.status === 'withdrawn' ? 'Sedang Direvisi' : 'Menunggu'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{formatDateID(report.created_at)}</span>
                    </div>

                    <div className="mb-4 sm:mb-5">
                      <p className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors font-mono">
                        {report.target_number}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                        a.n. {report.target_name || 'anonymous'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${meta.bg} ${meta.color} ${meta.border}`}>
                          {logoSrc ? (
                            <Image src={logoSrc} alt={meta.label} width={14} height={14} className="object-contain rounded-sm" />
                          ) : (
                            <meta.icon className="w-3 h-3" />
                          )}
                          <span className="truncate max-w-[70px] sm:max-w-[80px]">{meta.label}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                          {report.category}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Wave: slate-50 → putih */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full block bg-slate-50 -mb-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C360,20 720,65 1080,25 C1260,5 1380,45 1440,30 L1440,80 Z" fill="#ffffff" />
      </svg>

      {/* ── 5. CTA — putih ── */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase text-slate-900 mb-4">
            berikan kontribusi anda.
          </h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed">
            jangan biarkan pelaku mencari korban berikutnya. laporkan nomor mencurigakan
            untuk ekosistem digital yang lebih aman.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/report"
              className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-emerald-600 text-white font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl hover:bg-emerald-500 transition-colors"
            >
              entri laporan baru
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 border-2 border-slate-200 text-slate-900 font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl hover:border-slate-900 transition-colors"
            >
              gabung komunitas
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}