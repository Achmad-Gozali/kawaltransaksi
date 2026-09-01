'use client';

import { useMemo, useState } from 'react';
import {
  Search, Shield, ShieldOff, User, Crown, FileText, Users,
  UserPlus, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { AdminUser } from '@/features/admin/types';
import { formatDateID } from '@/core/utils';
import { authClient } from '@/core/auth/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const PER_PAGE = 10;

function getReportCount(u: AdminUser): number {
  return u.reportCount ?? u.report_count ?? 0;
}

function getCreatedAt(u: AdminUser): string {
  return u.createdAt ?? u.created_at ?? '';
}

// Trend sederhana: bandingkan jumlah user yang join di 30 hari terakhir
// dengan jumlah user yang join di 30 hari sebelum itu.
function calcMonthlyTrend(users: AdminUser[], filterFn?: (u: AdminUser) => boolean): number | null {
  const now       = Date.now();
  const day30     = 30 * 24 * 60 * 60 * 1000;
  const pool      = filterFn ? users.filter(filterFn) : users;
  const thisMonth = pool.filter(u => now - new Date(getCreatedAt(u)).getTime() <= day30).length;
  const lastMonth = pool.filter(u => {
    const age = now - new Date(getCreatedAt(u)).getTime();
    return age > day30 && age <= day30 * 2;
  }).length;
  if (lastMonth === 0) return thisMonth > 0 ? 100 : null;
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
}

function buildSparkline(users: AdminUser[], filterFn?: (u: AdminUser) => boolean): number[] {
  const now  = Date.now();
  const pool = filterFn ? users.filter(filterFn) : users;
  const buckets = new Array(10).fill(0);
  pool.forEach(u => {
    const ageMs  = now - new Date(getCreatedAt(u)).getTime();
    const ageDay = ageMs / (24 * 60 * 60 * 1000);
    const bucket = 9 - Math.min(9, Math.max(0, Math.floor(ageDay / 3)));
    buckets[bucket]++;
  });
  return buckets;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2 || data.every(v => v === 0)) return null;
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

function SummaryCard({
  icon: Icon, iconBg, iconColor, label, value, sub, trend, spark, sparkColor,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  sub: string;
  trend?: number | null;
  spark?: number[];
  sparkColor?: string;
}) {
  const isUp = (trend ?? 0) >= 0;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums leading-tight">{value}</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          {trend != null ? (
            <p className={`text-[11px] font-bold ${isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
              {isUp ? '↑' : '↓'} {Math.abs(trend)}%{' '}
              <span className="text-slate-400 font-normal">vs bulan lalu</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">{sub}</p>
          )}
        </div>
        {spark && spark.length > 1 && (
          <div className="w-16 shrink-0">
            <Sparkline data={spark} color={sparkColor ?? '#059669'} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PenggunaTab({ users: initial }: { users: AdminUser[] }) {
  const [users, setUsers]         = useState(initial);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount  = users.filter(u => u.role === 'user').length;
  const now        = Date.now();
  const day30      = 30 * 24 * 60 * 60 * 1000;
  const newThisMonth = users.filter(u => now - new Date(getCreatedAt(u)).getTime() <= day30).length;

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setLoading(id);
    try {
      const token = authClient.getToken();
      const res = await fetch(`${API_URL}/api/admin/users/${id}/role`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ role: newRole }),
      });
      if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Pengguna</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola semua pengguna dan peran sistem</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={Users} iconBg="bg-emerald-50" iconColor="text-emerald-600"
          label="Total Pengguna" value={users.length} sub="Semua pengguna terdaftar"
          trend={calcMonthlyTrend(users)} spark={buildSparkline(users)} sparkColor="#059669"
        />
        <SummaryCard
          icon={Shield} iconBg="bg-violet-50" iconColor="text-violet-600"
          label="Admin" value={adminCount} sub="Akun admin aktif"
        />
        <SummaryCard
          icon={User} iconBg="bg-sky-50" iconColor="text-sky-600"
          label="User" value={userCount} sub="Akun user aktif"
          trend={calcMonthlyTrend(users, u => u.role === 'user')}
          spark={buildSparkline(users, u => u.role === 'user')} sparkColor="#0284c7"
        />
        <SummaryCard
          icon={UserPlus} iconBg="bg-amber-50" iconColor="text-amber-600"
          label="Pengguna Baru" value={newThisMonth} sub="Bulan ini"
          trend={calcMonthlyTrend(users)} spark={buildSparkline(users)} sparkColor="#f59e0b"
        />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama atau email pengguna..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value as 'all' | 'admin' | 'user'); setPage(1); }}
            className="appearance-none pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 transition-colors cursor-pointer"
          >
            <option value="all">Semua Peran</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-50/60 text-left">
                <th className="px-4 py-3 font-bold text-slate-700 text-xs">Pengguna</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-xs">Peran</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-xs hidden md:table-cell">Bergabung</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-xs hidden sm:table-cell">Laporan</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    Pengguna tidak ditemukan.
                  </td>
                </tr>
              ) : paginated.map(u => {
                const reportCount = getReportCount(u);
                const createdAt   = getCreatedAt(u);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                            {u.role === 'admin' && <Crown className="w-3 h-3 text-purple-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {u.role === 'admin' ? <><Shield className="w-2.5 h-2.5" /> Admin</> : <><User className="w-2.5 h-2.5" /> User</>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{formatDateID(createdAt)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>{reportCount} laporan</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleRole(u.id, u.role)}
                        disabled={loading === u.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all disabled:opacity-40 ${
                          u.role === 'admin'
                            ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                        }`}
                      >
                        {loading === u.id ? '...' : u.role === 'admin'
                          ? <><ShieldOff className="w-3 h-3" /> Jadikan User</>
                          : <><Shield className="w-3 h-3" /> Jadikan Admin</>
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Menampilkan {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} dari {filtered.length} pengguna
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    n === currentPage
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}