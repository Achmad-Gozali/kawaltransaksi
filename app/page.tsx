import Link from 'next/link';
import Image from 'next/image';
import {
  Phone, Building2, Wallet, ArrowUpRight,
} from 'lucide-react';
import * as motion from 'motion/react-client';
import { createClient } from '@/lib/supabase-server';
import { formatDateID, encodeSlug } from '@/lib/utils'; // ✅ Added encodeSlug

export const revalidate = 60;

// ── LOGIC MAPPING (Sinkron dengan Database Page) ────────────────────────────
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
    return {
      icon: Wallet,
      label: bankName ?? 'E-Wallet',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
    };
  }
  if (type === 'bank_account') {
    return {
      icon: Building2,
      label: bankName ?? 'Rekening Bank',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    };
  }
  return {
    icon: Phone,
    label: 'Nomor HP',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  };
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data: rawRecentReports } = await supabase
    .from('reports')
    .select('id, target_number, target_name, target_type, bank_name, category, created_at, status')
    .order('created_at', { ascending: false })
    .limit(6);

  const recentReports = rawRecentReports ?? [];

  return (
    <main className="bg-white text-slate-900 font-sans overflow-x-hidden">

      {/* ── 1. HERO ── */}
      <section className="relative min-h-[600px] flex items-stretch overflow-hidden bg-white">
        <div className="relative z-10 flex flex-col justify-center px-6 sm:px-12 md:pl-20 md:pr-8 lg:pl-28 lg:pr-10 py-16 md:py-20 w-full md:w-[52%]">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] uppercase mb-6">
            Transaksi{' '}
            <span className="text-emerald-600 italic">Aman,</span>
            <br />
            Hati Tenang
          </h1>

          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-sm mb-8">
            Verifikasi nomor HP atau rekening bank dalam hitungan detik.
            Bersama komunitas, kita hentikan penipuan digital.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/cek-nomor"
              className="px-6 py-3.5 bg-slate-900 text-white font-bold text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              cek nomor hp
            </Link>
            <Link
              href="/cek-rekening"
              className="px-6 py-3.5 border-2 border-slate-200 text-slate-900 font-bold text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 hover:border-slate-900 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              cek rekening
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

      <svg
        viewBox="0 0 1440 70"
        preserveAspectRatio="none"
        className="w-full block -mt-1 bg-white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,0 C240,60 480,20 720,45 C960,70 1200,30 1440,50 L1440,70 L0,70 Z"
          fill="#f8fafc"
        />
      </svg>

      {/* ── 2. LAPORAN MASUK TERKINI ── */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase">
              laporan masuk terkini
            </h2>
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
                    // ✅ FIX: Masking nomor dengan encodeSlug
                    href={`/check/${encodeSlug(report.target_number)}`}
                    className="block bg-white border border-slate-200 p-5 rounded-lg hover:border-slate-300 hover:shadow-md transition-all group h-full"
                  >
                    <div className="flex justify-between items-start mb-5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                          report.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {report.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDateID(report.created_at)}
                      </span>
                    </div>

                    <div className="mb-5">
                      <p className="text-lg font-black tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors font-mono">
                        {report.target_number}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                        a.n. {report.target_name || 'anonymous'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {/* Badge Berwarna (8px juga) */}
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${meta.bg} ${meta.color} ${meta.border}`}>
                          {logoSrc ? (
                            <Image
                              src={logoSrc}
                              alt={meta.label}
                              width={14}
                              height={14}
                              className="object-contain rounded-sm"
                            />
                          ) : (
                            <meta.icon className="w-3 h-3" />
                          )}
                          <span className="truncate max-w-[80px]">{meta.label}</span>
                        </span>
                        
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                          {report.category}
                        </span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full block bg-slate-50 -mb-1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,80 C360,20 720,65 1080,25 C1260,5 1380,45 1440,30 L1440,80 Z"
          fill="#ffffff"
        />
      </svg>

      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-20 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase text-slate-900 mb-4">
            berikan kontribusi anda.
          </h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mb-10 leading-relaxed">
            jangan biarkan pelaku mencari korban berikutnya. laporkan nomor mencurigakan untuk ekosistem digital yang lebih aman.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/report"
              className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 text-white font-bold text-sm tracking-widest uppercase rounded-xl hover:bg-emerald-500 transition-colors"
            >
              entri laporan baru
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 border-2 border-slate-200 text-slate-900 font-bold text-sm tracking-widest uppercase rounded-xl hover:border-slate-900 transition-colors"
            >
              gabung komunitas
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}