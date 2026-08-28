'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import {
  FileText, Hourglass, ShieldCheck, Wallet, TrendingUp,
  ArrowUpRight, ArrowDownRight, Calendar, Search, Landmark,
  CreditCard, Smartphone, MessageCircle, Users, Camera,
  MoreHorizontal, ChevronRight, Sparkles, CheckCircle2,
} from 'lucide-react';
import type { Stats, AdminAnalytics } from '@/features/admin/types';

const AXIS_TEXT  = '#94938d';
const GRID_COLOR = '#ecebe5';

const BRAND = {
  emeraldDeep: '#047857',
  emerald:     '#059669',
  emeraldSoft: '#10b981',
  emeraldPale: '#d1fae5',
  amber:       '#f59e0b',
  rose:        '#e11d48',
};

// TikTok tidak ada di lucide-react secara native — dibuat sebagai path SVG kecil
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
    </svg>
  );
}

const TYPE_LABEL: Record<string, string> = {
  phone: 'Nomor HP',
  bank_account: 'Rekening Bank',
  ewallet: 'E-Wallet',
};

function calcTrend(series: number[]): number | null {
  if (series.length < 4) return null;
  const mid = Math.floor(series.length / 2);
  const firstHalf  = series.slice(0, mid).reduce((a, b) => a + b, 0);
  const secondHalf = series.slice(mid).reduce((a, b) => a + b, 0);
  if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
  return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
}

