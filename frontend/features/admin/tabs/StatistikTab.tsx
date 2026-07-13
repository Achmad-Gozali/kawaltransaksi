'use client';

import { useMemo, useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import {
  FileText, Hourglass, ShieldCheck, Wallet, TrendingUp,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import type { Stats, Report } from '@/features/admin/types';

const AXIS_TEXT  = '#898781';
const GRID_COLOR = '#e1e0d9';

const BRAND = {
  emeraldDeep: '#047857',
  emerald:     '#059669',
  emeraldSoft: '#10b981',
  amber:       '#f59e0b',
  rose:        '#e11d48',
};

function getField(r: Report, camel: keyof Report, snake: keyof Report) {
  return (r[camel] ?? r[snake]) as string | null | undefined;
}

function calcTrend(series: number[]): number | null {
  if (series.length < 4) return null;
  const mid = Math.floor(series.length / 2);
  const firstHalf  = series.slice(0, mid).reduce((a, b) => a + b, 0);
  const secondHalf = series.slice(mid).reduce((a, b) => a + b, 0);
  if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
  return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 32 - ((v - min) / range) * 28 - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-8">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StatCard({
  icon: Icon, iconBg, iconColor, label, value, trend, spark, sparkColor,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  trend?: number | null;
  spark?: number[];
  sparkColor: string;
}) {
  const isUp = (trend ?? 0) >= 0;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2.25} />
        </div>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold ${isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend!)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 tabular-nums">{value}</p>
      </div>
      {spark && spark.length > 1 && (
        <div>
          <Sparkline data={spark} color={sparkColor} />
          <p className="text-[10px] text-slate-400 -mt-0.5">vs 30 hari lalu</p>
        </div>
      )}
    </div>
  );
}

