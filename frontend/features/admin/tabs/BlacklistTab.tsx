// frontend/app/admin/tabs/BlacklistTab.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  Loader2, Search, Plus, AlertCircle, CheckCircle2,
  ShieldX, ShieldOff, Activity,
} from 'lucide-react';
import SectionTitle from '@/features/admin/components/SectionTitle';
import type { BlacklistEntry, IpLogEntry } from '@/features/admin/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function BlacklistTab({ token }: { token: string }) {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [logs, setLogs] = useState<IpLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingIp, setLoadingIp] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const [fetchedLogs, setFetchedLogs] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ✓ Auto-load saat tab dibuka
  useEffect(() => {
    fetchBlacklist();
    fetchLogs();
  }, []);

  const fetchBlacklist = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/blacklist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setEntries(data.data); setFetched(true); }
      else setError('Gagal memuat blacklist.');
    } catch { setError('Gagal memuat blacklist.'); }
    finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true); setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/iplogs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setLogs(data.data); setFetchedLogs(true); }
      else setError('Gagal memuat log IP.');
    } catch { setError('Gagal memuat log IP.'); }
    finally { setLoadingLogs(false); }
  };

  const handleAdd = async () => {
    if (!newIp.trim()) return;
    setAdding(true); setError(null); setSuccess(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ip: newIp.trim(), reason: newReason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('IP berhasil ditambahkan ke blacklist.');
        setNewIp(''); setNewReason('');
        fetchBlacklist();
      } else setError(data.message || 'Gagal menambahkan IP.');
    } catch { setError('Gagal menambahkan IP.'); }
    finally { setAdding(false); }
  };

  const handleRemove = async (ip: string) => {
    setLoadingIp(ip); setError(null); setSuccess(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/blacklist/${ip}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('IP berhasil dihapus dari blacklist.');
        setEntries(prev => prev.filter(e => e.ip !== ip));
      } else setError(data.message || 'Gagal menghapus IP.');
    } catch { setError('Gagal menghapus IP.'); }
    finally { setLoadingIp(null); }
  };

  const handleBlacklistFromLog = async (ip: string, reason: string) => {
    setError(null); setSuccess(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ip, reason: `[Dari Log] ${reason}` }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`IP ${ip} berhasil ditambahkan ke blacklist.`);
        fetchBlacklist();
      } else setError(data.message || 'Gagal menambahkan IP.');
    } catch { setError('Gagal menambahkan IP.'); }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <SectionTitle title="IP Blacklist" subtitle="Kelola IP yang diblokir dan pantau aktivitas mencurigakan" />

      {/* Form tambah IP */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-800 mb-4">Blacklist IP Manual</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            placeholder="Contoh: 192.168.1.1"
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all font-mono"
          />
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Alasan (opsional)"
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newIp.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shrink-0"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Blacklist
          </button>
        </div>
      </div>

      {/* Error / success */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Daftar IP diblokir */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">
            Daftar IP Diblokir {fetched && `(${entries.length})`}
          </p>
          <button
            onClick={fetchBlacklist}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>
        {loading && !fetched ? (
          <div className="p-16 text-center">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Memuat data...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">Tidak ada IP yang diblokir</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <div key={entry.ip} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldX className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900 font-mono">{entry.ip}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold border ${entry.auto ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {entry.auto ? 'Auto' : 'Manual'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                    <span>{entry.reason}</span>
                    {entry.admin && <span>oleh {entry.admin}</span>}
                    <span>{new Date(entry.created_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(entry.ip)}
                  disabled={loadingIp === entry.ip}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors shrink-0"
                >
                  {loadingIp === entry.ip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ShieldOff className="w-3.5 h-3.5" /> Hapus</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log IP mencurigakan */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Log IP Mencurigakan {fetchedLogs && `(${logs.length})`}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">IP yang kena rate limit — disimpan 7 hari</p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loadingLogs}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {loadingLogs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>
        {loadingLogs && !fetchedLogs ? (
          <div className="p-16 text-center">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Memuat log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">Tidak ada aktivitas mencurigakan</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log, i) => {
              const isBlacklisted = entries.some(e => e.ip === log.ip);
              return (
                <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900 font-mono">{log.ip}</span>
                      {isBlacklisted && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg font-semibold border bg-red-50 text-red-600 border-red-200">
                          Sudah diblokir
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                      <span>{log.reason}</span>
                      <span className="font-mono">{log.endpoint}</span>
                      <span>{new Date(log.created_at).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  {!isBlacklisted && (
                    <button
                      onClick={() => handleBlacklistFromLog(log.ip, log.reason)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-xl transition-colors shrink-0"
                    >
                      <ShieldX className="w-3.5 h-3.5" /> Blacklist
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
