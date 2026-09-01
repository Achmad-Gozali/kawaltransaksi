'use client';

import { useEffect, useState } from 'react';
import {
  FileText, Clock, ShieldCheck, XCircle, UserPlus, TrendingUp,
  ArrowRight, ArrowUpRight, ArrowDownRight, Hourglass, Users,
  CheckCircle2, UserCircle, Newspaper, BarChart2, Shield,
} from 'lucide-react';
import Link from 'next/link';
import { authClient } from '@/core/auth/client';
import type { Stats, Report } from '@/features/admin/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getField(r: Report, camel: keyof Report, snake: keyof Report) {
  return (r[camel] ?? r[snake]) as string | null | undefined;
}

interface DashboardStats extends Stats {
  newUsers?: number;
}

interface ActivityItem {
  type: 'report_new' | 'report_verified' | 'report_rejected' | 'user_new' | 'article_published';
  id: string;
  label: string;
  ts: string;
}

const ACTIVITY_META: Record<ActivityItem['type'], { icon: React.ElementType; bg: string; color: string; title: string }> = {
  report_verified:   { icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600', title: 'Laporan berhasil diverifikasi' },
  report_new:        { icon: FileText,     bg: 'bg-sky-100',     color: 'text-sky-600',     title: 'Laporan baru masuk' },
  user_new:          { icon: UserCircle,   bg: 'bg-sky-100',     color: 'text-sky-600',     title: 'Pengguna baru terdaftar' },
  article_published: { icon: Newspaper,    bg: 'bg-violet-100',  color: 'text-violet-600',  title: 'Artikel baru dipublikasikan' },
  report_rejected:   { icon: XCircle,      bg: 'bg-red-100',     color: 'text-red-600',     title: 'Laporan ditolak' },
};

function timeAgo(ts: string): string {
  const diffMs = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'Baru saja';
  if (min < 60) return `${min} menit yang lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam yang lalu`;
  const day = Math.floor(hr / 24);
  return `${day} hari yang lalu`;
}

// Cari hari dengan lonjakan tertinggi dalam 30 hari terakhir dibanding rata-rata 7 hari sebelumnya —
// pola sama dengan yang dipakai di StatistikTab, supaya angka lonjakan konsisten di seluruh dashboard.
function findSpike(reports: Report[]): { date: string; total: number; pct: number } | null {
  const now   = Date.now();
  const day30 = 30 * 24 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;

  const counts: Record<string, number> = {};
  reports.forEach(r => {
    const dateStr = getField(r, 'createdAt', 'created_at') ?? '';
    const date = new Date(dateStr);
    if (!dateStr || now - date.getTime() > day30) return;
    const key = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    counts[key] = (counts[key] ?? 0) + 1;
  });

  const days: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    days.push({ date: key, total: counts[key] ?? 0 });
  }

  let best: { date: string; total: number; pct: number } | null = null;
  for (let i = 7; i < days.length; i++) {
    const window = days.slice(Math.max(0, i - 7), i);
    const avg = window.reduce((a, b) => a + b.total, 0) / window.length;
    if (avg === 0 && days[i].total === 0) continue;
    const pct = avg === 0 ? 100 : Math.round(((days[i].total - avg) / avg) * 100);
    if (days[i].total > 0 && pct > 0 && (!best || pct > best.pct)) {
      best = { date: days[i].date, total: days[i].total, pct };
    }
  }
  return best;
}

