'use client';

import { useState } from 'react';
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight, TrendingUp, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { authClient } from '@/core/auth/client';
import type { Stats, Report } from '@/features/admin/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABEL: Record<string, string> = {
  pending:  'Pending',
  verified: 'Verified',
  rejected: 'Ditolak',
};

function getField(r: Report, camel: keyof Report, snake: keyof Report) {
  return (r[camel] ?? r[snake]) as string | null | undefined;
}

interface DashboardStats extends Stats {
  newUsers?: number;
}

export default function DashboardTab({ stats, reports: initial }: { stats: DashboardStats; reports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initial);
  const [loading, setLoading] = useState<string | null>(null);

  const cards = [
    { label: 'Total Laporan', value: stats.total,               icon: FileText },
    { label: 'Pending',       value: stats.pending,              icon: Clock },
    { label: 'Terverifikasi', value: stats.verified,             icon: CheckCircle2 },
    { label: 'Ditolak',       value: stats.rejected,              icon: XCircle },
    { label: 'Pengguna Baru', value: stats.newUsers ?? 0,         icon: UserPlus },
  ];

  const pending = reports.filter(r => r.status === 'pending').slice(0, 5);
  const recent  = reports.slice(0, 8);

  const updateStatus = async (id: string, status: 'verified' | 'rejected') => {
    setLoading(id + status);
    try {
      const token = authClient.getToken();
      const res = await fetch(`${API_URL}/api/admin/reports/${id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status }),
      });
      if (res.ok) setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
              <Icon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending — butuh aksi */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800">Butuh Review</p>
              {stats.pending > 0 && (
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                  {stats.pending}
                </span>
              )}
            </div>
            <Link href="?tab=laporan" className="text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors flex items-center gap-1">
              Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {pending.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Semua laporan sudah ditinjau</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {pending.map(r => {
                const val  = getField(r, 'targetValue', 'target_value') ?? '';
                const type = getField(r, 'targetType',  'target_type')  ?? '';
                const date = getField(r, 'createdAt',   'created_at')   ?? '';
                const typeLabel = type === 'phone' ? 'HP' : type === 'bank_account' ? 'Rekening' : 'E-Wallet';
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-mono text-slate-900 truncate">{val}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{typeLabel} · {r.category ?? '—'} · {date}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => updateStatus(r.id, 'verified')}
                        disabled={loading === r.id + 'verified'}
                        className="p-1.5 bg-white hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all disabled:opacity-40"
                        aria-label="Verifikasi"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, 'rejected')}
                        disabled={loading === r.id + 'rejected'}
                        className="p-1.5 bg-white hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg border border-slate-200 hover:border-red-200 transition-all disabled:opacity-40"
                        aria-label="Tolak"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Laporan terbaru */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800">Laporan Terbaru</p>
            <Link href="?tab=laporan" className="text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors flex items-center gap-1">
              Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">Belum ada laporan.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recent.map(r => {
                const val  = getField(r, 'targetValue', 'target_value') ?? '';
                const date = getField(r, 'createdAt',   'created_at')   ?? '';
                const badgeClass = STATUS_BADGE[r.status] ?? STATUS_BADGE.pending;
                const badgeLabel = STATUS_LABEL[r.status] ?? 'Pending';
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold font-mono text-slate-900 truncate">{val}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{r.category ?? '—'} · {date}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeClass}`}>
                      {badgeLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Lihat Semua Laporan', href: '?tab=laporan',   icon: FileText   },
          { label: 'Statistik',           href: '?tab=statistik', icon: TrendingUp },
          { label: 'Pengguna',            href: '?tab=pengguna',  icon: Users },
          { label: 'IP Blacklist',        href: '?tab=blacklist', icon: XCircle    },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-slate-300 hover:bg-slate-50 transition-all group">
            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
            <ArrowRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}