function useChart(
  ref: React.RefObject<HTMLCanvasElement | null>,
  config: () => any,
  deps: any[]
) {
  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, config());
    return () => chart.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function StatistikTab({ stats, reports }: { stats: Stats; reports: Report[] }) {
  const trendRef    = useRef<HTMLCanvasElement>(null);
  const statusRef   = useRef<HTMLCanvasElement>(null);
  const categoryRef = useRef<HTMLCanvasElement>(null);

  const data = useMemo(() => {
    const statusData = [
      { name: 'Terverifikasi', value: stats.verified, color: BRAND.emeraldSoft },
      { name: 'Pending',       value: stats.pending,  color: BRAND.amber },
      { name: 'Ditolak',       value: stats.rejected, color: BRAND.rose },
    ].filter(d => d.value > 0);

    const typeCount: Record<string, number> = {};
    reports.forEach(r => {
      const t = getField(r, 'targetType', 'target_type') ?? 'unknown';
      const label = t === 'phone' ? 'Nomor HP' : t === 'bank_account' ? 'Rekening Bank' : t === 'ewallet' ? 'E-Wallet' : t;
      typeCount[label] = (typeCount[label] ?? 0) + 1;
    });
    const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

    const catCount: Record<string, number> = {};
    reports.forEach(r => {
      const cat = r.category ?? 'Lainnya';
      catCount[cat] = (catCount[cat] ?? 0) + 1;
    });
    const categoryData = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    const platformCount: Record<string, number> = {};
    reports.forEach(r => {
      if (r.platform) platformCount[r.platform] = (platformCount[r.platform] ?? 0) + 1;
    });
    const platformData = Object.entries(platformCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    const trendMap: Record<string, {
      date: string; total: number; verified: number; pending: number; loss: number; sortKey: number;
    }> = {};
    const now   = Date.now();
    const day30 = 30 * 24 * 60 * 60 * 1000;

    reports.forEach(r => {
      const dateStr = getField(r, 'createdAt', 'created_at') ?? '';
      const date    = new Date(dateStr);
      if (!dateStr || now - date.getTime() > day30) return;
      const key = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (!trendMap[key]) trendMap[key] = { date: key, total: 0, verified: 0, pending: 0, loss: 0, sortKey: date.getTime() };
      trendMap[key].total++;
      if (r.status === 'verified') trendMap[key].verified++;
      if (r.status === 'pending')  trendMap[key].pending++;
      trendMap[key].loss += r.amount ?? 0;
    });

    // Isi setiap hari dalam rentang 30 hari terakhir, termasuk yang gak ada laporannya (diisi 0).
    // Ini murni soal representasi sumbu-x — jumlah laporan asli tetap sama persis, gak ada data dummy ditambahkan.
    const filledTrendData: typeof trendMap[string][] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      filledTrendData.push(
        trendMap[key] ?? { date: key, total: 0, verified: 0, pending: 0, loss: 0, sortKey: d.getTime() }
      );
    }
    const trendData = filledTrendData;

    const withAmount = reports.filter(r => r.amount);
    const totalLoss  = reports.reduce((sum, r) => sum + (r.amount ?? 0), 0);
    const avgLoss    = withAmount.length > 0 ? Math.round(totalLoss / withAmount.length) : 0;

    const totalSeries    = trendData.map(d => d.total);
    const pendingSeries  = trendData.map(d => d.pending);
    const verifiedSeries = trendData.map(d => d.verified);
    const lossSeries     = trendData.map(d => d.loss);

    return {
      statusData, typeData, categoryData, platformData, trendData, totalLoss, avgLoss,
      totalTrend:    calcTrend(totalSeries),
      pendingTrend:  calcTrend(pendingSeries),
      verifiedTrend: calcTrend(verifiedSeries),
      lossTrend:     calcTrend(lossSeries),
      totalSeries, pendingSeries, verifiedSeries, lossSeries,
    };
  }, [stats, reports]);

  const formatRupiah = (n: number) => {
    if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)} M`;
    if (n >= 1_000_000)     return `Rp${(n / 1_000_000).toFixed(1)} Jt`;
    if (n >= 1_000)         return `Rp${(n / 1_000).toFixed(0)} Rb`;
    return `Rp${n.toLocaleString('id-ID')}`;
  };

  useChart(trendRef, () => ({
    type: 'line',
    data: {
      labels: data.trendData.map(d => d.date),
      datasets: [
        { label: 'Total',        data: data.trendData.map(d => d.total),    borderColor: BRAND.emeraldDeep, borderWidth: 2, pointRadius: 0, tension: 0.3 },
        { label: 'Terverifikasi', data: data.trendData.map(d => d.verified), borderColor: BRAND.emeraldSoft, borderWidth: 2, pointRadius: 0, tension: 0.3 },
        { label: 'Pending',      data: data.trendData.map(d => d.pending),  borderColor: BRAND.amber,       borderWidth: 2, pointRadius: 0, tension: 0.3 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: AXIS_TEXT, font: { size: 10 } } },
        y: { beginAtZero: true, grid: { color: GRID_COLOR }, ticks: { color: AXIS_TEXT, font: { size: 10 }, stepSize: 1 } },
      },
    },
  }), [data.trendData]);

  useChart(statusRef, () => ({
    type: 'doughnut',
    data: {
      labels: data.statusData.map(d => d.name),
      datasets: [{ data: data.statusData.map(d => d.value), backgroundColor: data.statusData.map(d => d.color), borderColor: '#fcfcfb', borderWidth: 2 }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false } } },
  }), [data.statusData]);

  useChart(categoryRef, () => ({
    type: 'bar',
    data: {
      labels: data.categoryData.map(d => d.name),
      datasets: [{ data: data.categoryData.map(d => d.value), backgroundColor: BRAND.emerald, borderRadius: 4, barThickness: 16 }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: GRID_COLOR }, ticks: { color: AXIS_TEXT, font: { size: 10 } } },
        y: { grid: { display: false }, ticks: { color: '#52514e', font: { size: 10 } } },
      },
    },
  }), [data.categoryData]);

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          icon={FileText} iconBg="bg-emerald-50" iconColor="text-emerald-600"
          label="Total Laporan" value={stats.total}
          trend={data.totalTrend} spark={data.totalSeries} sparkColor={BRAND.emeraldDeep}
        />
        <StatCard
          icon={Hourglass} iconBg="bg-amber-50" iconColor="text-amber-600"
          label="Pending" value={stats.pending}
          trend={data.pendingTrend} spark={data.pendingSeries} sparkColor={BRAND.amber}
        />
        <StatCard
          icon={ShieldCheck} iconBg="bg-emerald-50" iconColor="text-emerald-600"
          label="Terverifikasi" value={stats.verified}
          trend={data.verifiedTrend} spark={data.verifiedSeries} sparkColor={BRAND.emeraldSoft}
        />
        <StatCard
          icon={Wallet} iconBg="bg-rose-50" iconColor="text-rose-600"
          label="Total Kerugian" value={formatRupiah(data.totalLoss)}
          trend={data.lossTrend} spark={data.lossSeries} sparkColor={BRAND.rose}
        />
        <StatCard
          icon={TrendingUp} iconBg="bg-slate-100" iconColor="text-slate-600"
          label="Rata-rata" value={formatRupiah(data.avgLoss)}
          trend={data.lossTrend} spark={data.lossSeries} sparkColor={BRAND.emerald}
        />
      </div>

      {/* Trend + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Tren Laporan — 30 Hari Terakhir</p>
          {data.trendData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Belum ada data</div>
          ) : (
            <>
              <div className="relative h-[180px]">
                <canvas ref={trendRef} role="img" aria-label="Grafik garis tren laporan 30 hari terakhir">
                  Tren laporan total, terverifikasi, dan pending dalam 30 hari terakhir.
                </canvas>
              </div>
              <div className="flex gap-4 mt-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: BRAND.emeraldDeep }} />Total</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: BRAND.emeraldSoft }} />Terverifikasi</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: BRAND.amber }} />Pending</span>
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Status Laporan</p>
          {data.statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Belum ada data</div>
          ) : (
            <>
              <div className="relative h-[140px]">
                <canvas ref={statusRef} role="img" aria-label="Grafik donat status laporan">
                  {data.statusData.map(d => `${d.name}: ${d.value}`).join(', ')}.
                </canvas>
              </div>
              <div className="space-y-1.5 mt-3">
                {data.statusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Kategori + Tipe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Kategori Penipuan</p>
          {data.categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Belum ada data</div>
          ) : (
            <div className="relative h-[220px]">
              <canvas ref={categoryRef} role="img" aria-label="Grafik batang kategori penipuan">
                {data.categoryData.map(d => `${d.name}: ${d.value}`).join(', ')}.
              </canvas>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-800 mb-3">Jenis Target</p>
            {data.typeData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada data</p>
            ) : (
              <div className="space-y-2">
                {data.typeData.map((d, i) => {
                  const pct = stats.total > 0 ? Math.round((d.value / stats.total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{d.name}</span>
                        <span className="font-bold text-slate-800">{d.value} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: BRAND.emerald }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {data.platformData.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm font-bold text-slate-800 mb-3">Platform Terbanyak</p>
              <div className="space-y-2">
                {data.platformData.map((d, i) => {
                  const max = data.platformData[0]?.value ?? 1;
                  const pct = Math.round((d.value / max) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 truncate max-w-[140px]">{d.name}</span>
                        <span className="font-bold text-slate-800">{d.value}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: BRAND.emerald }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm font-bold text-slate-800 mb-3">Platform Terbanyak</p>
              <p className="text-sm text-slate-400 text-center py-4">Belum ada data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}