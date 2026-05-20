'use client';

import { useState, useEffect, useCallback } from 'react';
import { Code2, RefreshCw, Power, PowerOff, Trash2, ChevronUp, ChevronDown, Search, Clock, ShieldAlert } from 'lucide-react';
import SectionTitle from '@/features/admin/components/SectionTitle';

interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string | null;
  environment: string;
  failed_attempts: number;
  requests_today: number;
  requests_total: number;
  daily_limit: number;
  last_reset_at: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  user_email?: string;
}

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) throw new Error('NEXT_PUBLIC_BACKEND_URL is not defined');
  return url;
})();

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'ÔÇö';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatExpiry(expiresAt: string | null): { label: string; isExpired: boolean } {
  if (!expiresAt) return { label: 'ÔÇö', isExpired: false };
  const date = new Date(expiresAt);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Kadaluarsa', isExpired: true };
  if (diffDays <= 7) return { label: `${diffDays}h lagi`, isExpired: false };
  return { label: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), isExpired: false };
}

export default function ApiKeysTab({ token }: { token: string }) {
  const [keys, setKeys]           = useState<ApiKey[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [envFilter, setEnvFilter] = useState<'all' | 'live' | 'test'>('all');
  const [sortField, setSortField] = useState<keyof ApiKey>('created_at');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/apikeys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setKeys(data.data ?? []);
    } catch {
      console.error('Gagal fetch API keys');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      await fetch(`${BACKEND_URL}/api/admin/apikeys/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: !currentStatus } : k));
    } finally { setActionLoading(null); }
  };

  const resetUsage = async (id: string) => {
    setActionLoading(`reset-${id}`);
    try {
      await fetch(`${BACKEND_URL}/api/admin/apikeys/${id}/reset`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setKeys(prev => prev.map(k => k.id === id ? { ...k, requests_today: 0 } : k));
    } finally { setActionLoading(null); }
  };

  const resetFailed = async (id: string) => {
    setActionLoading(`failed-${id}`);
    try {
      await fetch(`${BACKEND_URL}/api/admin/apikeys/${id}/reset-failed`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setKeys(prev => prev.map(k => k.id === id ? { ...k, failed_attempts: 0 } : k));
    } finally { setActionLoading(null); }
  };

  const updateLimit = async (id: string, newLimit: number) => {
    if (isNaN(newLimit) || newLimit < 1) return;
    try {
      await fetch(`${BACKEND_URL}/api/admin/apikeys/${id}/limit`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_limit: newLimit }),
      });
      setKeys(prev => prev.map(k => k.id === id ? { ...k, daily_limit: newLimit } : k));
    } catch { console.error('Gagal update limit'); }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Yakin hapus API key ini?')) return;
    setActionLoading(`delete-${id}`);
    try {
      await fetch(`${BACKEND_URL}/api/admin/apikeys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setKeys(prev => prev.filter(k => k.id !== id));
    } finally { setActionLoading(null); }
  };

  const handleSort = (field: keyof ApiKey) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = keys
    .filter(k => {
      const matchSearch =
        k.name.toLowerCase().includes(search.toLowerCase()) ||
        (k.key_prefix ?? '').includes(search) ||
        (k.user_email ?? '').toLowerCase().includes(search.toLowerCase());
      const matchEnv = envFilter === 'all' || k.environment === envFilter;
      return matchSearch && matchEnv;
    })
    .sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  const SortIcon = ({ field }: { field: keyof ApiKey }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : null;

  const totalActive   = keys.filter(k => k.is_active).length;
  const totalRequests = keys.reduce((s, k) => s + k.requests_total, 0);
  const neverUsed     = keys.filter(k => !k.last_used_at).length;
  const totalFailed   = keys.reduce((s, k) => s + (k.failed_attempts || 0), 0);
  const liveKeys      = keys.filter(k => k.environment === 'live').length;
  const testKeys      = keys.filter(k => k.environment === 'test').length;

  const EmptyState = () => (
    <div className="p-12 text-center">
      <Code2 className="w-8 h-8 text-slate-200 mx-auto mb-3" />
      <p className="text-sm font-semibold text-slate-400">Belum ada API key</p>
    </div>
  );

  const LoadingState = () => (
    <div className="p-12 text-center">
      <RefreshCw className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-2" />
      <p className="text-sm text-slate-400">Memuat data...</p>
    </div>
  );

  // ÔöÇÔöÇ Mobile card per key ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const MobileCard = ({ k }: { k: ApiKey }) => {
    const expiry = formatExpiry(k.expires_at);
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{k.name}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{k.key_prefix ? `${k.key_prefix}...` : 'ÔÇö'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.user_email ?? 'ÔÇö'}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              k.environment === 'live'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>{k.environment ?? 'live'}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              k.is_active
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>{k.is_active ? 'Aktif' : 'Nonaktif'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-3">
          <div className="text-center">
            <p className={`text-sm font-bold tabular-nums ${k.requests_today >= k.daily_limit ? 'text-red-600' : 'text-slate-800'}`}>
              {k.requests_today}/{k.daily_limit}
            </p>
            <p className="text-[10px] text-slate-400">Hari Ini</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800 tabular-nums">{k.requests_total.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-slate-400">Total Req</p>
          </div>
          <div className="text-center">
            <p className={`text-sm font-bold tabular-nums ${(k.failed_attempts || 0) >= 5 ? 'text-red-600' : 'text-slate-800'}`}>
              {k.failed_attempts || 0}
            </p>
            <p className="text-[10px] text-slate-400">Failed</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelative(k.last_used_at)}
          </span>
          {k.expires_at && (
            <span className={expiry.isExpired ? 'text-red-600 font-semibold' : ''}>
              Exp: {expiry.label}
            </span>
          )}
          <span>Dibuat {new Date(k.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>

        {/* Edit limit */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Daily limit:</span>
          <input
            type="number"
            defaultValue={k.daily_limit}
            min={1}
            onBlur={e => updateLimit(k.id, parseInt(e.target.value))}
            className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400 text-center"
          />
        </div>

        {/* Aksi */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => resetUsage(k.id)}
            disabled={actionLoading === `reset-${k.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === `reset-${k.id}` ? 'animate-spin' : ''}`} />
            Reset Req
          </button>
          {(k.failed_attempts || 0) > 0 && (
            <button
              onClick={() => resetFailed(k.id)}
              disabled={actionLoading === `failed-${k.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === `failed-${k.id}` ? 'animate-spin' : ''}`} />
              Reset Failed
            </button>
          )}
          <button
            onClick={() => toggleActive(k.id, k.is_active)}
            disabled={actionLoading === k.id}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              k.is_active
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            {k.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
            {k.is_active ? 'Nonaktif' : 'Aktifkan'}
          </button>
          <button
            onClick={() => deleteKey(k.id)}
            disabled={actionLoading === `delete-${k.id}`}
            className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SectionTitle title="API Keys" subtitle="Kelola semua API key developer" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Keys',           value: keys.length,   color: 'text-slate-800' },
          { label: 'Keys Aktif',           value: totalActive,   color: 'text-emerald-600' },
          { label: 'Total Requests',       value: totalRequests, color: 'text-blue-600' },
          { label: 'Belum Pernah Dipakai', value: neverUsed,     color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString('id-ID')}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sub stats */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {liveKeys} live
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          {testKeys} test
        </span>
        {totalFailed > 0 && (
          <span className="flex items-center gap-1.5 text-red-500">
            <ShieldAlert className="w-3.5 h-3.5" />
            {totalFailed} total failed attempts
          </span>
        )}
      </div>

      {/* Search + Filter + Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, prefix, atau email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'live', 'test'] as const).map(env => (
            <button
              key={env}
              onClick={() => setEnvFilter(env)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors capitalize ${
                envFilter === env
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              {env}
            </button>
          ))}
          <button
            onClick={fetchKeys}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ÔöÇÔöÇ Mobile: card layout ÔöÇÔöÇ */}
      <div className="block lg:hidden">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {filtered.map(k => <MobileCard key={k.id} k={k} />)}
          </div>
        )}
      </div>

      {/* ÔöÇÔöÇ Desktop: table layout ÔöÇÔöÇ */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {[
                    { label: 'Nama / Prefix',    field: 'name'            },
                    { label: 'User',             field: 'user_email'      },
                    { label: 'Env',              field: 'environment'     },
                    { label: 'Req Hari Ini',     field: 'requests_today'  },
                    { label: 'Total Req',        field: 'requests_total'  },
                    { label: 'Daily Limit',      field: 'daily_limit'     },
                    { label: 'Terakhir Dipakai', field: 'last_used_at'    },
                    { label: 'Kadaluarsa',       field: 'expires_at'      },
                    { label: 'Failed',           field: 'failed_attempts' },
                    { label: 'Status',           field: 'is_active'       },
                    { label: 'Dibuat',           field: 'created_at'      },
                    { label: 'Aksi',             field: null              },
                  ].map((col) => (
                    <th
                      key={col.label}
                      onClick={() => col.field && handleSort(col.field as keyof ApiKey)}
                      className={`px-4 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.12em] whitespace-nowrap ${col.field ? 'cursor-pointer hover:text-slate-600' : ''}`}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.field && <SortIcon field={col.field as keyof ApiKey} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((k) => {
                  const expiry = formatExpiry(k.expires_at);
                  return (
                    <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-slate-900">{k.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{k.key_prefix ? `${k.key_prefix}...` : 'ÔÇö'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-slate-600">{k.user_email ?? 'ÔÇö'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          k.environment === 'live'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>{k.environment ?? 'live'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold tabular-nums ${k.requests_today >= k.daily_limit ? 'text-red-600' : 'text-slate-800'}`}>
                            {k.requests_today}
                          </span>
                          <button onClick={() => resetUsage(k.id)} disabled={actionLoading === `reset-${k.id}`}
                            title="Reset requests hari ini" className="text-slate-300 hover:text-emerald-500 transition-colors">
                            <RefreshCw className={`w-3 h-3 ${actionLoading === `reset-${k.id}` ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-600 tabular-nums">{k.requests_total.toLocaleString('id-ID')}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          type="number"
                          defaultValue={k.daily_limit}
                          min={1}
                          onBlur={e => updateLimit(k.id, parseInt(e.target.value))}
                          className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400 text-center"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-3 h-3 shrink-0 ${k.last_used_at ? 'text-slate-400' : 'text-slate-200'}`} />
                          <span className={`text-xs ${k.last_used_at ? 'text-slate-600' : 'text-slate-300'}`}>
                            {formatRelative(k.last_used_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs ${expiry.isExpired ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                          {expiry.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-semibold tabular-nums ${(k.failed_attempts || 0) >= 5 ? 'text-red-600' : 'text-slate-600'}`}>
                            {k.failed_attempts || 0}
                          </span>
                          {(k.failed_attempts || 0) > 0 && (
                            <button onClick={() => resetFailed(k.id)} disabled={actionLoading === `failed-${k.id}`}
                              title="Reset failed attempts" className="text-slate-300 hover:text-blue-500 transition-colors">
                              <RefreshCw className={`w-3 h-3 ${actionLoading === `failed-${k.id}` ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          k.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>{k.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-400">
                          {new Date(k.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => toggleActive(k.id, k.is_active)} disabled={actionLoading === k.id}
                            title={k.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              k.is_active ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'
                            }`}>
                            {k.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => deleteKey(k.id)} disabled={actionLoading === `delete-${k.id}`}
                            title="Hapus key"
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {filtered.length} dari {keys.length} API key ditampilkan
      </p>
    </div>
  );
}
