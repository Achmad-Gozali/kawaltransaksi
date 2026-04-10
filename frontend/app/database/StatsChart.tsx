'use client';

import { useState, useMemo, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

interface RawReport {
  target_type: string;
  bank_name: string | null;
  category: string | null;
  status: string;
  created_at: string;
}

interface StatsChartProps {
  rawReports: RawReport[];
}

type Range = 'all' | '30' | '7';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
const ewalletNames = ['gopay', 'dana', 'ovo', 'shopeepay', 'linkaja'];

function toWIBDateString(dateStr: string): string {
  const d = new Date(dateStr);
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}

function formatShortDate(wibDateStr: string): string {
  const [, month, day] = wibDateStr.split('-');
  return `${day}/${month}`;
}

const CustomTooltipTrend = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs font-bold">
        <p className="text-slate-400 mb-0.5">{label}</p>
        <p className="text-emerald-400">{payload[0].value} laporan</p>
      </div>
    );
  }
  return null;
};

const CustomTooltipBar = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs font-bold">
        <p className="text-slate-400 mb-0.5">{label}</p>
        <p className="text-blue-400">{payload[0].value} laporan</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 900 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function StatsChart({ rawReports }: StatsChartProps) {
  const [range, setRange] = useState<Range>('30');

  const nowRef = useRef(Date.now());
  const now = nowRef.current;

  const filteredReports = useMemo(() => {
    if (range === 'all') return rawReports;
    const days = parseInt(range);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);
    return rawReports.filter(r => new Date(r.created_at) >= cutoff);
  }, [rawReports, range, now]);

  const trendData = useMemo(() => {
    const days = range === 'all'
      ? Math.max(7, Math.ceil((now - new Date(rawReports[rawReports.length - 1]?.created_at ?? now).getTime()) / 86400000) + 1)
      : parseInt(range);
    const cappedDays = Math.min(days, range === 'all' ? 60 : parseInt(range));
    const result: { date: string; count: number }[] = [];
    for (let i = cappedDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const wibStr = toWIBDateString(d.toISOString());
      const label = formatShortDate(wibStr);
      const count = filteredReports.filter(r => toWIBDateString(r.created_at) === wibStr).length;
      result.push({ date: label, count });
    }
    return result;
  }, [filteredReports, range, rawReports, now]);

  const categoryData = useMemo(() => {
    const count: Record<string, number> = {};
    filteredReports.forEach(r => {
      if (r.category) count[r.category] = (count[r.category] ?? 0) + 1;
    });
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [filteredReports]);

  const platformData = useMemo(() => {
    const count: Record<string, number> = {};
    filteredReports.forEach(r => {
      const bankKey = r.bank_name?.toLowerCase() ?? '';
      let platform = 'Nomor HP';
      if (r.target_type === 'bank_account' && r.bank_name) {
        platform = r.bank_name.toUpperCase();
      } else if (r.target_type === 'ewallet' && r.bank_name) {
        platform = bankKey.charAt(0).toUpperCase() + bankKey.slice(1);
      } else if (r.target_type === 'phone' && r.bank_name && ewalletNames.includes(bankKey)) {
        platform = bankKey.charAt(0).toUpperCase() + bankKey.slice(1);
      }
      count[platform] = (count[platform] ?? 0) + 1;
    });
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [filteredReports]);

  const hasData = filteredReports.length > 0;
  const hasTrend = trendData.some(d => d.count > 0);
  const trendDays = range === '7' ? 7 : range === '30' ? 30 : trendData.length;
  const tickInterval = trendDays > 14 ? Math.floor(trendDays / 7) : 0;

  const rangeOptions: { val: Range; label: string }[] = [
    { val: '7', label: '7 Hari' },
    { val: '30', label: '30 Hari' },
    { val: 'all', label: 'Semua' },
  ];

  return (
    <div className="space-y-4">
      {/* ── Toggle Global ── */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
          Rentang:
        </span>
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
          {rangeOptions.map(opt => (
            <button
              key={opt.val}
              onClick={() => setRange(opt.val)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                range === opt.val
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-slate-400">
          {filteredReports.length} laporan
        </span>
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Line Chart - Tren */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tren Laporan</p>
            <p className="text-base font-black text-slate-900">
              {range === 'all' ? 'Semua Waktu' : range === '30' ? '30 Hari Terakhir' : '7 Hari Terakhir'}
            </p>
          </div>
          {!hasTrend ? (
            <div className="h-36 flex items-center justify-center text-sm text-slate-400 font-bold">
              Belum ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltipTrend />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={trendDays <= 14
                    ? { fill: '#10b981', strokeWidth: 0, r: 4 }
                    : false
                  }
                  activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut Chart - Kategori */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Jenis Penipuan</p>
            <p className="text-base font-black text-slate-900">Terbanyak Dilaporkan</p>
          </div>
          {!hasData || categoryData.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-sm text-slate-400 font-bold">
              Belum ada data
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%" cy="50%"
                      innerRadius={32} outerRadius={62}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {categoryData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-bold text-slate-600 truncate leading-tight">{item.name}</span>
                    <span className="text-xs font-black text-slate-900 ml-auto shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart - Platform */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Platform</p>
            <p className="text-base font-black text-slate-900">Paling Banyak Digunakan</p>
          </div>
          {!hasData || platformData.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-sm text-slate-400 font-bold">
              Belum ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={platformData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={18}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltipBar />} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {platformData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}