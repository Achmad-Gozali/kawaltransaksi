// ============================================
// 📁 LOKASI: app/cek-rekening/page.tsx
// ✅ POLISH: Green soft, 8 sections, no "Kembali"
// ============================================

import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import {
  Building2, ShieldCheck, Clock, CheckCircle2, ArrowUpRight,
  ShieldAlert, PlusCircle, BookOpen, Lock, AlertTriangle,
  Eye, CreditCard, ArrowRight,
} from 'lucide-react';
import type { Metadata } from 'next';
import RekeningSearchForm from '@/components/RekeningSearchForm';
import { formatDateID, maskNumber } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Cek Rekening Bank - KawalTransaksi',
  description: 'Cek nomor rekening bank terindikasi penipuan secara gratis.',
};

export const revalidate = 60;

export default async function CekRekeningPage() {
  const supabase = await createClient();

  const [
    { data: rawReports },
    { count: totalRekening },
    { count: verifiedRekening },
  ] = await Promise.all([
    supabase
      .from('reports')
      .select('id, target_number, target_name, category, created_at, status, bank_name')
      .eq('target_type', 'bank_account')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', 'bank_account'),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', 'bank_account')
      .eq('status', 'verified'),
  ]);

  const allReports = rawReports ?? [];
  const recentReports = allReports.slice(0, 6);
  const verifiedRecent = allReports.filter(r => r.status === 'verified').slice(0, 4);

  // Top reported rekening
  const numberCounts: Record<string, { count: number; name: string | null; category: string; bank: string | null }> = {};
  allReports.forEach(r => {
    if (!numberCounts[r.target_number]) {
      numberCounts[r.target_number] = { count: 0, name: r.target_name, category: r.category, bank: r.bank_name };
    }
    numberCounts[r.target_number].count++;
  });
  const topNumbers = Object.entries(numberCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // Bank paling banyak dilaporkan
  const bankCounts: Record<string, number> = {};
  allReports.forEach(r => {
    if (r.bank_name) bankCounts[r.bank_name] = (bankCounts[r.bank_name] || 0) + 1;
  });
  const topBanks = Object.entries(bankCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxBank = topBanks[0]?.[1] || 1;

  // Top modus
  const modusCounts: Record<string, number> = {};
  allReports.forEach(r => { modusCounts[r.category] = (modusCounts[r.category] || 0) + 1; });
  const topModus = Object.entries(modusCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxModus = topModus[0]?.[1] || 1;

  // Last updated
  const lastUpdated = allReports[0]?.created_at;

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HERO ===== */}
      <div className="relative bg-gradient-to-b from-emerald-50/80 via-emerald-50/30 to-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-emerald-100 text-emerald-600 text-[11px] font-semibold tracking-wide mb-6 shadow-sm">
            <Building2 className="w-3.5 h-3.5" />
            Cek Rekening Bank
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Cek Rekening Bank
            <br />
            <span className="text-emerald-600">Sebelum Transfer.</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed px-2">
            Masukkan nomor rekening bank yang ingin kamu verifikasi.
            Cegah penipuan transfer sebelum terlambat.
          </p>

          <RekeningSearchForm />

          {/* Stats */}
          <div className="mt-10 flex justify-center gap-10">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-slate-900">{totalRekening || 0}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Rekening Dilaporkan</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-red-500">{verifiedRekening || 0}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Terverifikasi</p>
            </div>
          </div>

          {lastUpdated && (
            <p className="mt-6 text-[11px] text-slate-400">
              Terakhir diupdate: {formatDateID(lastUpdated)}
            </p>
          )}
        </div>
      </div>

      {/* ===== BANK PALING BANYAK DILAPORKAN ===== */}
      {topBanks.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-1">Data Bank</p>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Bank Paling Banyak Dilaporkan</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topBanks.map(([bank, count], i) => (
              <div key={bank} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-600">#{i + 1}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{bank}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(count / maxBank) * 100}%` }} />
                </div>
                <p className="text-[11px] text-slate-400">{count} laporan</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== REKENING PALING BANYAK DILAPORKAN ===== */}
      {topNumbers.length > 0 && (
        <div className="bg-slate-50/70">
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-1">Peringatan</p>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Rekening Paling Banyak Dilaporkan</h2>
              </div>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topNumbers.map(([number, data], i) => (
                <Link key={number} href={`/check/${number}`}
                  className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all group"
                >
                  <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-red-500">#{i + 1}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-slate-900 font-mono">{maskNumber(number)}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {data.bank ? `${data.bank} · ` : ''}{data.name ? `a.n. ${data.name}` : data.category} · {data.count} laporan
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODUS PENIPUAN VIA REKENING ===== */}
      {topModus.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-1">Statistik</p>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Modus Penipuan via Rekening</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {topModus.map(([modus, count], i) => (
              <div key={modus} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] font-bold text-emerald-600">#{i + 1}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{modus}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(count / maxModus) * 100}%` }} />
                </div>
                <p className="text-[11px] text-slate-400">{count} laporan</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== BARU DIVERIFIKASI ===== */}
      {verifiedRecent.length > 0 && (
        <div className="bg-slate-50/70">
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-1">Terbaru</p>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Baru Diverifikasi</h2>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Confirmed penipu
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {verifiedRecent.map((report) => (
                <Link key={report.id} href={`/check/${report.target_number}`}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-red-200 transition-all group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-red-50 text-red-600 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDateID(report.created_at)}</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 font-mono tracking-wide mb-0.5">{maskNumber(report.target_number)}</p>
                  {report.target_name && <p className="text-[11px] text-slate-400 mb-1">a.n. {report.target_name}</p>}
                  {report.bank_name && <p className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block mb-2">{report.bank_name}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">{report.category}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-red-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== SEMUA LAPORAN TERBARU ===== */}
      {recentReports.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Semua Laporan Terbaru</h2>
            <span className="text-xs text-slate-400">{totalRekening || 0} total</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentReports.map((report) => (
              <Link key={report.id} href={`/check/${report.target_number}`}
                className="block bg-white border border-slate-200 rounded-xl p-4 sm:p-5 hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded flex items-center gap-1 ${
                    report.status === 'verified' ? 'bg-red-50 text-red-600'
                      : report.status === 'rejected' ? 'bg-slate-100 text-slate-400'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {report.status === 'verified' && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {report.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                    {report.status === 'verified' ? 'Verified' : report.status === 'pending' ? 'Pending' : 'Rejected'}
                  </span>
                  <span className="text-[11px] text-slate-400">{formatDateID(report.created_at)}</span>
                </div>
                <p className="text-base font-extrabold text-slate-900 font-mono tracking-wide mb-0.5">{maskNumber(report.target_number)}</p>
                {report.target_name && <p className="text-xs text-slate-400 mb-1">a.n. {report.target_name}</p>}
                {report.bank_name && <p className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block mb-2">{report.bank_name}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">{report.category}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== EMPTY STATE ===== */}
      {allReports.length === 0 && (
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada Laporan Rekening</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">Database rekening masih bersih. Bantu komunitas dengan melaporkan rekening penipu.</p>
        </div>
      )}

      {/* ===== CARA MELINDUNGI DIRI ===== */}
      <div className="bg-slate-50/70">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Cara Aman Transfer Bank</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Eye, title: 'Cek Nama Pemilik', desc: 'Selalu verifikasi nama pemilik rekening saat konfirmasi transfer. Jangan transfer jika tidak sesuai.' },
              { icon: CreditCard, title: 'Pakai Escrow', desc: 'Gunakan fitur rekening bersama (escrow) di marketplace untuk transaksi jual beli online.' },
              { icon: AlertTriangle, title: 'Waspadai Rek Pribadi', desc: 'Jika diminta transfer ke rekening pribadi bukan perusahaan, besar kemungkinan penipuan.' },
              { icon: Lock, title: 'Jaga Data Pribadi', desc: 'Jangan berikan data kartu, PIN, atau OTP kepada siapapun lewat chat atau telepon.' },
            ].map((tip, i) => (
              <div key={i} className="bg-white border border-emerald-100 rounded-xl p-5 hover:bg-emerald-50/50 transition-colors">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <tip.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{tip.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== CTA + LINK EDUKASI ===== */}
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-4">
        <div className="bg-slate-900 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-extrabold text-white mb-2">Punya Bukti Penipuan?</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Bantu lindungi orang lain dengan melaporkan rekening penipu ke database kami.
            </p>
          </div>
          <Link href="/report"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-emerald-50 transition-all active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Buat Laporan
          </Link>
        </div>

        <Link href="/edukasi"
          className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-5 hover:bg-emerald-100/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-emerald-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Pelajari Modus Penipuan</p>
              <p className="text-xs text-slate-500">Kenali berbagai modus penipuan yang marak di Indonesia</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}