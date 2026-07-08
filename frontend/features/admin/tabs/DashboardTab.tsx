'use client';

import { useState } from 'react';
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { authClient } from '@/core/auth/client';
import type { Stats, Report } from '@/features/admin/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getField(r: Report, camel: keyof Report, snake: keyof Report) {
  return (r[camel] ?? r[snake]) as string | null | undefined;
}

function formatDateID(d: string) {
  try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

export default function DashboardTab({ stats, reports: initial }: { stats: Stats; reports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initial);
  const [loading, setLoading] = useState<string | null>(null);

  const cards = [
    { label: 'Total Laporan', value: stats.total,    icon: FileText,    color: 'text-slate-700' },
    { label: 'Pending',       value: stats.pending,  icon: Clock,       color: 'text-slate-700' },
    { label: 'Terverifikasi', value: stats.verified, icon: CheckCircle2, color: 'text-slate-700' },
    { label: 'Ditolak',       value: stats.rejected, icon: XCircle,     color: 'text-slate-700' },
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
              <Icon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-3xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending — butuh aksi */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
                      <p className="text-[10px] text-slate-400 mt-0.5">{typeLabel} · {r.category ?? '—'} · {formatDateID(date)}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => updateStatus(r.id, 'verified')}
                        disabled={loading === r.id + 'verified'}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all disabled:opacity-40"
                      >
                        ✓ Verif
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, 'rejected')}
                        disabled={loading === r.id + 'rejected'}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all disabled:opacity-40"
                      >
                        ✕ Tolak
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Laporan terbaru */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold font-mono text-slate-900 truncate">{val}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{r.category ?? '—'} · {formatDateID(date)}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 bg-white text-slate-600 border-slate-200">
                      {r.status === 'verified' ? 'Verified' : r.status === 'rejected' ? 'Ditolak' : 'Pending'}
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
          { label: 'Pengguna',            href: '?tab=pengguna',  icon: CheckCircle2 },
          { label: 'IP Blacklist',        href: '?tab=blacklist', icon: XCircle    },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 hover:bg-slate-50 transition-all group">
            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
            <ArrowRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}