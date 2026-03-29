'use client';

// ============================================
// 📁 LOKASI: app/admin/AdminDashboard.tsx
// ============================================

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, Clock, Eye, ExternalLink,
  Phone, Building2, ChevronDown, ChevronUp, Loader2,
  Search, Users, FileText, BarChart2, Download,
  AlertCircle, ShieldCheck, Shield
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

type Tab = 'laporan' | 'statistik' | 'pengguna';
type StatusFilter = 'semua' | 'pending' | 'verified' | 'rejected';

export default function AdminDashboard({
  stats, reports, users
}: {
  stats: Stats;
  reports: Report[];
  users: User[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>('laporan');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const router = useRouter();

  // Filter + search
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchStatus = statusFilter === 'semua' || r.status === statusFilter;
      const matchSearch = !searchQuery ||
        r.target_number.includes(searchQuery) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reporter_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.target_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [reports, statusFilter, searchQuery]);

  const handleAction = async (reportId: string, status: 'verified' | 'rejected' | 'pending') => {
    setLoadingId(reportId);
    try {
      await updateReportStatus(reportId, status);
      router.refresh();
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleBulkAction = async (status: 'verified' | 'rejected') => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => updateReportStatus(id, status)));
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      console.error('Bulk action error:', err);
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReports.map(r => r.id)));
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Nomor', 'Nama', 'Tipe', 'Kategori', 'Status', 'Pelapor', 'Tanggal'],
      ...reports.map(r => [
        r.id, r.target_number, r.target_name ?? '', r.target_type,
        r.category, r.status, r.reporter_email, r.created_at
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-kawaltransaksi-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    verified: { label: 'Verified', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
  };

  // Stats per kategori untuk chart
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => { map[r.category] = (map[r.category] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [reports]);

  const maxCat = categoryStats[0]?.[1] || 1;

  // Laporan per hari (7 hari terakhir)
  const dailyStats = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().split('T')[0]] = 0;
    }
    reports.forEach(r => {
      const day = r.created_at.split('T')[0];
      if (day in days) days[day]++;
    });
    return Object.entries(days);
  }, [reports]);

  const maxDaily = Math.max(...dailyStats.map(d => d[1]), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Laporan', value: stats.total, icon: FileText, color: 'text-zinc-900', bg: 'bg-zinc-100' },
          { label: 'Menunggu', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Terverifikasi', value: stats.verified, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Ditolak', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-400 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alert pending */}
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm font-semibold text-amber-800">
            <span className="font-extrabold">{stats.pending}</span> laporan menunggu review. Segera tindaklanjuti dalam 1×24 jam.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {[
          { id: 'laporan', label: 'Laporan', icon: FileText },
          { id: 'statistik', label: 'Statistik', icon: BarChart2 },
          { id: 'pengguna', label: 'Pengguna', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB: LAPORAN ===== */}
      {activeTab === 'laporan' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari nomor, kategori, email pelapor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>

            {/* Export */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:border-zinc-400 transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Status filters */}
          <div className="flex gap-2 flex-wrap">
            {(['semua', 'pending', 'verified', 'rejected'] as StatusFilter[]).map((f) => {
              const count = f === 'semua' ? reports.length : reports.filter(r => r.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                    statusFilter === f
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400'
                  }`}
                >
                  {f} <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="bg-zinc-900 text-white rounded-2xl p-4 flex items-center justify-between gap-4">
              <span className="text-sm font-semibold">{selectedIds.size} laporan dipilih</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('verified')}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-50"
                >
                  {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Approve Semua
                </button>
                <button
                  onClick={() => handleBulkAction('rejected')}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-500 transition-all disabled:opacity-50"
                >
                  {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Reject Semua
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="px-3 py-2 bg-white/10 text-xs font-bold rounded-xl hover:bg-white/20">
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Select all */}
          {filteredReports.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredReports.length && filteredReports.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-xs text-zinc-400 font-medium">Pilih semua ({filteredReports.length})</span>
            </div>
          )}

          {/* Report list */}
          {filteredReports.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
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
                  <div
                    key={report.id}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                      isSelected ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(report.id)}
                          className="w-4 h-4 rounded cursor-pointer mt-1 shrink-0"
                        />

                        {/* Type icon */}
                        <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                          {report.target_type === 'phone'
                            ? <Phone className="w-4 h-4 text-zinc-500" />
                            : <Building2 className="w-4 h-4 text-zinc-500" />
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-extrabold text-zinc-900 text-sm font-mono">{report.target_number}</span>
                            {report.target_name && <span className="text-xs text-zinc-400">· {report.target_name}</span>}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${status.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-zinc-400">
                            <span className="font-semibold text-zinc-600">{report.category}</span>
                            <span>·</span>
                            <span>{formatDateID(report.created_at)}</span>
                            <span>·</span>
                            <span className="truncate max-w-[150px]">{report.reporter_email}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {report.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(report.id, 'verified')}
                                disabled={isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                              >
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">Approve</span>
                              </button>
                              <button
                                onClick={() => handleAction(report.id, 'rejected')}
                                disabled={isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                              >
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">Reject</span>
                              </button>
                            </>
                          )}
                          {report.status === 'verified' && (
                            <button onClick={() => handleAction(report.id, 'rejected')} disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50">
                              <XCircle className="w-3.5 h-3.5" /><span className="hidden sm:inline">Reject</span>
                            </button>
                          )}
                          {report.status === 'rejected' && (
                            <button onClick={() => handleAction(report.id, 'verified')} disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all disabled:opacity-50">
                              <CheckCircle2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Approve</span>
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : report.id)}
                            className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center hover:bg-zinc-200 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100 px-4 sm:px-5 py-4 space-y-4 bg-zinc-50">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Kronologi</p>
                          <div className="bg-white border border-zinc-200 rounded-xl p-4">
                            <p className="text-sm text-zinc-600 leading-relaxed">{report.chronology}</p>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Pelapor</p>
                            <div className="bg-white border border-zinc-200 rounded-xl p-3">
                              <p className="text-sm font-medium text-zinc-700">{report.reporter_email}</p>
                            </div>
                          </div>
                          {report.evidence_url && (
                            <div>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Bukti</p>
                              <div className="bg-white border border-zinc-200 rounded-xl p-3">
                                <a href={report.evidence_url} target="_blank" rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
                                  <Eye className="w-4 h-4" />Lihat Bukti <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                        <a href={`/check/${report.target_number}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />Lihat halaman publik
                        </a>
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
          {/* Laporan per hari */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider mb-6">Laporan 7 Hari Terakhir</h3>
            <div className="flex items-end gap-2 h-32">
              {dailyStats.map(([date, count]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-zinc-400 font-bold">{count}</span>
                  <div
                    className="w-full bg-zinc-900 rounded-t-lg transition-all hover:bg-red-600"
                    style={{ height: `${Math.max((count / maxDaily) * 100, 4)}%` }}
                  />
                  <span className="text-[9px] text-zinc-400 font-medium">
                    {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kategori terbanyak */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider mb-6">Kategori Penipuan</h3>
            {categoryStats.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">Belum ada data</p>
            ) : (
              <div className="space-y-4">
                {categoryStats.map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-semibold text-zinc-900">{cat}</span>
                      <span className="text-xs text-zinc-400 font-bold">{count} laporan</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 rounded-full transition-all hover:bg-red-600"
                        style={{ width: `${(count / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Approval Rate', value: stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0, suffix: '%', color: 'text-emerald-600' },
              { label: 'Rejection Rate', value: stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0, suffix: '%', color: 'text-red-600' },
              { label: 'Pending Rate', value: stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0, suffix: '%', color: 'text-amber-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-zinc-200 rounded-2xl p-5 text-center">
                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}{s.suffix}</p>
                <p className="text-xs text-zinc-400 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB: PENGGUNA ===== */}
      {activeTab === 'pengguna' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">Semua Pengguna</h3>
            <span className="text-xs text-zinc-400">{users.length} total</span>
          </div>
          {users.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
              <p className="text-sm text-zinc-400">Belum ada pengguna.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <UserRow key={user.id} user={user} onRefresh={() => router.refresh()} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserRow({ user, onRefresh }: { user: User; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async (newRole: 'user' | 'admin' | 'moderator') => {
    setLoading(true);
    try {
      await updateUserRole(user.id, newRole);
      onRefresh();
    } catch (err) {
      console.error('Update role error:', err);
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = {
    admin: { label: 'Admin', color: 'bg-red-50 text-red-700 border-red-200', icon: Shield },
    moderator: { label: 'Moderator', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck },
    user: { label: 'User', color: 'bg-zinc-100 text-zinc-600 border-zinc-200', icon: Users },
  };

  const role = roleConfig[user.role as keyof typeof roleConfig] ?? roleConfig.user;
  const RoleIcon = role.icon;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
      <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
        <span className="text-white text-xs font-bold">
          {(user.full_name || 'U').charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-semibold text-zinc-900 truncate">{user.full_name || 'Tanpa Nama'}</p>
        <p className="text-xs text-zinc-400">{user.updated_at ? formatDateID(user.updated_at) : '-'}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${role.color}`}>
          <RoleIcon className="w-3 h-3" />
          {role.label}
        </span>
        {user.role !== 'admin' && (
          <button
            onClick={() => handleRoleChange('admin')}
            disabled={loading}
            className="text-[11px] font-bold px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Jadikan Admin'}
          </button>
        )}
        {user.role === 'admin' && (
          <button
            onClick={() => handleRoleChange('user')}
            disabled={loading}
            className="text-[11px] font-bold px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cabut Admin'}
          </button>
        )}
      </div>
    </div>
  );
}