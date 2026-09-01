'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import {
  Search, ChevronDown, CheckCircle, XCircle, Eye, Mail, MoreHorizontal,
  FileText, Clock, ShieldCheck, XOctagon, Landmark, CreditCard, Smartphone, QrCode,
  SlidersHorizontal, ChevronLeft, ChevronRight, X, Trash2, AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';
import { authClient } from '@/core/auth/client';
import type { Report } from '@/features/admin/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const PER_PAGE = 10;

const STATUS_MAP: Record<string, { label: string; className: string; dot: string }> = {
  pending:  { label: 'Pending',       className: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
  verified: { label: 'Terverifikasi', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak',       className: 'bg-red-50 text-red-600 border-red-200',             dot: 'bg-red-500'     },
};

const TYPE_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  phone:        { label: 'Nomor HP',      icon: Smartphone },
  bank_account: { label: 'Rekening Bank', icon: Landmark    },
  ewallet:      { label: 'E-Wallet',      icon: CreditCard  },
  qris:         { label: 'QRIS',          icon: QrCode      },
};

const CATEGORY_PALETTE = [
  'bg-violet-50 text-violet-700 border-violet-200', 'bg-sky-50 text-sky-700 border-sky-200',
  'bg-rose-50 text-rose-700 border-rose-200', 'bg-amber-50 text-amber-700 border-amber-200',
  'bg-teal-50 text-teal-700 border-teal-200', 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', 'bg-orange-50 text-orange-700 border-orange-200',
];
const categoryClass = (cat: string) => {
  let hash = 0;
  for (const ch of cat) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
};

const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };
const fmtRp   = (n?: number | null) => n ? `Rp${n.toLocaleString('id-ID')}` : '—';
const gf = <T,>(r: Report, camel: keyof Report, snake: keyof Report): T | null | undefined => (r[camel] ?? r[snake]) as T | null | undefined;

