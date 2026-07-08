'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import type { Stats, Report } from '@/features/admin/types';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#0ea5e9', '#f97316', '#8b5cf6', '#14b8a6'];

function getField(r: Report, camel: keyof Report, snake: keyof Report) {
  return (r[camel] ?? r[snake]) as string | null | undefined;
}

function StatCard({ label, value, sub, color = 'text-slate-900' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function StatistikTab({ stats, reports }: { stats: Stats; reports: Report[] }) {
  const data = useMemo(() => {
    // Status breakdown
    const statusData = [
      { name: 'Pending',       value: stats.pending,  color: '#f59e0b' },
      { name: 'Terverifikasi', value: stats.verified, color: '#10b981' },
      { name: 'Ditolak',       value: stats.rejected, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Type breakdown
    const typeCount: Record<string, number> = {};
    reports.forEach(r => {
      const t = getField(r, 'targetType', 'target_type') ?? 'unknown';
      const label = t === 'phone' ? 'Nomor HP' : t === 'bank_account' ? 'Rekening Bank' : t === 'ewallet' ? 'E-Wallet' : t;
      typeCount[label] = (typeCount[label] ?? 0) + 1;
    });
    const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

    // Category breakdown
    const catCount: Record<string, number> = {};
    reports.forEach(r => {
      const cat = r.category ?? 'Lainnya';
      catCount[cat] = (catCount[cat] ?? 0) + 1;
    });
    const categoryData = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    // Platform breakdown
    const platformCount: Record<string, number> = {};
    reports.forEach(r => {
      if (r.platform) platformCount[r.platform] = (platformCount[r.platform] ?? 0) + 1;
    });
    const platformData = Object.entries(platformCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    // Trend 30 hari terakhir
    const trendMap: Record<string, { date: string; total: number; verified: number; pending: number }> = {};
    const now   = Date.now();
    const day30 = 30 * 24 * 60 * 60 * 1000;

    reports.forEach(r => {
      const dateStr = getField(r, 'createdAt', 'created_at') ?? '';
      const date    = new Date(dateStr);
      if (!dateStr || now - date.getTime() > day30) return;
      const key = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (!trendMap[key]) trendMap[key] = { date: key, total: 0, verified: 0, pending: 0 };
      trendMap[key].total++;
      if (r.status === 'verified') trendMap[key].verified++;
      if (r.status === 'pending')  trendMap[key].pending++;
    });
    const trendData = Object.values(trendMap).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Total kerugian
    const totalLoss = reports.reduce((sum, r) => sum + (r.amount ?? 0), 0);
    const avgLoss   = reports.filter(r => r.amount).length > 0
      ? Math.round(totalLoss / reports.filter(r => r.amount).length)
      : 0;

    return { statusData, typeData, categoryData, platformData, trendData, totalLoss, avgLoss };
  }, [stats, reports]);

  const formatRupiah = (n: number) => {
    if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)} M`;
    if (n >= 1_000_000)     return `Rp${(n / 1_000_000).toFixed(1)} Jt`;
    if (n >= 1_000)         return `Rp${(n / 1_000).toFixed(0)} Rb`;
    return `Rp${n.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Laporan" value={stats.total} />
        <StatCard label="Pending"        value={stats.pending}  color="text-amber-600"   sub="Menunggu review" />
        <StatCard label="Terverifikasi"  value={stats.verified} color="text-emerald-600" sub="Terkonfirmasi" />
        <StatCard label="Total Kerugian" value={formatRupiah(data.totalLoss)} color="text-red-500" sub="Dari laporan berisi nominal" />
      </div>

      {/* Trend + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend 30 hari */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Tren Laporan — 30 Hari Terakhir</p>
          {data.trendData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="total"    name="Total"        stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="verified" name="Terverifikasi" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pending"  name="Pending"       stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Status Laporan</p>
          {data.statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Belum ada data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data.statusData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {data.statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {data.statusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
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
        {/* Kategori */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Kategori Penipuan</p>
          {data.categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.categoryData} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Laporan" radius={[0, 4, 4, 0]}>
                  {data.categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tipe + Platform */}
        <div className="space-y-4">
          {/* Tipe target */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
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
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Platform */}
          {data.platformData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
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
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}