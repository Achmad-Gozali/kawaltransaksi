'use client';

import { useMemo, useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import type { Stats, Report } from '@/features/admin/types';

const AXIS_TEXT  = '#898781';
const GRID_COLOR = '#e1e0d9';

function getField(r: Report, camel: keyof Report, snake: keyof Report) {
  return (r[camel] ?? r[snake]) as string | null | undefined;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
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
      { name: 'Terverifikasi', value: stats.verified, color: '#1baf7a' },
      { name: 'Pending',       value: stats.pending,  color: '#eda100' },
      { name: 'Ditolak',       value: stats.rejected, color: '#e34948' },
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

    const trendMap: Record<string, { date: string; total: number; verified: number; pending: number; sortKey: number }> = {};
    const now   = Date.now();
    const day30 = 30 * 24 * 60 * 60 * 1000;

    reports.forEach(r => {
      const dateStr = getField(r, 'createdAt', 'created_at') ?? '';
      const date    = new Date(dateStr);
      if (!dateStr || now - date.getTime() > day30) return;
      const key = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (!trendMap[key]) trendMap[key] = { date: key, total: 0, verified: 0, pending: 0, sortKey: date.getTime() };
      trendMap[key].total++;
      if (r.status === 'verified') trendMap[key].verified++;
      if (r.status === 'pending')  trendMap[key].pending++;
    });
    const trendData = Object.values(trendMap).sort((a, b) => a.sortKey - b.sortKey);

    const withAmount = reports.filter(r => r.amount);
    const totalLoss  = reports.reduce((sum, r) => sum + (r.amount ?? 0), 0);
    const avgLoss    = withAmount.length > 0 ? Math.round(totalLoss / withAmount.length) : 0;

    return { statusData, typeData, categoryData, platformData, trendData, totalLoss, avgLoss };
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
        { label: 'Total',        data: data.trendData.map(d => d.total),    borderColor: '#2a78d6', borderWidth: 2, pointRadius: 0, tension: 0.35 },
        { label: 'Terverifikasi', data: data.trendData.map(d => d.verified), borderColor: '#1baf7a', borderWidth: 2, pointRadius: 0, tension: 0.35 },
        { label: 'Pending',      data: data.trendData.map(d => d.pending),  borderColor: '#eda100', borderWidth: 2, pointRadius: 0, tension: 0.35 },
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
      datasets: [{ data: data.categoryData.map(d => d.value), backgroundColor: '#2a78d6', borderRadius: 4, barThickness: 16 }],
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <StatCard label="Total Laporan"   value={stats.total} />
        <StatCard label="Pending"          value={stats.pending} />
        <StatCard label="Terverifikasi"    value={stats.verified} />
        <StatCard label="Total Kerugian"   value={formatRupiah(data.totalLoss)} />
        <StatCard label="Rata-rata"        value={formatRupiah(data.avgLoss)} />
      </div>

      {/* Trend + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
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
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#2a78d6]" />Total</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#1baf7a]" />Terverifikasi</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#eda100]" />Pending</span>
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
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
        <div className="bg-white border border-slate-200 rounded-lg p-5">
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
          <div className="bg-white border border-slate-200 rounded-lg p-5">
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
                        <div className="h-full rounded-full transition-all bg-[#2a78d6]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {data.platformData.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-5">
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
                        <div className="h-full rounded-full transition-all bg-[#2a78d6]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-sm font-bold text-slate-800 mb-3">Platform Terbanyak</p>
              <p className="text-sm text-slate-400 text-center py-4">Belum ada data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}