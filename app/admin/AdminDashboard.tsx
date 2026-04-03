'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2, XCircle, Clock, Eye, ExternalLink,
  Phone, Building2, ChevronDown, ChevronUp, Loader2,
  Search, Users, FileText, DollarSign, X, TrendingUp, ChevronRight,
  AlertCircle, Download, Globe, AtSign, ShieldAlert, UserX, Calendar,
  TrendingDown, Undo2, FilePen,
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
  loss_amount?: number | string | null;
  incident_date?: string | null;
  platform?: string | null;
  link_url?: string | null;
  social_media_accounts?: string[] | null;
  suspect_photo_url?: string | null;
  has_other_victims?: string | null;
  reported_to?: string[] | null;
}

interface AdminUser {
  id: string;
  full_name: string | null;
  role: string;
  updated_at: string | null;
}

interface Stats { total: number; pending: number; verified: number; rejected: number; }
type Tab = 'dashboard' | 'laporan' | 'statistik' | 'pengguna';
type StatusFilter = 'semua' | 'pending' | 'verified' | 'rejected' | 'withdrawn';

function formatRupiah(num: number | string): string {
  const n = Number(num) || 0;
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

const reportedToLabel: Record<string, string> = {
  polisi:   '🚔 Polisi',
  ojk:      '🏦 OJK',
  platform: '📱 Platform',
  belum:    '❌ Belum lapor',
};

function StatCard({ label, value, color, icon: Icon, bg }: { label: string; value: string; color: string; icon: React.ElementType; bg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className={`text-2xl font-bold ${color} mb-0.5`}>{value}</p>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function DashboardInner({ stats, reports, users }: { stats: Stats; reports: Report[]; users: AdminUser[] }) {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const currentTab      = (searchParams.get('tab') as Tab) || 'dashboard';
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('semua');
  const [searchQuery, setSearchQuery]       = useState(searchParams.get('search') || '');
  const [bankFilter, setBankFilter]         = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [expandedId, setExpandedId]         = useState<string | null>(null);
  const [loadingId, setLoadingId]           = useState<string | null>(null);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading]       = useState(false);
  const [userSearch, setUserSearch]         = useState('');

  const setActiveTab = (tab: Tab) => router.push(`/admin?tab=${tab}`);

  const uniqueBanks     = useMemo(() => Array.from(new Set(reports.map(r => r.bank_name).filter(Boolean) as string[])).sort(), [reports]);
  const uniquePlatforms = useMemo(() => Array.from(new Set(reports.map(r => r.platform).filter(Boolean) as string[])).sort(), [reports]);

  const filteredReports = useMemo(() => reports.filter(r => {
    const matchStatus   = statusFilter === 'semua' || r.status === statusFilter;
    const matchBank     = !bankFilter || r.bank_name === bankFilter;
    const matchPlatform = !platformFilter || r.platform === platformFilter;
    const q             = searchQuery.toLowerCase();
    const matchSearch   = !q
      || r.target_number.includes(q)
      || r.category.toLowerCase().includes(q)
      || r.reporter_email?.toLowerCase().includes(q)
      || r.target_name?.toLowerCase().includes(q)
      || r.bank_name?.toLowerCase().includes(q)
      || r.social_media_accounts?.some(a => a.toLowerCase().includes(q));
    return matchStatus && matchBank && matchPlatform && matchSearch;
  }), [reports, statusFilter, searchQuery, bankFilter, platformFilter]);

  const todayStr      = new Date().toLocaleDateString('en-CA');
  const todayReports  = useMemo(() => reports.filter(r => new Date(r.created_at).toLocaleDateString('en-CA') === todayStr), [reports, todayStr]);
  const todayVerified = useMemo(() => todayReports.filter(r => r.status === 'verified'), [todayReports]);
  const totalLoss     = useMemo(() => reports.reduce((s, r) => s + (Number(r.loss_amount) || 0), 0), [reports]);
  const multiVictimCount = useMemo(() => reports.filter(r => r.has_other_victims === 'yes').length, [reports]);

  const bankStats = useMemo(() => {
    const map: Record<string, { count: number; loss: number }> = {};
    reports.forEach(r => {
      const label = r.bank_name || (r.target_type === 'phone' ? 'Nomor Telepon' : 'Lainnya');
      if (!map[label]) map[label] = { count: 0, loss: 0 };
      map[label].count++;
      map[label].loss += (Number(r.loss_amount) || 0);
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
      days[d.toLocaleDateString('en-CA')] = 0;
    }
    reports.forEach(r => {
      const d = new Date(r.created_at).toLocaleDateString('en-CA');
      if (d in days) days[d]++;
    });
    return Object.entries(days);
  }, [reports]);
  const maxDaily = Math.max(...dailyStats.map(d => d[1]), 1);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u => u.full_name?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  }, [users, userSearch]);

  const statusConfig = {
    pending:   { label: 'Pending',         color: 'bg-amber-50 text-amber-600 border-amber-200',       icon: Clock },
    verified:  { label: 'Verified',        color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
    rejected:  { label: 'Rejected',        color: 'bg-red-50 text-red-500 border-red-200',              icon: XCircle },
    withdrawn: { label: 'Sedang Direvisi', color: 'bg-blue-50 text-blue-600 border-blue-200',           icon: FilePen },
  };

  const handleAction = async (id: string, status: 'verified' | 'rejected' | 'pending' | 'withdrawn') => {
    setLoadingId(id);
    try { await updateReportStatus(id, status); router.refresh(); } catch (err) { console.error(err); } finally { setLoadingId(null); }
  };

  const handleBulkAction = async (status: 'verified' | 'rejected') => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => updateReportStatus(id, status)));
      setSelectedIds(new Set()); router.refresh();
    } catch (err) { console.error(err); } finally { setBulkLoading(false); }
  };

  const toggleSelect = (id: string) => {
    const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n);
  };
  const selectAll = () => setSelectedIds(
    selectedIds.size === filteredReports.length ? new Set() : new Set(filteredReports.map(r => r.id))
  );

  const handleExportCSV = () => {
    const rows = [
      ['ID','Nomor','Nama','Tipe','Bank','Kategori','Platform','Link URL','Sosmed','Korban Lain','Lapor Ke','Kerugian','Tgl Kejadian','Status','Pelapor','Tgl Lapor'],
      ...reports.map(r => [
        r.id, r.target_number, r.target_name??'', r.target_type, r.bank_name??'',
        r.category, r.platform??'', r.link_url??'',
        (r.social_media_accounts??[]).join(';'),
        r.has_other_victims??'', (r.reported_to??[]).join(';'),
        r.loss_amount ? String(r.loss_amount) : '',
        r.incident_date??'', r.status, r.reporter_email, r.created_at,
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `laporan-${todayStr}.csv`; a.click();
  };

  // ─── DASHBOARD TAB ───
  if (currentTab === 'dashboard') return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SectionTitle title="Dashboard" subtitle="Overview semua laporan masuk" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Laporan"  value={String(stats.total)}   color="text-slate-800"   bg="bg-slate-100"    icon={FileText} />
        <StatCard label="Menunggu"       value={String(stats.pending)}  color="text-amber-600"   bg="bg-amber-50"     icon={Clock} />
        <StatCard label="Terverifikasi"  value={String(stats.verified)} color="text-emerald-600" bg="bg-emerald-50"   icon={CheckCircle2} />
        <StatCard label="Ditolak"        value={String(stats.rejected)} color="text-red-500"     bg="bg-red-50"       icon={XCircle} />
        <StatCard label="Total Kerugian" value={totalLoss > 0 ? formatRupiah(totalLoss) : 'Rp 0'} color="text-slate-800" bg="bg-slate-100" icon={TrendingDown} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Masuk Hari Ini',    value: todayReports.length,  color: 'text-blue-600',   bg: 'bg-blue-50',   icon: TrendingUp },
          { label: 'Verified Hari Ini', value: todayVerified.length, color: 'text-emerald-600',bg: 'bg-emerald-50',icon: CheckCircle2 },
          { label: 'Multi Korban',      value: multiVictimCount,     color: 'text-orange-600', bg: 'bg-orange-50', icon: Users },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-semibold">{stats.pending}</span> laporan menunggu review
          </p>
          <button
            onClick={() => { setActiveTab('laporan'); setStatusFilter('pending'); }}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Review <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-6">Laporan 7 Hari Terakhir</h3>
          <div className="flex items-end gap-2 h-36">
            {dailyStats.map(([date, count]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">{count}</span>
                <div className="w-full bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors" style={{ height: `${Math.max((count / maxDaily) * 100, 4)}%`, minHeight: '4px' }} />
                <span className="text-[9px] text-slate-400">{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Bank Terbanyak Dilaporkan</h3>
          {bankStats.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Belum ada data</p>
            : (
              <div className="space-y-3">
                {bankStats.slice(0, 5).map(([label, data]) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                        {label === 'Nomor Telepon' ? <Phone className="w-3.5 h-3.5 text-slate-500" /> : <Building2 className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {data.loss > 0 && <span className="text-xs text-red-500 font-medium">{formatRupiah(data.loss)}</span>}
                      <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-lg">{data.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );

  // ─── LAPORAN TAB ───
  if (currentTab === 'laporan') return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <SectionTitle title="Laporan" />
        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50 font-medium transition-colors">
          <Download className="w-4 h-4" /><span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Cari nomor, nama, sosmed..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
        </div>
        <div className="flex gap-2">
          {uniqueBanks.length > 0 && (
            <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value)}
              className={`px-3 py-2.5 border rounded-xl text-sm cursor-pointer transition-all ${bankFilter ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
              <option value="">Bank</option>
              {uniqueBanks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          {uniquePlatforms.length > 0 && (
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
              className={`px-3 py-2.5 border rounded-xl text-sm cursor-pointer transition-all ${platformFilter ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
              <option value="">Platform</option>
              {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          {(bankFilter || platformFilter) && (
            <button onClick={() => { setBankFilter(''); setPlatformFilter(''); }} className="px-3 py-2.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['semua', 'pending', 'verified', 'rejected', 'withdrawn'] as StatusFilter[]).map(f => {
          const count = f === 'semua' ? reports.length : reports.filter(r => r.status === f).length;
          const colors: Record<StatusFilter, string> = {
            semua:     statusFilter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300',
            pending:   statusFilter === f ? 'bg-amber-500 text-white' : 'bg-white text-amber-500 border border-amber-200 hover:border-amber-300',
            verified:  statusFilter === f ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-600 border border-emerald-200 hover:border-emerald-300',
            rejected:  statusFilter === f ? 'bg-red-500 text-white' : 'bg-white text-red-500 border border-red-200 hover:border-red-300',
            withdrawn: statusFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200 hover:border-blue-300',
          };
          const labels: Record<StatusFilter, string> = {
            semua: 'Semua', pending: 'Pending', verified: 'Verified',
            rejected: 'Rejected', withdrawn: 'Sedang Direvisi',
          };
          return (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${colors[f]}`}>
              {labels[f]} ({count})
            </button>
          );
        })}
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl px-5 py-3.5 flex items-center justify-between">
          <span className="text-sm font-medium">{selectedIds.size} laporan dipilih</span>
          <div className="flex gap-2">
            <button onClick={() => handleBulkAction('verified')} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors">
              {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
            </button>
            <button onClick={() => handleBulkAction('rejected')} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-400 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors">
              {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-white px-2 transition-colors">Batal</button>
          </div>
        </div>
      )}

      {filteredReports.length > 0 && (
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input type="checkbox" checked={selectedIds.size === filteredReports.length} onChange={selectAll} className="w-4 h-4 accent-emerald-600 rounded" />
          <span className="text-xs text-slate-400 font-medium">Pilih semua ({filteredReports.length})</span>
        </label>
      )}

      {filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">Tidak ada laporan ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba ubah filter pencarian</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map(report => {
            const st    = statusConfig[report.status as keyof typeof statusConfig] ?? statusConfig.pending;
            const StIcon = st.icon;
            const isExp  = expandedId === report.id;
            const isLd   = loadingId === report.id;
            const isSel  = selectedIds.has(report.id);
            const hasSocmed     = (report.social_media_accounts ?? []).filter(Boolean).length > 0;
            const hasReportedTo = (report.reported_to ?? []).filter(Boolean).length > 0;

            return (
              <div key={report.id} className={`bg-white border rounded-2xl overflow-hidden transition-all duration-150 ${isSel ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="px-4 py-4 sm:px-5">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={isSel} onChange={() => toggleSelect(report.id)} className="w-4 h-4 accent-emerald-600 shrink-0 mt-1 rounded" />
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${report.target_type === 'phone' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                      {report.target_type === 'phone' ? <Phone className="w-4 h-4 text-blue-500" /> : <Building2 className="w-4 h-4 text-purple-500" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-bold text-slate-900 text-sm font-mono tracking-wide">{report.target_number}</span>
                        {report.target_name && <span className="text-xs text-slate-400 hidden sm:inline">· {report.target_name}</span>}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${st.color}`}>
                          <StIcon className="w-2.5 h-2.5" />{st.label}
                        </span>
                        {report.bank_name && <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg font-medium hidden sm:inline">{report.bank_name}</span>}
                        {report.has_other_victims === 'yes' && (
                          <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg font-semibold">👥 Multi korban</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg font-medium text-slate-500">{report.category}</span>
                        <span>{formatDateID(report.created_at)}</span>
                        {report.loss_amount ? <span className="text-red-500 font-semibold">{formatRupiah(report.loss_amount)}</span> : null}
                        {report.platform ? <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">{report.platform}</span> : null}
                      </div>
                      {hasSocmed && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(report.social_media_accounts ?? []).filter(Boolean).slice(0, 2).map((acc, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-mono border border-slate-200">@{acc.replace(/^@/, '')}</span>
                          ))}
                          {(report.social_media_accounts ?? []).filter(Boolean).length > 2 && (
                            <span className="text-[10px] text-slate-400">+{(report.social_media_accounts ?? []).filter(Boolean).length - 2} lagi</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {report.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(report.id, 'verified')} disabled={isLd}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                            {isLd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button onClick={() => handleAction(report.id, 'rejected')} disabled={isLd}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors">
                            {isLd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                        </>
                      )}
                      {report.status === 'verified' && (
                        <button onClick={() => handleAction(report.id, 'rejected')} disabled={isLd}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors">
                          <XCircle className="w-3.5 h-3.5" /><span className="hidden sm:inline">Reject</span>
                        </button>
                      )}
                      {report.status === 'rejected' && (
                        <button onClick={() => handleAction(report.id, 'verified')} disabled={isLd}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Approve</span>
                        </button>
                      )}
                      {report.status === 'withdrawn' && (
                        <button onClick={() => handleAction(report.id, 'pending')} disabled={isLd}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50 transition-colors">
                          {isLd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">Restore</span>
                        </button>
                      )}
                      <button onClick={() => setExpandedId(isExp ? null : report.id)}
                        className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors">
                        {isExp ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExp && (
                  <div className="border-t border-slate-100 px-4 sm:px-5 py-5 bg-slate-50/60 space-y-5">
                    {report.suspect_photo_url && (
                      <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <img src={report.suspect_photo_url} alt="Foto penipu" className="w-16 h-16 object-cover rounded-xl border-2 border-red-200 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <UserX className="w-3 h-3" /> Foto Profil Penipu
                          </p>
                          <a href={report.suspect_photo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-600 hover:underline flex items-center gap-1">
                            Lihat ukuran penuh <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Pelapor', value: report.reporter_email, className: '' },
                        report.bank_name ? { label: 'Bank', value: report.bank_name, className: '' } : null,
                        report.loss_amount ? { label: 'Kerugian', value: formatRupiah(report.loss_amount), className: 'text-red-600 font-semibold' } : null,
                        report.incident_date ? { label: 'Tgl Kejadian', value: formatDateID(report.incident_date), className: '' } : null,
                        report.platform ? { label: 'Platform', value: report.platform, className: '' } : null,
                        report.has_other_victims ? {
                          label: 'Korban Lain',
                          value: report.has_other_victims === 'yes' ? '⚠ Ada korban lain' : 'Hanya pelapor',
                          className: report.has_other_victims === 'yes' ? 'text-orange-600 font-semibold' : ''
                        } : null,
                      ].filter(Boolean).map((item, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-100 p-3.5">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">{item!.label}</p>
                          <p className={`text-xs font-medium text-slate-700 truncate ${item!.className}`}>{item!.value}</p>
                        </div>
                      ))}
                      {report.link_url && (
                        <div className="bg-white rounded-xl border border-slate-100 p-3.5 col-span-2">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Link URL</p>
                          <a href={report.link_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 truncate">
                            {report.link_url} <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>
                    {hasSocmed && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                          <AtSign className="w-3 h-3" /> Akun Media Sosial Penipu
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(report.social_media_accounts ?? []).filter(Boolean).map((acc, i) => (
                            <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700">
                              {acc.startsWith('http')
                                ? <a href={acc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">{acc} <ExternalLink className="w-2.5 h-2.5 inline" /></a>
                                : `@${acc.replace(/^@/, '')}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {hasReportedTo && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                          <ShieldAlert className="w-3 h-3" /> Sudah Lapor Ke
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(report.reported_to ?? []).filter(Boolean).map(v => (
                            <span key={v} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${v === 'belum' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                              {reportedToLabel[v] ?? v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Kronologi</p>
                      <div className="bg-white border border-slate-100 rounded-xl p-4">
                        <p className="text-sm text-slate-600 leading-relaxed">{report.chronology}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-1">
                      {report.evidence_url && (
                        <a href={report.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 font-medium transition-colors">
                          <Eye className="w-3.5 h-3.5" />Lihat Bukti
                        </a>
                      )}
                      <a href={`/check/${report.target_number}`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />Halaman Publik
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
  );

  // ─── STATISTIK TAB ───
  if (currentTab === 'statistik') return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SectionTitle title="Statistik" subtitle="Analisis data laporan" />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-6">Laporan 7 Hari Terakhir</h3>
          <div className="flex items-end gap-2 h-36">
            {dailyStats.map(([d, c]) => (
              <div key={d} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">{c}</span>
                <div className="w-full bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors" style={{ height: `${Math.max((c / maxDaily) * 100, 4)}%`, minHeight: '4px' }} />
                <span className="text-[9px] text-slate-400">{new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Kategori</h3>
          {categoryStats.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">Belum ada</p> : (
            <div className="space-y-3.5">
              {categoryStats.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-700">{cat}</span>
                    <span className="text-xs text-slate-400 font-semibold">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(count / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Bank / E-Wallet</h3>
          {bankStats.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">Belum ada</p> : (
            <div className="space-y-3">
              {bankStats.map(([label, data]) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                      {label === 'Nomor Telepon' ? <Phone className="w-3.5 h-3.5 text-slate-400" /> : <Building2 className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {data.loss > 0 && <span className="text-xs text-red-500 font-semibold">{formatRupiah(data.loss)}</span>}
                    <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-lg">{data.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Platform</h3>
          {platformStats.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">Belum ada</p> : (
            <div className="space-y-3.5">
              {platformStats.map(([p, c]) => (
                <div key={p}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-700">{p}</span>
                    <span className="text-xs text-slate-400 font-semibold">{c}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600 rounded-full" style={{ width: `${(c / maxPlat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Approval Rate',  value: stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Rejection Rate', value: stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0, color: 'text-red-500',     bg: 'bg-red-50' },
          { label: 'Pending Rate',   value: stats.total > 0 ? Math.round((stats.pending  / stats.total) * 100) : 0, color: 'text-amber-600',   bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-200 p-6 text-center`}>
            <p className={`text-3xl lg:text-4xl font-black ${s.color}`}>{s.value}%</p>
            <p className="text-xs text-slate-500 font-medium mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-5">Info Tambahan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <p className="text-2xl font-black text-orange-600">{multiVictimCount}</p>
            <p className="text-xs text-orange-500 font-medium mt-1">Laporan multi korban</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-2xl font-black text-slate-700">{reports.filter(r => (r.social_media_accounts ?? []).filter(Boolean).length > 0).length}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Laporan ada data sosmed</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-2xl font-black text-emerald-600">{reports.filter(r => (r.reported_to ?? []).some(v => v !== 'belum')).length}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Sudah lapor ke instansi</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── PENGGUNA TAB ───
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionTitle title="Pengguna" subtitle={`${users.length} total pengguna terdaftar`} />
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Cari nama pengguna..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
      </div>
      {filteredUsers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">Tidak ada pengguna ditemukan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map(u => {
            const rc = {
              admin:     { l: 'Admin', c: 'bg-red-50 text-red-600 border-red-200' },
              moderator: { l: 'Mod',   c: 'bg-blue-50 text-blue-600 border-blue-200' },
              user:      { l: 'User',  c: 'bg-slate-100 text-slate-500 border-slate-200' },
            };
            const role = rc[u.role as keyof typeof rc] ?? rc.user;
            return <UserRow key={u.id} user={u} role={role} onRefresh={() => router.refresh()} />;
          })}
        </div>
      )}
    </div>
  );
}

function UserRow({ user, role, onRefresh }: { user: AdminUser; role: { l: string; c: string }; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [action, setAction]   = useState<string | null>(null);
  const handleRole = async (r: 'user' | 'admin' | 'moderator') => {
    setLoading(true); setAction(r);
    try { await updateUserRole(user.id, r); onRefresh(); } catch (e) { console.error(e); } finally { setLoading(false); setAction(null); }
  };
  const initial = (user.full_name || 'U').charAt(0).toUpperCase();
  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 sm:px-5 flex items-center gap-4 hover:border-slate-300 transition-colors">
      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
        <span className="text-white text-sm font-bold">{initial}</span>
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{user.full_name || 'Tanpa Nama'}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{user.updated_at ? formatDateID(user.updated_at) : '-'}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${role.c}`}>{role.l}</span>
        {user.role !== 'admin' && (
          <button onClick={() => handleRole('admin')} disabled={loading}
            className="text-[11px] px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-semibold disabled:opacity-50 transition-colors">
            {loading && action === 'admin' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Admin'}
          </button>
        )}
        {user.role === 'admin' && (
          <button onClick={() => handleRole('user')} disabled={loading}
            className="text-[11px] px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-500 font-semibold disabled:opacity-50 transition-colors">
            {loading && action === 'user' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cabut'}
          </button>
        )}
        {user.role !== 'moderator' && user.role !== 'admin' && (
          <button onClick={() => handleRole('moderator')} disabled={loading}
            className="text-[11px] px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 font-semibold disabled:opacity-50 transition-colors">
            {loading && action === 'moderator' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mod'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard(props: { stats: Stats; reports: Report[]; users: AdminUser[] }) {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="h-8 w-40 bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    }>
      <DashboardInner {...props} />
    </Suspense>
  );
}