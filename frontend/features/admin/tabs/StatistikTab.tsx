'use client';

import { useMemo } from 'react';
import { Phone, Building2, TrendingUp, TrendingDown, ShieldCheck, Clock, Users, Share2, Landmark } from 'lucide-react';
import DailyChart from '@/features/admin/DailyChart';
import { formatRupiah } from '@/core/utils';
import type { Report, Stats } from '@/features/admin/types';

export default function StatistikTab({
  stats,
  reports,
}: {
  stats: Stats;
  reports: Report[];
}) {
  const totalLoss = useMemo(
    () => reports.reduce((s, r) => s + (Number(r.loss_amount) || 0), 0),
    [reports]
  );

  const avgLossPerReport = useMemo(
    () => reports.filter(r => Number(r.loss_amount) > 0).length > 0
      ? totalLoss / reports.filter(r => Number(r.loss_amount) > 0).length
      : 0,
    [reports, totalLoss]
  );

  const multiVictimCount = useMemo(
    () => reports.filter(r => r.has_other_victims === 'yes').length,
    [reports]
  );

  const hasSosmedCount = useMemo(
    () => reports.filter(r => (r.social_media_accounts ?? []).filter(Boolean).length > 0).length,
    [reports]
  );

  const reportedToInstansi = useMemo(
    () => reports.filter(r => (r.reported_to ?? []).some(v => v !== 'belum')).length,
    [reports]
  );

  const bankStats = useMemo(() => {
    const map: Record<string, { count: number; loss: number }> = {};
    reports.forEach(r => {
      const label = r.bank_name || (r.target_type === 'phone' ? 'Nomor Telepon' : 'Lainnya');
      if (!map[label]) map[label] = { count: 0, loss: 0 };
      map[label].count++;
      map[label].loss += (Number(r.loss_amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [reports]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => { map[r.category] = (map[r.category] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [reports]);
  const maxCat = categoryStats[0]?.[1] || 1;

  const platformStats = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => { if (r.platform) map[r.platform] = (map[r.platform] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [reports]);
  const maxPlat = platformStats[0]?.[1] || 1;

  const approvalRate  = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;
  const rejectionRate = stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0;
  const pendingRate   = stats.total > 0 ? Math.round((stats.pending  / stats.total) * 100) : 0;

  // Laporan per minggu (4 minggu terakhir)
  const weeklyData = useMemo(() => {
    const weeks: number[] = [0, 0, 0, 0];
    const now = new Date();
    reports.forEach(r => {
      const diff = Math.floor((now.getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7));
      if (diff < 4) weeks[diff]++;
    });
    return weeks.reverse().map((v, i) => ({ label: `${3 - i}M lalu`, value: v }));
  }, [reports]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Statistik</h1>
        <p className="text-xs text-slate-400 mt-0.5">Analisis mendalam data laporan</p>
      </div>

      {/* Rate cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Approval Rate', value: approvalRate, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', bar: 'bg-emerald-500', icon: ShieldCheck },
          { label: 'Rejection Rate', value: rejectionRate, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', bar: 'bg-red-400', icon: TrendingDown },
          { label: 'Pending Rate', value: pendingRate, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', bar: 'bg-amber-400', icon: Clock },
        ].map(s => (
          <div key={s.label} className={`bg-white border border-slate-200 rounded-lg p-3 sm:p-4`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
              <div className={`w-6 h-6 ${s.bg} rounded-md flex items-center justify-center`}>
                <s.icon className={`w-3 h-3 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${s.color} leading-none mb-2`}>{s.value}%</p>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${s.bar} rounded-full`} style={{ width: `${s.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Kerugian summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Total Kerugian', value: formatRupiah(totalLoss), color: 'text-red-500', icon: TrendingDown, iconBg: 'bg-red-50' },
          { label: 'Rata-rata / Laporan', value: formatRupiah(avgLossPerReport), color: 'text-orange-500', icon: TrendingUp, iconBg: 'bg-orange-50' },
          { label: 'Multi Korban', value: String(multiVictimCount), color: 'text-violet-600', icon: Users, iconBg: 'bg-violet-50' },
          { label: 'Lapor ke Instansi', value: String(reportedToInstansi), color: 'text-blue-600', icon: ShieldCheck, iconBg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-400 font-medium leading-tight">{s.label}</p>
              <div className={`w-6 h-6 ${s.iconBg} rounded-md flex items-center justify-center shrink-0`}>
                <s.icon className={`w-3 h-3 ${s.color}`} />
              </div>
            </div>
            <p className={`text-base sm:text-lg font-bold ${s.color} leading-none`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
          <DailyChart reports={reports} />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Kategori Penipuan</h3>
          {categoryStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map(([cat, count], i) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-slate-300 font-medium w-3 shrink-0">{i + 1}</span>
                      <span className="text-xs text-slate-700 truncate">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400">{Math.round((count / maxCat) * 100)}%</span>
                      <span className="text-xs font-semibold text-slate-700 w-6 text-right">{count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bank + Platform */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Bank & E-Wallet</h3>
          {bankStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada data</p>
          ) : (
            <div className="space-y-2">
              {bankStats.map(([label, data], i) => (
                <div key={label} className="flex items-center gap-3 py-1.5">
                  <span className="text-[10px] text-slate-300 w-3 shrink-0">{i + 1}</span>
                  <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center shrink-0">
                    {label === 'Nomor Telepon'
                      ? <Phone className="w-3 h-3 text-slate-400" />
                      : <Building2 className="w-3 h-3 text-slate-400" />}
                  </div>
                  <span className="text-xs text-slate-700 flex-1 truncate">{label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {data.loss > 0 && (
                      <span className="text-[11px] text-red-400 font-medium hidden sm:block">{formatRupiah(data.loss)}</span>
                    )}
                    <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md min-w-[24px] text-center">{data.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Platform Penipuan</h3>
          {platformStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {platformStats.map(([p, c], i) => (
                <div key={p}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-slate-300 w-3 shrink-0">{i + 1}</span>
                      <span className="text-xs text-slate-700 truncate">{p}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400">{Math.round((c / maxPlat) * 100)}%</span>
                      <span className="text-xs font-semibold text-slate-700 w-6 text-right">{c}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full transition-all duration-500"
                      style={{ width: `${(c / maxPlat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly trend + info tambahan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Weekly trend */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Tren 4 Minggu Terakhir</h3>
          {weeklyData.every(w => w.value === 0) ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada data</p>
          ) : (
            <div className="flex items-end gap-2 h-24">
              {weeklyData.map((w, i) => {
                const maxVal = Math.max(...weeklyData.map(x => x.value), 1);
                const heightPct = (w.value / maxVal) * 100;
                const isLast = i === weeklyData.length - 1;
                return (
                  <div key={w.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-700">{w.value}</span>
                    <div className="w-full flex items-end" style={{ height: '60px' }}>
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${isLast ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 text-center leading-tight">{w.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info tambahan */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Detail Laporan</h3>
          <div className="space-y-2">
            {[
              {
                label: 'Multi korban dilaporkan',
                value: multiVictimCount,
                total: stats.total,
                color: 'bg-violet-400',
                textColor: 'text-violet-600',
              },
              {
                label: 'Ada data sosial media',
                value: hasSosmedCount,
                total: stats.total,
                color: 'bg-blue-400',
                textColor: 'text-blue-600',
              },
              {
                label: 'Sudah lapor ke instansi',
                value: reportedToInstansi,
                total: stats.total,
                color: 'bg-emerald-400',
                textColor: 'text-emerald-600',
              },
              {
                label: 'Ada kerugian tercatat',
                value: reports.filter(r => Number(r.loss_amount) > 0).length,
                total: stats.total,
                color: 'bg-red-400',
                textColor: 'text-red-500',
              },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold ${item.textColor}`}>{item.value}</span>
                    <span className="text-[10px] text-slate-300">/ {item.total}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}