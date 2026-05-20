'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DailyChartProps {
  reports: { created_at: string }[];
}

type Period = '7d' | '30d' | 'all';

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
              return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', {
                month: 'short',
                year: '2-digit',
              });
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
      label:
        period === '30d'
          ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric' })
          : new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      laporan: count,
    }));
  }, [reports, period]);

  const totalInPeriod = chartData.reduce((a, b) => a + b.laporan, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Laporan masuk</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">{totalInPeriod} laporan dalam periode ini</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {([
            { value: '7d', label: '7 Hari' },
            { value: '30d', label: '30 Hari' },
            { value: 'all', label: 'Semua' },
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

      <div style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLaporan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#888780' }}
              tickLine={false}
              axisLine={false}
              interval={period === '30d' ? 4 : 0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#888780' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              minTickGap={10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e1e',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#fff',
                padding: '8px 12px',
              }}
              formatter={(value: unknown) => [`${value} laporan`, '']}
              labelStyle={{ display: 'none' }}
              cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="laporan"
              stroke="#1D9E75"
              strokeWidth={2.5}
              fill="url(#colorLaporan)"
              dot={period === '30d' ? false : { fill: '#1D9E75', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#1D9E75', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}