'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DailyChartProps {
  reports: { created_at: string }[];
}

type Period = '7d' | '30d' | 'all';

interface TooltipPayload {
  value: number;
  payload: { label: string };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="text-slate-400 mb-0.5">{payload[0].payload.label}</p>
      <p className="font-bold text-white">{payload[0].value} laporan</p>
    </div>
  );
}

export default function DailyChart({ reports }: DailyChartProps) {
  const [period, setPeriod] = useState<Period>('7d');

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};

    if (period === 'all') {
      const months = new Set(
        reports.map((r) => {
          const d = new Date(r.created_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        })
      );
      const useDaily = months.size <= 1;
      reports.forEach((r) => {
        const d = new Date(r.created_at);
        const key = useDaily
          ? d.toLocaleDateString('en-CA')
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        days[key] = (days[key] || 0) + 1;
      });
      const sorted = Object.entries(days).sort((a, b) => a[0].localeCompare(b[0]));
      return sorted.map(([key, count]) => ({
        label: useDaily
          ? new Date(key).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          : (() => {
              const [y, m] = key.split('-');
              return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
            })(),
        laporan: count,
      }));
    }

    const numDays = period === '7d' ? 7 : 30;
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString('en-CA')] = 0;
    }
    reports.forEach((r) => {
      const d = new Date(r.created_at).toLocaleDateString('en-CA');
      if (d in days) days[d]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      label: period === '30d'
        ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric' })
        : new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      laporan: count,
    }));
  }, [reports, period]);

  const totalInPeriod = chartData.reduce((a, b) => a + b.laporan, 0);
  const maxInPeriod = Math.max(...chartData.map(d => d.laporan), 0);
  const avgInPeriod = chartData.length > 0
    ? (totalInPeriod / chartData.filter(d => d.laporan > 0).length || 0).toFixed(1)
    : '0';

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Laporan Masuk</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{totalInPeriod} laporan dalam periode ini</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {([
            { value: '7d', label: '7H' },
            { value: '30d', label: '30H' },
            { value: 'all', label: 'All' },
          ] as { value: Period; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                period === opt.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mini stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-slate-500">Maks <span className="font-semibold text-slate-700">{maxInPeriod}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="text-[11px] text-slate-500">Rata-rata <span className="font-semibold text-slate-700">{avgInPeriod}/hari</span></span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 2, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="gradLaporan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="0"
              stroke="#f1f5f9"
              vertical={false}
              horizontal={true}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval={period === '30d' ? 4 : 0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              minTickGap={12}
              width={28}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="laporan"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradLaporan)"
              dot={period === '30d'
                ? false
                : { fill: '#fff', r: 3, strokeWidth: 2, stroke: '#10b981' }
              }
              activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={350}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}