function StatCard({
  icon: Icon, iconBg, iconColor, label, value, trend, trendLabel,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  trend?: number | null;
  trendLabel: string;
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
      {trend != null ? (
        <p className={`text-[11px] font-bold ${trend === 0 ? 'text-slate-400' : isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
          {trend !== 0 && (isUp ? <ArrowUpRight className="w-3 h-3 inline -mt-0.5" /> : <ArrowDownRight className="w-3 h-3 inline -mt-0.5" />)}
          {trend === 0 ? '—' : ` ${Math.abs(trend)}%`}{' '}
          <span className="text-slate-400 font-normal">{trendLabel}</span>
        </p>
      ) : (
        <p className="text-[11px] text-slate-400">{trendLabel}</p>
      )}
    </div>
  );
}

export default function DashboardTab({ stats, reports }: { stats: DashboardStats; reports: Report[] }) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    const token = authClient.getToken();
    fetch(`${API_URL}/api/admin/activity`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setActivity(data.data ?? []))
      .catch(() => setActivity([]))
      .finally(() => setActivityLoading(false));
  }, []);

  const spike = findSpike(reports);
  const pendingCount = stats.pending;
  const newUsersCount = stats.newUsers ?? 0;

  // Trend sederhana dibanding hari kemarin, dihitung dari distribusi createdAt reports.
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const isToday = (ts: string, offset: number) => {
    const d = new Date(now - offset * dayMs);
    const t = new Date(ts);
    return d.toDateString() === t.toDateString();
  };
  const countByDay = (offset: number, filter?: (r: Report) => boolean) =>
    reports.filter(r => {
      const ts = getField(r, 'createdAt', 'created_at') ?? '';
      return ts && isToday(ts, offset) && (!filter || filter(r));
    }).length;

  const calcDailyTrend = (filter?: (r: Report) => boolean): number => {
    const todayCount = countByDay(0, filter);
    const yesterdayCount = countByDay(1, filter);
    if (yesterdayCount === 0) return todayCount > 0 ? 100 : 0;
    return Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          Selamat datang, Admin! <span>👋</span>
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Berikut ringkasan aktivitas sistem hari ini.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={FileText} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Total Laporan" value={stats.total} trend={calcDailyTrend()} trendLabel="vs kemarin" />
        <StatCard icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" label="Pending" value={stats.pending} trend={calcDailyTrend(r => r.status === 'pending')} trendLabel="vs kemarin" />
        <StatCard icon={ShieldCheck} iconBg="bg-violet-50" iconColor="text-violet-600" label="Terverifikasi" value={stats.verified} trend={calcDailyTrend(r => r.status === 'verified')} trendLabel="vs kemarin" />
        <StatCard icon={XCircle} iconBg="bg-rose-50" iconColor="text-rose-600" label="Ditolak" value={stats.rejected} trend={calcDailyTrend(r => r.status === 'rejected')} trendLabel="vs kemarin" />
        <StatCard icon={UserPlus} iconBg="bg-sky-50" iconColor="text-sky-600" label="Pengguna Baru" value={newUsersCount} trend={null} trendLabel="7 hari terakhir" />
      </div>

      {/* Insight banner */}
      {spike && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-700" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-emerald-800">Lonjakan laporan terdeteksi!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Terjadi peningkatan laporan {spike.pct}% pada {spike.date} 2026 dibandingkan rata-rata 7 hari sebelumnya.
            </p>
          </div>
          <Link href="?tab=statistik" className="shrink-0 flex items-center gap-1 px-3.5 py-2 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors">
            Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Prioritas & Tindakan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-800">Prioritas & Tindakan</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Fokus pada hal yang membutuhkan tindakan Anda.</p>

          <div className="space-y-2.5">
            {pendingCount > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Hourglass className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{pendingCount} laporan menunggu review</p>
                  <p className="text-[11px] text-slate-500">Segera review laporan yang masuk.</p>
                </div>
                <Link href="?tab=laporan" className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg hover:bg-amber-200 transition-colors">
                  Review Sekarang <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {spike && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">Lonjakan laporan {spike.pct}%</p>
                  <p className="text-[11px] text-slate-500">Dibandingkan rata-rata 7 hari sebelumnya.</p>
                </div>
                <Link href="?tab=statistik" className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-[11px] font-bold rounded-lg hover:bg-red-200 transition-colors">
                  Lihat Detail <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {newUsersCount > 0 && (
              <div className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{newUsersCount} pengguna baru</p>
                  <p className="text-[11px] text-slate-500">Dalam 7 hari terakhir.</p>
                </div>
                <Link href="?tab=pengguna" className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-sky-100 text-sky-700 text-[11px] font-bold rounded-lg hover:bg-sky-200 transition-colors">
                  Lihat Pengguna <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {pendingCount === 0 && !spike && newUsersCount === 0 && (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Tidak ada yang butuh perhatian saat ini.</p>
              </div>
            )}
          </div>

          <Link href="?tab=statistik" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 mt-4 transition-colors">
            Lihat Semua Insight <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-slate-800">Aktivitas Terbaru</p>
          </div>
          <p className="text-xs text-slate-400 mb-4">Update terbaru dari sistem.</p>

          {activityLoading ? (
            <div className="py-8 text-center text-sm text-slate-400">Memuat aktivitas...</div>
          ) : activity.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">Belum ada aktivitas.</div>
          ) : (
            <div className="space-y-4">
              {activity.slice(0, 5).map((a, i) => {
                const meta = ACTIVITY_META[a.type];
                const Icon = meta.icon;
                return (
                  <div key={`${a.type}-${a.id}-${i}`} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} strokeWidth={2.25} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{meta.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{a.label}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">{timeAgo(a.ts)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <Link href="?tab=laporan" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 mt-4 transition-colors">
            Lihat Semua Aktivitas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Akses Cepat */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-sm font-bold text-slate-800">Akses Cepat</p>
        <p className="text-xs text-slate-400 mt-0.5 mb-4">Akses fitur utama dengan cepat.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Kelola Laporan', sub: 'Lihat dan kelola semua laporan', href: '?tab=laporan',   icon: FileText,   iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
            { label: 'Lihat Statistik', sub: 'Analisis performa sistem',      href: '?tab=statistik', icon: BarChart2,  iconBg: 'bg-violet-50',  iconColor: 'text-violet-600' },
            { label: 'Kelola Pengguna', sub: 'Kelola pengguna dan peran',     href: '?tab=pengguna',  icon: Users,      iconBg: 'bg-sky-50',     iconColor: 'text-sky-600' },
            { label: 'Kelola Artikel',  sub: 'Kelola konten dan artikel',     href: '?tab=artikel',   icon: Shield,     iconBg: 'bg-rose-50',    iconColor: 'text-rose-600' },
          ].map(({ label, sub, href, icon: Icon, iconBg, iconColor }) => (
            <Link key={href} href={href}
              className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.25} />
              </div>
              <p className="text-sm font-bold text-slate-800">{label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 mt-2 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}