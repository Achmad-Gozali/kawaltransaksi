// ============================================
// 📁 LOKASI: app/admin/AdminDashboard.tsx
// ✅ FIX: Tambah useEffect untuk sync activeTab dengan URL params
//    - Hanya perubahan minimal: import useEffect + tambah useEffect hook
//    - Semua logic lain tidak diubah
// ============================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2, XCircle, Clock, Eye, ExternalLink,
  Phone, Building2, ChevronDown, ChevronUp, Loader2,
  Search, Users, FileText, BarChart2, Download,
  AlertCircle, ShieldCheck, Shield, Wallet,
  DollarSign, X, TrendingUp, Ban, UserCheck,
  Calendar, Globe, ChevronRight, ArrowUpRight,
} from 'lucide-react';
import { updateReportStatus, updateUserRole } from './actions';
import { formatDateID } from '@/lib/utils';

interface Report {
  id: string;
  reporter_email: string;
  target_number: string;
  target_name: string | null;
  target_type: string;
  category: string;
  chronology: string;
  evidence_url: string | null;
  status: string;
  created_at: string;
  bank_name?: string | null;
  loss_amount?: number | null;
  incident_date?: string | null;
  platform?: string | null;
}

interface User {
  id: string;
  full_name: string | null;
  role: string;
  updated_at: string | null;
}

interface Stats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

type Tab = 'dashboard' | 'laporan' | 'statistik' | 'pengguna';
type StatusFilter = 'semua' | 'pending' | 'verified' | 'rejected';

