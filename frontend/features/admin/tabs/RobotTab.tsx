// ============================================
//  LOKASI: frontend/features/admin/tabs/RobotTab.tsx
// ============================================
'use client';

import { useState, useEffect } from 'react';
import {
  Bot, ShieldAlert, ShieldX, AlertTriangle, Flame,
  Activity, Clock, Zap,
  ExternalLink, RefreshCw, TrendingUp,
} from 'lucide-react';
import SectionTitle from '@/features/admin/components/SectionTitle';
import type { RobotHealth, RobotBlacklist, RobotTrend, RobotLog } from '@/features/admin/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';

// -- Helpers -------------------------------------------------------------------

function StatBox({ label, value, sub, color = 'text-slate-900' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const blacklistLevelConfig = {
  medium:   { label: 'Medium',   bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon: AlertTriangle },
  high:     { label: 'High',     bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: ShieldAlert },
  critical: { label: 'Critical', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    icon: ShieldX },
};

// -- Main ----------------------------------------------------------------------

export default function RobotTab({ token }: { token: string }) {
  const [health,    setHealth]    = useState<RobotHealth | null>(null);
  const [blacklist, setBlacklist] = useState<RobotBlacklist[]>([]);
  const [trends,    setTrends]    = useState<RobotTrend[]>([]);
  const [logs,      setLogs]      = useState<RobotLog[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [running,   setRunning]   = useState(false);

  // [OK] Sekarang pakai Authorization Bearer -- sama seperti BlacklistTab dll
  const headers = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, blacklistRes, trendsRes, logsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/robot/health`,         { headers }),
        fetch(`${BACKEND_URL}/api/admin/robot/blacklist-list`, { headers }),
        fetch(`${BACKEND_URL}/api/admin/robot/viral`,          { headers }),
        fetch(`${BACKEND_URL}/api/admin/robot/logs`,           { headers }),
      ]);

      const [h, b, t, l] = await Promise.all([
        healthRes.json(), blacklistRes.json(), trendsRes.json(), logsRes.json(),
      ]);

      if (h.success) setHealth(h.data);
      if (b.success) setBlacklist(b.data ?? []);
      if (t.success) setTrends(t.data ?? []);
      if (l.success) setLogs(l.data ?? []);
    } catch (err) {
      console.error('[ROBOT TAB] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runScheduler = async () => {
    setRunning(true);
    try {
      await fetch(`${BACKEND_URL}/api/admin/robot/run-scheduler`, { method: 'POST', headers });
      await fetchData();
    } catch {
      // silent
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const errorRateColor = !health ? 'text-slate-300'
    : health.error_rate > 10 ? 'text-red-600'
    : health.error_rate > 5  ? 'text-amber-600'
    : 'text-emerald-600';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <SectionTitle title="Robot" subtitle="Monitor & kontrol sistem robot otomatis" />
        <button
          onClick={runScheduler}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          {running ? 'Menjalankan...' : 'Jalankan Robot'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Health Stats */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-3">Health Monitor</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Diproses"  value={health?.processed ?? 0} color="text-slate-900" />
              <StatBox label="Verified"  value={health?.verified  ?? 0} color="text-emerald-600" />
              <StatBox label="Rejected"  value={health?.rejected  ?? 0} color="text-red-500" />
              <StatBox label="Error Rate"
                value={`${health?.error_rate ?? 0}%`}
                color={errorRateColor}
                sub={health?.errors ? `${health.errors} error` : undefined}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <StatBox label="Pending Total" value={health?.pending_total ?? 0} color="text-amber-600" />
              <StatBox label="Avg Durasi"
                value={health?.avg_duration_ms ? `${health.avg_duration_ms}ms` : '--'}
              />
              <StatBox label="Terakhir Cek"
                value={health?.checked_at
                  ? new Date(health.checked_at).toLocaleString('id-ID', {
                      hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
                    })
                  : '--'}
              />
            </div>
          </div>

          {/* Anomali alerts */}
          {health && health.error_rate > 10 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <Activity className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                [!] Error rate tinggi ({health.error_rate}%) -- robot mungkin butuh perhatian
              </p>
            </div>
          )}
          {health && health.pending_total > 200 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 font-medium">
                [!] Queue menumpuk -- {health.pending_total} laporan pending
              </p>
            </div>
          )}

          {/* Blacklist */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-3">
              Blacklist Nomor ({blacklist.length})
            </p>
            {blacklist.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <p className="text-sm text-slate-400">Belum ada nomor di blacklist</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {blacklist.slice(0, 20).map((entry) => {
                    const cfg  = blacklistLevelConfig[entry.level as keyof typeof blacklistLevelConfig];
                    const Icon = cfg?.icon ?? AlertTriangle;
                    return (
                      <div key={entry.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg?.bg ?? 'bg-slate-50'}`}>
                            <Icon className={`w-4 h-4 ${cfg?.text ?? 'text-slate-500'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono font-semibold text-sm text-slate-900">
                              {entry.target_number.replace(/(\d{4})(?=\d)/g, '$1 ')}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {entry.unique_reporters} pelapor - {entry.total_reports} laporan
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${cfg?.bg} ${cfg?.border} ${cfg?.text}`}>
                            {cfg?.label ?? entry.level}
                          </span>
                          <a
                            href={`/check/${entry.target_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Trending/Viral */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-3 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-red-500" /> Nomor Viral (24 jam)
            </p>
            {trends.filter(t => t.is_viral).length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <p className="text-sm text-slate-400">Tidak ada nomor viral saat ini</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {trends.filter(t => t.is_viral).map((trend) => (
                    <div key={trend.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-mono font-semibold text-sm text-slate-900">
                            {trend.target_number.replace(/(\d{4})(?=\d)/g, '$1 ')}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {trend.report_count} laporan dalam 24 jam
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-red-50 border-red-200 text-red-600">
                           Viral
                        </span>
                        <a
                          href={`/check/${trend.target_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Logs */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Log Terbaru
            </p>
            {logs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <p className="text-sm text-slate-400">Belum ada log</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {logs.slice(0, 15).map((log) => (
                    <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        log.error                  ? 'bg-red-500'     :
                        log.verdict === 'verified' ? 'bg-emerald-500' :
                        log.verdict === 'rejected' ? 'bg-red-400'     : 'bg-slate-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-700 capitalize">{log.action}</span>
                          {log.verdict && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              log.verdict === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                              log.verdict === 'rejected' ? 'bg-red-50 text-red-500'         : 'bg-slate-100 text-slate-500'
                            }`}>{log.verdict}</span>
                          )}
                          {log.score != null && (
                            <span className="text-[10px] text-slate-400">skor {log.score}</span>
                          )}
                          {log.error && (
                            <span className="text-[10px] text-red-500 truncate max-w-xs">{log.error}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(log.created_at).toLocaleString('id-ID', {
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                            day: 'numeric', month: 'short',
                          })}
                          {log.duration_ms != null && ` - ${log.duration_ms}ms`}
                        </p>
                      </div>
                      {log.report_id && (
                        <a
                          href={`/admin?tab=laporan&search=${log.report_id}`}
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}