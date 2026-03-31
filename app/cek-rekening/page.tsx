import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck, CheckCircle2, ArrowUpRight,
  ShieldAlert, PlusCircle, AlertTriangle,
  TrendingUp, Building2, Clock, Check
} from 'lucide-react';
import type { Metadata } from 'next';
import RekeningSearchForm from '@/components/RekeningSearchForm';
import { formatDateID, maskNumber } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Cek Rekening - KawalTransaksi',
  description: 'Verifikasi keamanan nomor rekening bank secara real-time.',
};

export const revalidate = 60;

const banks = [
  {
    id: 'bca',
    name: 'Bank Central Asia',
    shortName: 'BCA',
    logo: '/banks/bca.png',
    description: 'Verifikasi rekening BCA dan identifikasi potensi penipuan sebelum transfer.',
  },
  {
    id: 'bri',
    name: 'Bank Rakyat Indonesia',
    shortName: 'BRI',
    logo: '/banks/bri.png',
    description: 'Verifikasi rekening BRI dan identifikasi potensi penipuan sebelum transfer.',
  },
  {
    id: 'bni',
    name: 'Bank Negara Indonesia',
    shortName: 'BNI',
    logo: '/banks/bni.png',
    description: 'Verifikasi rekening BNI dan identifikasi potensi penipuan sebelum transfer.',
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    shortName: 'Mandiri',
    logo: '/banks/mandiri.png',
    description: 'Verifikasi rekening Mandiri dan identifikasi potensi penipuan sebelum transfer.',
  },
  {
    id: 'cimb',
    name: 'Bank CIMB Niaga',
    shortName: 'CIMB Niaga',
    logo: '/banks/cimb.png',
    description: 'Verifikasi rekening CIMB Niaga dan identifikasi potensi penipuan sebelum transfer.',
  },
  {
    id: 'bsi',
    name: 'Bank Syariah Indonesia',
    shortName: 'BSI',
    logo: '/banks/bsi.png',
    description: 'Verifikasi rekening BSI dan identifikasi potensi penipuan sebelum transfer.',
  },
];

export default async function CekRekeningPage() {
  const supabase = await createClient();

  const [
    { data: rawReports },
    { count: totalCount },
    { count: verifiedCount },
  ] = await Promise.all([
    supabase
      .from('reports')
      .select('target_number, target_name, category, created_at, status, bank_name')
      .eq('target_type', 'bank_account')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('target_type', 'bank_account'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('target_type', 'bank_account').eq('status', 'verified'),
  ]);

  const recentReports = rawReports ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      
      {/* SECTION 1: HERO */}
      <section className="relative pt-16 sm:pt-24 pb-14 sm:pb-20 overflow-hidden text-center border-b border-slate-200 bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[300px] sm:h-[400px] bg-emerald-100/30 rounded-full blur-[100px] -z-10" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-4 sm:mb-6 leading-tight uppercase">
            Cek Rekening Bank. <br />
            <span className="text-emerald-600 italic">Amankan Transaksi.</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mb-8 sm:mb-12 max-w-xl mx-auto font-medium leading-relaxed">
            Verifikasi kredibilitas nomor rekening tujuan sebelum melakukan transfer dana. Hindari risiko penipuan finansial dalam satu klik.
          </p>
          <RekeningSearchForm />
        </div>
      </section>

      {/* SECTION 2: BENTO DASHBOARD */}
      <section className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-5 mb-16 sm:mb-24 pt-12">
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 hidden sm:block">
            <TrendingUp className="w-40 h-40 text-slate-900" />
          </div>
          <div className="relative z-10">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 sm:mb-4">Ringkasan Data Finansial</h3>
            <p className="text-xl sm:text-3xl font-black text-slate-900 leading-tight max-w-md">
              Membantu melindungi jutaan <span className="text-emerald-600 underline decoration-emerald-200 decoration-4 underline-offset-4">transaksi publik.</span>
            </p>
          </div>
          <div className="flex gap-8 sm:gap-12 mt-10 relative z-10">
            <div>
              <p className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter">{totalCount || 0}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Total Entri Data</p>
            </div>
            <div className="w-px h-12 sm:h-16 bg-slate-200" />
            <div>
              <p className="text-3xl sm:text-5xl font-black text-red-600 tracking-tighter">{verifiedCount || 0}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Verified Scam</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-slate-900 rounded-2xl p-8 sm:p-10 text-white flex flex-col justify-between shadow-md border border-slate-800">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center mb-6 sm:mb-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-lg sm:text-xl font-black mb-2 sm:mb-3 tracking-tight">Verifikasi Berlapis</h4>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed font-medium">
              Nomor dengan status "Verified" telah melalui validasi bukti transfer digital oleh tim auditor keamanan kami.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: RECENT LIST */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="flex items-end justify-between mb-6 px-1 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Aktivitas Terkini</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Laporan masuk real-time</p>
          </div>
          <Link href="/report" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1 transition-colors">
            Lihat Detail <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nomor Rekening</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Institusi / Bank</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Validasi</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentReports.map((report, i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-slate-900 font-mono tracking-wider">{maskNumber(report.target_number)}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">a.n. {report.target_name || 'Tidak Diketahui'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                       <Building2 className="w-3 h-3 text-slate-400" /> {report.bank_name || 'BANK'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                      report.status === 'verified' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link href={`/check/${report.target_number}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 shadow-sm transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {recentReports.map((report, i) => (
            <Link key={i} href={`/check/${report.target_number}`} className="block bg-white border border-slate-200 rounded-xl p-5 shadow-sm active:bg-slate-50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${
                   report.status === 'verified' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {report.status}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{formatDateID(report.created_at)}</span>
              </div>
              <p className="text-lg font-black text-slate-900 font-mono mb-2 tracking-tight">{maskNumber(report.target_number)}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5"><Building2 className="w-3 h-3" /> {report.bank_name || 'BANK'}</p>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 4: CEK REKENING PER BANK ← BARU */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="flex items-end justify-between mb-6 px-1 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Cek Rekening Per Bank</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Pilih bank untuk mulai verifikasi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((bank) => (
            <Link
              key={bank.id}
              href={`/cek-rekening/${bank.id}`}
              className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-16 h-10 relative mb-4">
                  <Image
                    src={bank.logo}
                    alt={`Logo ${bank.name}`}
                    fill
                    className="object-contain object-left"
                  />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1 tracking-tight">{bank.name}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{bank.description}</p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 group-hover:text-emerald-700 uppercase tracking-wider transition-colors">
                  Cek Selengkapnya
                </span>
                <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 5: CTA */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="bg-emerald-600 rounded-2xl p-8 sm:p-16 text-center text-white relative overflow-hidden shadow-lg border border-emerald-700">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-4 sm:mb-6 leading-tight uppercase">Amankan Aset Anda.</h2>
            <p className="text-emerald-50 text-xs sm:text-sm max-w-xl mx-auto mb-8 sm:mb-10 font-medium leading-relaxed">
              Cegah kerugian finansial lebih lanjut. Berikan kontribusi dengan melaporkan bukti penipuan transaksi digital yang Anda temukan.
            </p>
            <Link href="/report" className="w-full sm:w-auto px-8 py-3.5 bg-white text-emerald-700 hover:bg-slate-50 font-bold text-sm rounded-xl transition-all inline-flex items-center justify-center gap-2 uppercase tracking-widest shadow-md">
              <PlusCircle className="w-4 h-4" /> Entri Bukti Laporan
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}