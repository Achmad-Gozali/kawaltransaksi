'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Clock, CheckCircle2, XCircle,
  TrendingDown, TrendingUp, Users, AlertCircle,
  ChevronRight, Phone, Building2,
} from 'lucide-react';
import { formatRupiah } from '@/core/utils';
import type { Report, Stats } from '@/features/admin/types';

// Simple inline bar chart — no recharts dependency, fixed 7 hari
function WeekBarChart({ reports }: { reports: { created_at: string }[] }) {
  const data = useMemo(() => {
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const label = i === 0
        ? 'Hari ini'
        : d.toLocaleDateString('id-ID', { weekday: 'short' });
      days.push({ date: dateStr, label, count: 0 });
    }
    reports.forEach(r => {
      const d = new Date(r.created_at).toLocaleDateString('en-CA');
      const day = days.find(x => x.date === d);
      if (day) day.count++;
    });
    return days;
  }, [reports]);

  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Laporan Masuk</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{total} laporan dalam 7 hari terakhir</p>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d, i) => {
          const isToday = i === data.length - 1;
          const heightPct = Math.max((d.count / max) * 100, 4);
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-600">{d.count > 0 ? d.count : ''}</span>
              <div className="w-full flex items-end" style={{ height: '72px' }}>
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    isToday ? 'bg-emerald-500' : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className={`text-[9px] text-center leading-tight ${isToday ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardTab({
  stats,
  reports,
}: {
  stats: Stats;
  reports: Report[];
}) {
  const router = useRouter();
  const todayStr = new Date().toLocaleDateString('en-CA');

  const todayReports = useMemo(
    () => reports.filter(r => new Date(r.created_at).toLocaleDateString('en-CA') === todayStr),
    [reports, todayStr]
  );
  const todayVerified = useMemo(
    () => todayReports.filter(r => r.status === 'verified'),
    [todayReports]
  );
  const totalLoss = useMemo(
    () => reports.reduce((s, r) => s + (Number(r.loss_amount) || 0), 0),
    [reports]
  );
  const multiVictimCount = useMemo(
    () => reports.filter(r => r.has_other_victims === 'yes').length,
    [reports]
  );
  const pendingReports = useMemo(
    () => reports.filter(r => r.status === 'pending').slice(0, 6),
    [reports]
  );

  // Top 4 bank/nomor saja
  const topBanks = useMemo(() => {
    const map: Record<string, { count: number; loss: number }> = {};
    reports.forEach(r => {
      const label = r.bank_name || (r.target_type === 'phone' ? 'Nomor Telepon' : 'Lainnya');
      if (!map[label]) map[label] = { count: 0, loss: 0 };
      map[label].count++;
      map[label].loss += (Number(r.loss_amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count).slice(0, 4);
  }, [reports]);

  const verifiedRate = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Overview operasional hari ini</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Alert pending */}
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-semibold">{stats.pending}</span> laporan menunggu review
          </p>
          <button
            onClick={() => router.push('/admin?tab=laporan')}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Review <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Stat cards utama */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-800', icon: FileText, iconBg: 'bg-slate-100' },
          { label: 'Menunggu', value: stats.pending, color: 'text-amber-600', icon: Clock, iconBg: 'bg-amber-50' },
          { label: 'Verified', value: stats.verified, color: 'text-emerald-600', icon: CheckCircle2, iconBg: 'bg-emerald-50' },
          { label: 'Ditolak', value: stats.rejected, color: 'text-red-500', icon: XCircle, iconBg: 'bg-red-50' },
          { label: 'Kerugian', value: totalLoss > 0 ? formatRupiah(totalLoss) : 'Rp0', color: 'text-slate-800', icon: TrendingDown, iconBg: 'bg-slate-100', wide: true },
        ].map((s) => (
          <div key={s.label} className={`bg-white border border-slate-200 rounded-lg p-3 sm:p-4 ${s.wide ? 'col-span-2 sm:col-span-1' : ''}`}>
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              <div className={`w-7 h-7 ${s.iconBg} rounded-md flex items-center justify-center shrink-0`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${s.color} leading-none`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Stat hari ini */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Masuk Hari Ini', value: todayReports.length, color: 'text-blue-600', iconBg: 'bg-blue-50', icon: TrendingUp },
          { label: 'Verified Hari Ini', value: todayVerified.length, color: 'text-emerald-600', iconBg: 'bg-emerald-50', icon: CheckCircle2 },
          { label: 'Multi Korban', value: multiVictimCount, color: 'text-orange-600', iconBg: 'bg-orange-50', icon: Users },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 flex items-center gap-3">
            <div className={`w-8 h-8 ${s.iconBg} rounded-md flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-lg sm:text-2xl font-bold ${s.color} leading-none`}>{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tingkat verifikasi */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-slate-600">Tingkat Verifikasi</p>
          <p className="text-xs font-bold text-emerald-600">{verifiedRate}%</p>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${verifiedRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <p className="text-[10px] text-slate-400">{stats.verified} terverifikasi dari {stats.total} total laporan</p>
          <p className="text-[10px] text-slate-400">{stats.pending} menunggu</p>
        </div>
      </div>

      {/* Bar chart 7 hari + Perlu Direview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Bar chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
          <WeekBarChart reports={reports} />
        </div>

        {/* Perlu Direview — lebih prominent */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Perlu Direview</h3>
              {stats.pending > 0 && (
                <p className="text-[11px] text-amber-500 mt-0.5">{stats.pending} laporan menunggu</p>
              )}
            </div>
            {stats.pending > 0 && (
              <button
                onClick={() => router.push('/admin?tab=laporan')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5"
              >
                Lihat semua <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          {pendingReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-300" />
              </div>
              <p className="text-sm text-slate-400">Semua laporan sudah direview</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {pendingReports.map(r => (
                <button
                  key={r.id}
                  onClick={() => router.push(`/admin?tab=laporan`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="w-7 h-7 bg-amber-50 rounded-md flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 font-mono truncate">{r.target_number}</p>
                    <p className="text-[11px] text-slate-400 truncate">{r.category || 'Tidak ada kategori'}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top 4 bank — ringkas */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Nomor Terbanyak Dilaporkan</h3>
          <button
            onClick={() => router.push('/admin?tab=statistik')}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
          >
            Lihat detail <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {topBanks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Belum ada data</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {topBanks.map(([label, data], i) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center shrink-0">
                  {label === 'Nomor Telepon'
                    ? <Phone className="w-3 h-3 text-slate-400" />
                    : <Building2 className="w-3 h-3 text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{label}</p>
                  <p className="text-[11px] text-slate-400">{data.count} laporan</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}