function formatRupiah(num: number): string {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}jt`;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
}

export default function AdminDashboard({
  stats, reports, users
}: {
  stats: Stats;
  reports: Report[];
  users: User[];
}) {
  const searchParams = useSearchParams();

  // ✅ FIX: Baca dari URL setiap render
  const tabFromUrl = (searchParams.get('tab') as Tab) || 'dashboard';
  const initialSearch = searchParams.get('search') || '';

  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [bankFilter, setBankFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const router = useRouter();

  // ✅ FIX: Sync activeTab setiap kali URL berubah (navigasi sidebar)
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // Unique banks & platforms
  const uniqueBanks = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.bank_name).filter(Boolean) as string[])).sort();
  }, [reports]);

  const uniquePlatforms = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.platform).filter(Boolean) as string[])).sort();
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchStatus = statusFilter === 'semua' || r.status === statusFilter;
      const matchBank = !bankFilter || r.bank_name === bankFilter;
      const matchPlatform = !platformFilter || r.platform === platformFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        r.target_number.includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.reporter_email?.toLowerCase().includes(q) ||
        r.target_name?.toLowerCase().includes(q) ||
        r.bank_name?.toLowerCase().includes(q);
      return matchStatus && matchBank && matchPlatform && matchSearch;
    });
  }, [reports, statusFilter, searchQuery, bankFilter, platformFilter]);

  // Today stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReports = useMemo(() => reports.filter(r => r.created_at.startsWith(todayStr)), [reports, todayStr]);
  const todayVerified = useMemo(() => todayReports.filter(r => r.status === 'verified'), [todayReports]);

  // Total loss
  const totalLoss = useMemo(() => reports.reduce((s, r) => s + (r.loss_amount || 0), 0), [reports]);

  // Stats per bank, category, platform
  const bankStats = useMemo(() => {
    const map: Record<string, { count: number; loss: number }> = {};
    reports.forEach(r => {
      if (r.bank_name) {
        if (!map[r.bank_name]) map[r.bank_name] = { count: 0, loss: 0 };
        map[r.bank_name].count++;
        map[r.bank_name].loss += r.loss_amount || 0;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [reports]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => { map[r.category] = (map[r.category] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [reports]);
  const maxCat = categoryStats[0]?.[1] || 1;

  const platformStats = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => { if (r.platform) map[r.platform] = (map[r.platform] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [reports]);
  const maxPlat = platformStats[0]?.[1] || 1;

  const dailyStats = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toISOString().split('T')[0]] = 0;
    }
    reports.forEach(r => { const day = r.created_at.split('T')[0]; if (day in days) days[day]++; });
    return Object.entries(days);
  }, [reports]);
  const maxDaily = Math.max(...dailyStats.map(d => d[1]), 1);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u =>
      u.full_name?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  // User report counts
  const userReportCounts = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => {
      const email = r.reporter_email;
      if (email) map[email] = (map[email] || 0) + 1;
    });
    return map;
  }, [reports]);

  // Reports by user email
  const getReportsForUser = (userId: string) => {
    return reports.filter(r => r.reporter_email && reports.some(rep => rep.reporter_email === r.reporter_email));
  };

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: Clock },
    verified: { label: 'Verified', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-500 border-red-200', icon: XCircle },
  };

  const handleAction = async (reportId: string, status: 'verified' | 'rejected' | 'pending') => {
    setLoadingId(reportId);
    try { await updateReportStatus(reportId, status); router.refresh(); }
    catch (err) { console.error('Update status error:', err); }
    finally { setLoadingId(null); }
  };

  const handleBulkAction = async (status: 'verified' | 'rejected') => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => updateReportStatus(id, status)));
      setSelectedIds(new Set()); router.refresh();
    } catch (err) { console.error('Bulk action error:', err); }
    finally { setBulkLoading(false); }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(selectedIds.size === filteredReports.length ? new Set() : new Set(filteredReports.map(r => r.id)));
  };

  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Nomor', 'Nama', 'Tipe', 'Bank/E-Wallet', 'Kategori', 'Platform', 'Kerugian', 'Tanggal Kejadian', 'Status', 'Pelapor', 'Tanggal Lapor'],
      ...reports.map(r => [r.id, r.target_number, r.target_name ?? '', r.target_type, r.bank_name ?? '', r.category, r.platform ?? '', r.loss_amount ? String(r.loss_amount) : '', r.incident_date ?? '', r.status, r.reporter_email, r.created_at])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `laporan-kawaltransaksi-${todayStr}.csv`; a.click();
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">

      {/* ===== TAB: DASHBOARD ===== */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
            <p className="text-sm text-zinc-400">Overview semua laporan</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total Laporan', value: String(stats.total), color: 'text-zinc-900', icon: FileText },
              { label: 'Menunggu', value: String(stats.pending), color: 'text-amber-500', icon: Clock },
              { label: 'Terverifikasi', value: String(stats.verified), color: 'text-emerald-500', icon: CheckCircle2 },
              { label: 'Ditolak', value: String(stats.rejected), color: 'text-red-500', icon: XCircle },
              { label: 'Total Kerugian', value: totalLoss > 0 ? formatRupiah(totalLoss) : 'Rp 0', color: 'text-zinc-900', icon: DollarSign },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-200/80 p-4">
                <s.icon className="w-4 h-4 text-zinc-300 mb-3" />
                <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Today stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-zinc-200/80 p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-semibold text-zinc-900">{todayReports.length}</p>
                <p className="text-[11px] text-zinc-400">Laporan masuk hari ini</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200/80 p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-semibold text-zinc-900">{todayVerified.length}</p>
                <p className="text-[11px] text-zinc-400">Verified hari ini</p>
              </div>
            </div>
          </div>

          {/* Pending alert */}
          {stats.pending > 0 && (
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700"><span className="font-medium">{stats.pending}</span> laporan menunggu review</p>
              <button onClick={() => { setActiveTab('laporan'); setStatusFilter('pending'); }}
                className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1">
                Review <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Quick chart + bank stats */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-900 mb-5">7 hari terakhir</h3>
              <div className="flex items-end gap-2 h-28">
                {dailyStats.map(([date, count]) => (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-zinc-400">{count}</span>
                    <div className="w-full bg-zinc-900 rounded transition-all hover:bg-zinc-700"
                      style={{ height: `${Math.max((count / maxDaily) * 100, 6)}%` }} />
                    <span className="text-[9px] text-zinc-400">
                      {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-900 mb-4">Bank terbanyak dilaporkan</h3>
              {bankStats.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-6">Belum ada data</p>
              ) : (
                <div className="space-y-3">
                  {bankStats.slice(0, 5).map(([bank, data]) => (
                    <div key={bank} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-sm text-zinc-700">{bank}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {data.loss > 0 && <span className="text-[11px] text-red-500">{formatRupiah(data.loss)}</span>}
                        <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{data.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: LAPORAN ===== */}
      {activeTab === 'laporan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-zinc-900">Laporan</h1>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-600 hover:border-zinc-300 transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Cari nomor, nama, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400" />
            </div>
            <div className="flex gap-2">
              {uniqueBanks.length > 0 && (
                <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value)}
                  className={`px-3 py-2.5 border rounded-lg text-sm appearance-none cursor-pointer ${bankFilter ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-600'}`}>
                  <option value="">Bank / E-Wallet</option>
                  {uniqueBanks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
              {uniquePlatforms.length > 0 && (
                <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
                  className={`px-3 py-2.5 border rounded-lg text-sm appearance-none cursor-pointer ${platformFilter ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-600'}`}>
                  <option value="">Platform</option>
                  {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
              {(bankFilter || platformFilter) && (
                <button onClick={() => { setBankFilter(''); setPlatformFilter(''); }} className="text-xs text-zinc-400 hover:text-zinc-700 px-2">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status pills */}
          <div className="flex gap-2">
            {(['semua', 'pending', 'verified', 'rejected'] as StatusFilter[]).map((f) => {
              const count = f === 'semua' ? reports.length : reports.filter(r => r.status === f).length;
              return (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${statusFilter === f ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
                  {f} ({count})
                </button>
              );
            })}
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="bg-zinc-900 text-white rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm">{selectedIds.size} dipilih</span>
              <div className="flex gap-2">
                <button onClick={() => handleBulkAction('verified')} disabled={bulkLoading} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg disabled:opacity-50">
                  {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve
                </button>
                <button onClick={() => handleBulkAction('rejected')} disabled={bulkLoading} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg disabled:opacity-50">
                  {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="text-xs text-zinc-400 px-2">Batal</button>
              </div>
            </div>
          )}

          {filteredReports.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selectedIds.size === filteredReports.length} onChange={selectAll} className="w-3.5 h-3.5 accent-zinc-900" />
              <span className="text-xs text-zinc-400">Pilih semua ({filteredReports.length})</span>
            </label>
          )}

          {/* Report list */}
          {filteredReports.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-16 text-center">
              <Search className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Tidak ada laporan ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReports.map((report) => {
                const status = statusConfig[report.status as keyof typeof statusConfig] ?? statusConfig.pending;
                const StatusIcon = status.icon;
                const isExpanded = expandedId === report.id;
                const isLoading = loadingId === report.id;
                const isSelected = selectedIds.has(report.id);
                return (
                  <div key={report.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(report.id)} className="w-3.5 h-3.5 accent-zinc-900 shrink-0" />
                        <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                          {report.target_type === 'phone' ? <Phone className="w-3.5 h-3.5 text-zinc-400" /> : <Building2 className="w-3.5 h-3.5 text-zinc-400" />}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-zinc-900 text-sm font-mono">{report.target_number}</span>
                            {report.target_name && <span className="text-xs text-zinc-400">· {report.target_name}</span>}
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${status.color}`}>
                              <StatusIcon className="w-2.5 h-2.5" /> {status.label}
                            </span>
                            {report.bank_name && <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded">{report.bank_name}</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                            <span>{report.category}</span><span>·</span><span>{formatDateID(report.created_at)}</span>
                            {report.loss_amount ? <><span>·</span><span className="text-red-500 font-medium">{formatRupiah(report.loss_amount)}</span></> : null}
                            {report.platform ? <><span>·</span><span>{report.platform}</span></> : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {report.status === 'pending' && (
                            <>
                              <button onClick={() => handleAction(report.id, 'verified')} disabled={isLoading} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} <span className="hidden sm:inline">Approve</span>
                              </button>
                              <button onClick={() => handleAction(report.id, 'rejected')} disabled={isLoading} className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 text-zinc-600 text-xs rounded-lg hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} <span className="hidden sm:inline">Reject</span>
                              </button>
                            </>
                          )}
                          {report.status === 'verified' && (
                            <button onClick={() => handleAction(report.id, 'rejected')} disabled={isLoading} className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 text-zinc-500 text-xs rounded-lg hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                              <XCircle className="w-3 h-3" /> <span className="hidden sm:inline">Reject</span>
                            </button>
                          )}
                          {report.status === 'rejected' && (
                            <button onClick={() => handleAction(report.id, 'verified')} disabled={isLoading} className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 text-zinc-500 text-xs rounded-lg hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50">
                              <CheckCircle2 className="w-3 h-3" /> <span className="hidden sm:inline">Approve</span>
                            </button>
                          )}
                          <button onClick={() => setExpandedId(isExpanded ? null : report.id)} className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-200">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-zinc-100 px-4 py-4 bg-zinc-50/50 space-y-3">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          <InfoCard label="Pelapor" value={report.reporter_email} />
                          {report.bank_name && <InfoCard label="Bank / E-Wallet" value={report.bank_name} />}
                          {report.loss_amount && <InfoCard label="Kerugian" value={formatRupiah(report.loss_amount)} isRed />}
                          {report.incident_date && <InfoCard label="Tanggal Kejadian" value={formatDateID(report.incident_date)} />}
                          {report.platform && <InfoCard label="Platform" value={report.platform} />}
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">Kronologi</p>
                          <div className="bg-white border border-zinc-100 rounded-lg p-3">
                            <p className="text-sm text-zinc-600 leading-relaxed">{report.chronology}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {report.evidence_url && (
                            <a href={report.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> Bukti <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <a href={`/check/${report.target_number}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-900 flex items-center gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> Halaman publik
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: STATISTIK ===== */}
      {activeTab === 'statistik' && (
        <div className="space-y-6">
          <h1 className="text-lg font-semibold text-zinc-900">Statistik</h1>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-900 mb-5">7 hari terakhir</h3>
              <div className="flex items-end gap-2 h-32">
                {dailyStats.map(([date, count]) => (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-zinc-400">{count}</span>
                    <div className="w-full bg-zinc-900 rounded hover:bg-zinc-700" style={{ height: `${Math.max((count / maxDaily) * 100, 6)}%` }} />
                    <span className="text-[9px] text-zinc-400">{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-900 mb-5">Kategori penipuan</h3>
              {categoryStats.length === 0 ? <p className="text-sm text-zinc-400 text-center py-8">Belum ada data</p> : (
                <div className="space-y-2.5">
                  {categoryStats.map(([cat, count]) => (
                    <div key={cat}>
                      <div className="flex justify-between mb-1"><span className="text-xs text-zinc-700">{cat}</span><span className="text-[11px] text-zinc-400">{count}</span></div>
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-zinc-900 rounded-full" style={{ width: `${(count / maxCat) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-900 mb-4">Bank / E-Wallet</h3>
              {bankStats.length === 0 ? <p className="text-sm text-zinc-400 text-center py-8">Belum ada data</p> : (
                <div className="space-y-2.5">
                  {bankStats.map(([bank, data]) => (
                    <div key={bank} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-zinc-400" /><span className="text-sm text-zinc-700">{bank}</span></div>
                      <div className="flex items-center gap-2">
                        {data.loss > 0 && <span className="text-[11px] text-red-500">{formatRupiah(data.loss)}</span>}
                        <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded">{data.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-900 mb-5">Platform transaksi</h3>
              {platformStats.length === 0 ? <p className="text-sm text-zinc-400 text-center py-8">Belum ada data</p> : (
                <div className="space-y-2.5">
                  {platformStats.map(([plat, count]) => (
                    <div key={plat}>
                      <div className="flex justify-between mb-1"><span className="text-xs text-zinc-700">{plat}</span><span className="text-[11px] text-zinc-400">{count}</span></div>
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-zinc-700 rounded-full" style={{ width: `${(count / maxPlat) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Approval Rate', value: stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0, color: 'text-emerald-500' },
              { label: 'Rejection Rate', value: stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0, color: 'text-red-500' },
              { label: 'Pending Rate', value: stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0, color: 'text-amber-500' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-zinc-200/80 rounded-xl p-5 text-center">
                <p className={`text-2xl font-semibold ${s.color}`}>{s.value}%</p>
                <p className="text-[11px] text-zinc-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB: PENGGUNA ===== */}
      {activeTab === 'pengguna' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">Pengguna</h1>
              <p className="text-sm text-zinc-400">{users.length} total pengguna</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" placeholder="Cari nama atau ID..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400" />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-16 text-center">
              <Users className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Tidak ada pengguna ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  reports={reports}
                  isExpanded={expandedUserId === user.id}
                  onToggle={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                  onRefresh={() => router.refresh()}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== HELPER COMPONENTS =====

function InfoCard({ label, value, isRed }: { label: string; value: string; isRed?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-zinc-100 p-2.5">
      <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-medium truncate ${isRed ? 'text-red-600' : 'text-zinc-700'}`}>{value}</p>
    </div>
  );
}

function UserRow({ user, reports, isExpanded, onToggle, onRefresh }: {
  user: User; reports: Report[]; isExpanded: boolean; onToggle: () => void; onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const handleRoleChange = async (newRole: 'user' | 'admin' | 'moderator') => {
    setLoading(true); setAction(newRole);
    try { await updateUserRole(user.id, newRole); onRefresh(); }
    catch (err) { console.error('Update role error:', err); }
    finally { setLoading(false); setAction(null); }
  };

  const userReports = reports.filter(r => {
    return false;
  });

  const roleConfig = {
    admin: { label: 'Admin', color: 'bg-red-50 text-red-600 border-red-200' },
    moderator: { label: 'Mod', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    user: { label: 'User', color: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
  };
  const role = roleConfig[user.role as keyof typeof roleConfig] ?? roleConfig.user;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-medium">{(user.full_name || 'U').charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">{user.full_name || 'Tanpa Nama'}</p>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="truncate max-w-[200px]">{user.id.slice(0, 8)}...</span>
            <span>·</span>
            <span>{user.updated_at ? formatDateID(user.updated_at) : 'Baru join'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${role.color}`}>{role.label}</span>

          {user.role !== 'admin' && (
            <button onClick={() => handleRoleChange('admin')} disabled={loading}
              className="text-[11px] px-2.5 py-1 bg-zinc-100 text-zinc-500 rounded-lg hover:bg-zinc-200 disabled:opacity-50">
              {loading && action === 'admin' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Admin'}
            </button>
          )}
          {user.role === 'admin' && (
            <button onClick={() => handleRoleChange('user')} disabled={loading}
              className="text-[11px] px-2.5 py-1 bg-zinc-100 text-zinc-500 rounded-lg hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
              {loading && action === 'user' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cabut'}
            </button>
          )}
          {user.role !== 'moderator' && user.role !== 'admin' && (
            <button onClick={() => handleRoleChange('moderator')} disabled={loading}
              className="text-[11px] px-2.5 py-1 bg-zinc-100 text-zinc-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50">
              {loading && action === 'moderator' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mod'}
            </button>
          )}

          <button onClick={onToggle} className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-200">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-zinc-100 px-4 py-3 bg-zinc-50/50 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <InfoCard label="User ID" value={user.id.slice(0, 16) + '...'} />
            <InfoCard label="Role" value={user.role} />
            <InfoCard label="Terakhir Update" value={user.updated_at ? formatDateID(user.updated_at) : '-'} />
          </div>
          <p className="text-[11px] text-zinc-400">Fitur lihat laporan per user akan tersedia setelah integrasi email mapping.</p>
        </div>
      )}
    </div>
  );
}

interface User {
  id: string;
  full_name: string | null;
  role: string;
  updated_at: string | null;
}