async function authFetch(url: string, token: string, opts: RequestInit = {}) {
  const t = authClient.getToken() ?? token;
  return fetch(url, { ...opts, headers: { ...(opts.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${t}`, ...opts.headers } });
}

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub }: { icon: React.ElementType; iconBg: string; iconColor: string; label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}><Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.25} /></div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-900 tabular-nums leading-tight">{value}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function ActionMenu({ report, loading, onVerify, onReject, onDetail, onDeleteClick }: { report: Report; loading: boolean; onVerify: () => void; onReject: () => void; onDetail: () => void; onDeleteClick: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const items = [
    { show: true, label: 'Lihat Detail', icon: Eye, cls: 'text-slate-700 hover:bg-slate-50', act: onDetail },
    { show: report.status === 'pending', label: 'Verifikasi', icon: CheckCircle, cls: 'text-emerald-700 hover:bg-emerald-50', act: onVerify, disabled: loading },
    { show: report.status === 'pending', label: 'Tolak', icon: XCircle, cls: 'text-red-600 hover:bg-red-50', act: onReject, disabled: loading },
    { show: true, label: 'Hapus Laporan', icon: Trash2, cls: 'text-red-700 hover:bg-red-50', act: onDeleteClick, divider: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20">
          {items.filter(i => i.show).map(({ label, icon: Icon, cls, act, disabled, divider }) => (
            <div key={label}>
              {divider && <div className="border-t border-slate-100 my-1" />}
              <button onClick={() => { act(); setOpen(false); }} disabled={disabled}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${cls}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DETAIL_FIELDS = (r: Report) => {
  const targetType = gf<string>(r, 'targetType', 'target_type') ?? '';
  const bankName   = gf<string>(r, 'bankName', 'bank_name');
  const walletName = gf<string>(r, 'walletName', 'wallet_name');
  const hasVictims = gf<string>(r, 'hasOtherVictims', 'has_other_victims');
  return [
    { label: 'Tipe', value: TYPE_MAP[targetType]?.label ?? targetType },
    { label: 'Kategori', value: r.category ?? '—' },
    { label: 'Tanggal', value: fmtDate(gf<string>(r, 'createdAt', 'created_at') ?? '') },
    { label: 'Nama Pemilik', value: gf<string>(r, 'targetName', 'target_name') },
    { label: 'Bank / E-Wallet', value: bankName ?? walletName },
    { label: 'Kerugian', value: r.amount ? fmtRp(r.amount) : null, cls: 'text-red-600' },
    { label: 'Platform', value: r.platform },
    { label: 'Nama Toko', value: gf<string>(r, 'storeName', 'store_name') },
    { label: 'Provinsi', value: gf<string>(r, 'suspectCity', 'suspect_city') },
    { label: 'Korban Lain', value: hasVictims ? (hasVictims === 'yes' ? 'Ya' : 'Hanya pelapor') : null },
  ].filter(f => f.value);
};

function TagList({ title, items }: { title: string; items?: string[] | null }) {
  const list = (items ?? []).filter(Boolean);
  if (!list.length) return null;
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {list.map((v, i) => <span key={i} className="text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full text-slate-700">{v}</span>)}
      </div>
    </div>
  );
}

function ImageGrid({ title, urls, size = 'w-20 h-20', linked }: { title: string; urls: string[]; size?: string; linked?: boolean }) {
  if (!urls.length) return null;
  const Wrap = linked ? 'a' : 'div';
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">{title}{linked ? ` (${urls.length})` : ''}</p>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <Wrap key={i} {...(linked ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={`relative ${size} rounded-lg overflow-hidden border border-slate-200 group ${linked ? 'hover:border-emerald-400 transition-colors' : ''}`}>
            <Image src={url} alt={`${title} ${i + 1}`} fill className="object-cover" unoptimized />
            {linked && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center"><Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div>}
          </Wrap>
        ))}
      </div>
    </div>
  );
}

function DetailModal({ report, onClose, onVerify, onReject, loading }: { report: Report; onClose: () => void; onVerify: () => void; onReject: () => void; loading: boolean }) {
  const targetValue  = gf<string>(report, 'targetValue', 'target_value') ?? '';
  const suspectPhoto = gf<string>(report, 'suspectPhotoUrl', 'suspect_photo_url');
  const evidenceUrls = gf<string[]>(report, 'evidenceUrls', 'evidence_urls') ?? [];
  const chronology   = report.chronology ?? report.description ?? null;
  const userEmail = (report as any).user_email ?? null;
  const userName  = (report as any).user_name  ?? null;
  const status    = STATUS_MAP[report.status] ?? STATUS_MAP.pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-900 font-mono break-all">{targetValue}</p>
            <span className={`inline-flex mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.className}`}>{status.label}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {(userEmail || userName) && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-slate-500">{userName?.[0]?.toUpperCase() ?? '?'}</span>
              </div>
              <div><p className="text-xs font-semibold text-slate-800">{userName ?? '—'}</p><p className="text-[11px] text-slate-400">{userEmail ?? '—'}</p></div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            {DETAIL_FIELDS(report).map(({ label, value, cls }) => (
              <div key={label}>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`font-semibold text-slate-800 break-words ${cls ?? ''}`}>{value}</p>
              </div>
            ))}
          </div>

          <TagList title="Akun Media Sosial" items={gf<string[]>(report, 'socialMediaAccounts', 'social_media_accounts')} />
          <TagList title="Sudah Lapor Ke" items={gf<string[]>(report, 'reportedTo', 'reported_to')} />

          {chronology && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">Kronologi</p>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words bg-slate-50 border border-slate-200 rounded-xl p-3">{chronology}</p>
            </div>
          )}

          {suspectPhoto && <ImageGrid title="Foto Profil Penipu" urls={[suspectPhoto]} />}
          <ImageGrid title="Bukti" urls={evidenceUrls} linked />
        </div>

        {report.status === 'pending' && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-3 flex gap-2">
            <button onClick={onVerify} disabled={loading} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40">
              <CheckCircle className="w-3.5 h-3.5" /> Verifikasi
            </button>
            <button onClick={onReject} disabled={loading} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40">
              <XCircle className="w-3.5 h-3.5" /> Tolak
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ report, onClose, onConfirm, loading }: { report: Report; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  const targetValue = gf<string>(report, 'targetValue', 'target_value') ?? '';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center mb-3"><AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={2.25} /></div>
        <p className="text-sm font-black text-slate-900">Hapus laporan ini?</p>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Laporan dengan nomor <span className="font-mono font-semibold text-slate-700">{targetValue}</span> beserta semua bukti yang terlampir akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-40">Batal</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40">
            {loading ? 'Menghapus...' : <><Trash2 className="w-3.5 h-3.5" /> Hapus</>}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props { reports: Report[]; token: string; initialSearch?: string; }

export default function LaporanTab({ reports: initial, token, initialSearch = '' }: Props) {
  const [reports, setReports]         = useState<Report[]>(initial);
  const [search, setSearch]           = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [loading, setLoading]         = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage]               = useState(1);

  const filtered = useMemo(() => reports.filter(r => {
    const val   = gf<string>(r, 'targetValue', 'target_value') ?? '';
    const email = (r as any).user_email ?? '';
    const type  = gf<string>(r, 'targetType', 'target_type') ?? '';
    const q     = search.toLowerCase();
    return (val.toLowerCase().includes(q) || (r.category ?? '').toLowerCase().includes(q) || email.toLowerCase().includes(q))
      && (!statusFilter || r.status === statusFilter)
      && (!typeFilter || type === typeFilter);
  }), [reports, search, statusFilter, typeFilter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated   = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const counts = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    verified: reports.filter(r => r.status === 'verified').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  }), [reports]);

  const pendingSelectedIds = Array.from(selected).filter(id => reports.find(x => x.id === id)?.status === 'pending');

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    const ids = paginated.map(r => r.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const updateStatus = async (id: string, status: 'verified' | 'rejected') => {
    setLoading(id);
    try {
      const res = await authFetch(`${API_URL}/api/admin/reports/${id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status }) });
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        if (detailReport?.id === id) setDetailReport(prev => prev ? { ...prev, status } : prev);
      }
    } finally { setLoading(null); }
  };

  const bulkUpdateStatus = async (status: 'verified' | 'rejected') => {
    setBulkLoading(true);
    try {
      const ids = pendingSelectedIds;
      await Promise.all(ids.map(id => authFetch(`${API_URL}/api/admin/reports/${id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status }) })));
      setReports(prev => prev.map(r => ids.includes(r.id) ? { ...r, status } : r));
      clearSelection();
    } finally { setBulkLoading(false); }
  };

  const deleteReport = async (id: string) => {
    setDeleteLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/admin/reports/${id}`, token, { method: 'DELETE' });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id));
        setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
        setDeleteTarget(null);
        if (detailReport?.id === id) setDetailReport(null);
      }
    } finally { setDeleteLoading(false); }
  };

  const pageAllSelected = paginated.length > 0 && paginated.every(r => selected.has(r.id));

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
    .reduce<(number | 'ellipsis')[]>((acc, n, idx, arr) => {
      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="space-y-4">
      <div className="relative bg-white border border-slate-200 rounded-2xl px-6 py-5 overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-slate-900">Laporan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola dan verifikasi laporan dari pengguna</p>
        </div>
        <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50">
          <FileText className="w-8 h-8 text-emerald-500" strokeWidth={1.75} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nomor, kategori, atau email..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors" />
        </div>
        {[
          { value: statusFilter, set: setStatusFilter, opts: [['', 'Semua status'], ['pending', 'Pending'], ['verified', 'Terverifikasi'], ['rejected', 'Ditolak']] },
          { value: typeFilter, set: setTypeFilter, opts: [['', 'Semua tipe'], ['phone', 'Nomor HP'], ['bank_account', 'Rekening Bank'], ['ewallet', 'E-Wallet'], ['qris', 'QRIS']] },
        ].map(({ value, set, opts }, i) => (
          <div className="relative" key={i}>
            <select value={value} onChange={e => { set(e.target.value); setPage(1); }}
              className="appearance-none pl-3.5 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 transition-colors cursor-pointer">
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        ))}
        <button className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100 transition-colors shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={FileText} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Total Laporan" value={counts.total} sub="Semua laporan masuk" />
        <SummaryCard icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" label="Menunggu Verifikasi" value={counts.pending} sub="Belum diverifikasi" />
        <SummaryCard icon={ShieldCheck} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Terverifikasi" value={counts.verified} sub="Telah diverifikasi" />
        <SummaryCard icon={XOctagon} iconBg="bg-rose-50" iconColor="text-rose-600" label="Ditolak" value={counts.rejected} sub="Laporan ditolak" />
      </div>

      {selected.size > 0 && (
        <div className="bg-slate-100 rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>{selected.size} laporan dipilih</span>
          {pendingSelectedIds.length < selected.size && <span className="text-xs text-slate-400">({pendingSelectedIds.length} pending yang bisa diproses)</span>}
          <div className="ml-auto flex flex-wrap gap-2">
            <button onClick={() => bulkUpdateStatus('verified')} disabled={bulkLoading || !pendingSelectedIds.length} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40">
              <CheckCircle className="w-3.5 h-3.5" /> Verifikasi semua
            </button>
            <button onClick={() => bulkUpdateStatus('rejected')} disabled={bulkLoading || !pendingSelectedIds.length} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40">
              <XCircle className="w-3.5 h-3.5" /> Tolak semua
            </button>
            <button onClick={clearSelection} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">Batal</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 w-10"><input type="checkbox" checked={pageAllSelected} onChange={toggleSelectAll} className="w-4 h-4 accent-emerald-600" /></th>
                {['Nomor', 'Tipe'].map(h => <th key={h} className="px-4 py-3 font-bold text-slate-700 text-xs">{h}</th>)}
                <th className="px-4 py-3 font-bold text-slate-700 text-xs hidden md:table-cell">Kategori</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-xs hidden lg:table-cell">Pelapor</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-xs hidden sm:table-cell">Tanggal</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-xs">Status</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!paginated.length ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">Laporan tidak ditemukan.</td></tr>
              ) : paginated.map(r => {
                const isSelected  = selected.has(r.id);
                const status      = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
                const targetType  = gf<string>(r, 'targetType', 'target_type') ?? '';
                const typeMeta    = TYPE_MAP[targetType];
                const TypeIcon    = typeMeta?.icon ?? Smartphone;
                const userEmail   = (r as any).user_email ?? null;

                return (
                  <tr key={r.id} className={`hover:bg-slate-50/60 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                    <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(r.id)} className="w-4 h-4 accent-emerald-600" /></td>
                    <td className="px-4 py-3"><p className="font-bold text-slate-900 font-mono text-xs">{gf<string>(r, 'targetValue', 'target_value')}</p></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5 text-xs text-slate-600"><TypeIcon className="w-3.5 h-3.5 text-slate-400" />{typeMeta?.label ?? targetType}</div></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {r.category ? <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${categoryClass(r.category)}`}>{r.category}</span> : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="flex items-center gap-1 text-xs text-slate-500"><Mail className="w-3 h-3 text-slate-400 shrink-0" /><span className="truncate max-w-[160px]">{userEmail ?? '—'}</span></div></td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{fmtDate(gf<string>(r, 'createdAt', 'created_at') ?? '')}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${status.className}`}><span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{status.label}</span></td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu report={r} loading={loading === r.id} onVerify={() => updateStatus(r.id, 'verified')} onReject={() => updateStatus(r.id, 'rejected')} onDetail={() => setDetailReport(r)} onDeleteClick={() => setDeleteTarget(r)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Menampilkan {(currentPage - 1) * PER_PAGE + 1} - {Math.min(currentPage * PER_PAGE, filtered.length)} dari {filtered.length} laporan</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
              {pageNumbers.map((n, i) => n === 'ellipsis'
                ? <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-slate-400">…</span>
                : <button key={n} onClick={() => setPage(n)} className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${n === currentPage ? 'bg-emerald-600 text-white' : 'text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{n}</button>
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {detailReport && <DetailModal report={detailReport} onClose={() => setDetailReport(null)} loading={loading === detailReport.id} onVerify={() => updateStatus(detailReport.id, 'verified')} onReject={() => updateStatus(detailReport.id, 'rejected')} />}
      {deleteTarget && <ConfirmDeleteModal report={deleteTarget} loading={deleteLoading} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteReport(deleteTarget.id)} />}
    </div>
  );
}