// Cari hari dengan lonjakan tertinggi dibanding rata-rata 7 hari sebelumnya
function findSpike(trendData: { date: string; total: number; sortKey: number }[]) {
  let best: { date: string; total: number; pct: number } | null = null;
  for (let i = 7; i < trendData.length; i++) {
    const window = trendData.slice(Math.max(0, i - 7), i);
    const avg = window.reduce((a, b) => a + b.total, 0) / window.length;
    if (avg === 0 && trendData[i].total === 0) continue;
    const pct = avg === 0 ? 100 : Math.round(((trendData[i].total - avg) / avg) * 100);
    if (trendData[i].total > 0 && (!best || pct > best.pct)) {
      best = { date: trendData[i].date, total: trendData[i].total, pct };
    }
  }
  return best;
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

function InsightBox({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-emerald-700" strokeWidth={2.5} />
      </div>
      <p className="text-[12px] text-emerald-800 leading-snug">{children}</p>
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

const PLATFORM_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  whatsapp:  { icon: MessageCircle, color: 'text-emerald-600' },
  facebook:  { icon: Users,         color: 'text-blue-600' },
  tiktok:    { icon: TikTokIcon,    color: 'text-slate-900' },
  instagram: { icon: Camera,        color: 'text-pink-600' },
};

function platformMeta(name: string) {
  const key = name.toLowerCase();
  return PLATFORM_ICON[key] ?? { icon: MoreHorizontal, color: 'text-slate-500' };
}

export default function StatistikTab({ stats, analytics }: { stats: Stats; analytics: AdminAnalytics }) {
  const trendRef    = useRef<HTMLCanvasElement>(null);
  const statusRef   = useRef<HTMLCanvasElement>(null);
  const categoryRef = useRef<HTMLCanvasElement>(null);
  const [search, setSearch] = useState('');

  const data = useMemo(() => {
    const statusData = [
      { name: 'Terverifikasi', value: stats.verified, color: BRAND.emeraldSoft },
      { name: 'Pending',       value: stats.pending,  color: BRAND.amber },
      { name: 'Ditolak',       value: stats.rejected, color: BRAND.rose },
    ].filter(d => d.value > 0);

    const typeData = analytics.typeCounts
      .map(t => ({ name: TYPE_LABEL[t.targetType] ?? t.targetType, value: t.count }))
      .sort((a, b) => b.value - a.value);

    const categoryData = [...analytics.categoryCounts]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(c => ({ name: c.category, value: c.count }));

    const sortedPlatforms = [...analytics.platformCounts].sort((a, b) => b.count - a.count);
    const platformData = sortedPlatforms.slice(0, 5).map(p => ({ name: p.platform, value: p.count }));
    const platformOthers = sortedPlatforms.slice(5).reduce((sum, p) => sum + p.count, 0);

    // dailyTrend dari server sudah zero-filled & terurut (30 hari, WIB). Label
    // sumbu-x diformat di sini supaya konsisten dengan tampilan sebelumnya.
    const trendData = analytics.dailyTrend.map(d => {
      const dt = new Date(d.date + 'T00:00:00');
      return {
        date: dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        total: d.total,
        verified: d.verified,
        pending: d.pending,
        loss: d.loss,
        sortKey: dt.getTime(),
      };
    });

    const totalLoss = analytics.lossTotal;
    const avgLoss   = analytics.lossReportCount > 0 ? Math.round(totalLoss / analytics.lossReportCount) : 0;

    const totalSeries    = trendData.map(d => d.total);
    const pendingSeries  = trendData.map(d => d.pending);
    const verifiedSeries = trendData.map(d => d.verified);
    const lossSeries     = trendData.map(d => d.loss);

    const spike = findSpike(trendData);
    const verifiedRate = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

    return {
      statusData, typeData, categoryData, platformData, platformOthers, trendData, totalLoss, avgLoss,
      totalTrend:    calcTrend(totalSeries),
      pendingTrend:  calcTrend(pendingSeries),
      verifiedTrend: calcTrend(verifiedSeries),
      lossTrend:     calcTrend(lossSeries),
      totalSeries, pendingSeries, verifiedSeries, lossSeries,
      spike, verifiedRate,
    };
  }, [stats, analytics]);

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
        {
          label: 'Total', data: data.trendData.map(d => d.total),
          borderColor: BRAND.emeraldDeep, borderWidth: 2.5, pointRadius: 0, tension: 0.35,
          fill: true,
          backgroundColor: (ctx: any) => {
            const { chart } = ctx;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return 'rgba(4,120,87,0.05)';
            const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(4,120,87,0.16)');
            gradient.addColorStop(1, 'rgba(4,120,87,0.01)');
            return gradient;
          },
        },
        { label: 'Terverifikasi', data: data.trendData.map(d => d.verified), borderColor: BRAND.emeraldSoft, borderWidth: 2, pointRadius: 0, tension: 0.35 },
        { label: 'Pending',      data: data.trendData.map(d => d.pending),  borderColor: BRAND.amber,       borderWidth: 2, pointRadius: 0, tension: 0.35 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c1b18',
          titleFont: { size: 11, weight: 'bold' },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4,
        },
      },
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
      datasets: [{ data: data.statusData.map(d => d.value), backgroundColor: data.statusData.map(d => d.color), borderColor: '#ffffff', borderWidth: 3 }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } },
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Statistik</h1>
          <p className="text-sm text-slate-500 mt-0.5">Pantau performa laporan dan aktivitas sistem secara real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            30 hari terakhir
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari laporan, kategori, atau lainnya..."
              className="text-xs text-slate-700 placeholder:text-slate-400 outline-none w-full bg-transparent"
            />
          </div>
        </div>
      </div>

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
          icon={ShieldCheck} iconBg="bg-violet-50" iconColor="text-violet-600"
          label="Terverifikasi" value={stats.verified}
          trend={data.verifiedTrend} spark={data.verifiedSeries} sparkColor={BRAND.emeraldSoft}
        />
        <StatCard
          icon={Wallet} iconBg="bg-rose-50" iconColor="text-rose-600"
          label="Total Kerugian" value={formatRupiah(data.totalLoss)}
          trend={data.lossTrend} spark={data.lossSeries} sparkColor={BRAND.rose}
        />
        <StatCard
          icon={TrendingUp} iconBg="bg-sky-50" iconColor="text-sky-600"
          label="Rata-rata Kerugian" value={formatRupiah(data.avgLoss)}
          trend={data.lossTrend} spark={data.lossSeries} sparkColor="#0284c7"
        />
      </div>

      {/* Trend + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-800">Tren Laporan — 30 Hari Terakhir</p>
            <button className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              Harian
            </button>
          </div>
          {data.trendData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Belum ada data</div>
          ) : (
            <>
              <div className="relative h-[180px]">
                <canvas ref={trendRef} role="img" aria-label="Grafik garis tren laporan 30 hari terakhir">
                  Tren laporan total, terverifikasi, dan pending dalam 30 hari terakhir.
                </canvas>
              </div>
              <div className="flex gap-4 mt-3 mb-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: BRAND.emeraldDeep }} />Total</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: BRAND.emeraldSoft }} />Terverifikasi</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: BRAND.amber }} />Pending</span>
              </div>
              {data.spike && (
                <InsightBox icon={TrendingUp}>
                  <span className="font-bold">Lonjakan laporan terjadi pada {data.spike.date} 2026 ({data.spike.total} laporan).</span>
                  {' '}Peningkatan {data.spike.pct}% dibandingkan rata-rata 7 hari sebelumnya.
                </InsightBox>
              )}
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
          <p className="text-sm font-bold text-slate-800 mb-4">Status Laporan</p>
          {data.statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Belum ada data</div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="relative w-[110px] h-[110px] shrink-0">
                  <canvas ref={statusRef} role="img" aria-label="Grafik donat status laporan">
                    {data.statusData.map(d => `${d.name}: ${d.value}`).join(', ')}.
                  </canvas>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-black text-slate-900 tabular-nums">{stats.total}</p>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Total</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5 min-w-0">
                  {data.statusData.map((d, i) => {
                    const pct = stats.total > 0 ? Math.round((d.value / stats.total) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-[11px] text-slate-600 truncate">{d.name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 tabular-nums shrink-0">
                          {d.value} <span className="text-slate-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4">
                <InsightBox icon={CheckCircle2}>
                  <span className="font-bold">Tingkat verifikasi sangat baik!</span> {data.verifiedRate}% laporan berhasil diverifikasi.
                </InsightBox>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Kategori + Jenis Target + Platform */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-800">Kategori Penipuan</p>
            <button className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5">
              Lihat Semua <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {data.categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Belum ada data</div>
          ) : (
            <>
              <div className="relative h-[220px]">
                <canvas ref={categoryRef} role="img" aria-label="Grafik batang kategori penipuan">
                  {data.categoryData.map(d => `${d.name}: ${d.value}`).join(', ')}.
                </canvas>
              </div>
              <div className="mt-4">
                <InsightBox icon={Sparkles}>
                  Kategori dominan: <span className="font-bold">{data.categoryData[0].name}</span>{' '}
                  ({Math.round((data.categoryData[0].value / stats.total) * 100)}%)
                </InsightBox>
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-800">Jenis Target</p>
            <button className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5">
              Lihat Semua <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {data.typeData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada data</p>
          ) : (
            <>
              <div className="space-y-3.5 flex-1">
                {data.typeData.map((d, i) => {
                  const pct = stats.total > 0 ? Math.round((d.value / stats.total) * 100) : 0;
                  const iconMap: Record<string, React.ElementType> = {
                    'Rekening Bank': Landmark,
                    'E-Wallet': CreditCard,
                    'Nomor HP': Smartphone,
                  };
                  const Icon = iconMap[d.name] ?? Smartphone;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-emerald-700" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">{d.name}</span>
                          <span className="font-bold text-slate-800 tabular-nums">
                            {d.value} <span className="text-slate-400 font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: BRAND.emerald }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <InsightBox icon={Sparkles}>
                  <span className="font-bold">{data.typeData[0].name}</span> menjadi target utama{' '}
                  ({Math.round((data.typeData[0].value / stats.total) * 100)}%)
                </InsightBox>
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-800">Platform Terbanyak</p>
            <button className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5">
              Lihat Semua <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {data.platformData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada data</p>
          ) : (
            <>
              <div className="space-y-3.5 flex-1">
                {data.platformData.map((d, i) => {
                  const max = data.platformData[0]?.value ?? 1;
                  const pct = Math.round((d.value / max) * 100);
                  const total = stats.total > 0 ? Math.round((d.value / stats.total) * 100) : 0;
                  const meta = platformMeta(d.name);
                  const Icon = meta.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 truncate">{d.name}</span>
                          <span className="font-bold text-slate-800 tabular-nums shrink-0">
                            {d.value} <span className="text-slate-400 font-normal">({total}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: BRAND.emerald }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {data.platformOthers > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-500">
                      <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Lainnya</span>
                        <span className="font-bold text-slate-800 tabular-nums">{data.platformOthers}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: '20%', background: '#cbd5e1' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <InsightBox icon={Sparkles}>
                  <span className="font-bold">{data.platformData[0].name}</span> menjadi platform terbanyak{' '}
                  ({Math.round((data.platformData[0].value / stats.total) * 100)}%)
                </InsightBox>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}