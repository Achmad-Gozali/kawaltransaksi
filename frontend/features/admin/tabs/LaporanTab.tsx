'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, CheckCircle, XCircle, Eye, Mail } from 'lucide-react';
import Image from 'next/image';
import { authClient } from '@/core/auth/client';
import type { Report } from '@/features/admin/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending:  { label: 'Pending',       className: 'bg-amber-50 text-amber-700 border-amber-200'     },
  verified: { label: 'Terverifikasi', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Ditolak',       className: 'bg-red-50 text-red-600 border-red-200'           },
};

const TYPE_MAP: Record<string, string> = {
  phone:        'Nomor HP',
  bank_account: 'Rekening Bank',
  ewallet:      'E-Wallet',
};

function formatDateID(d: string) {
  try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function formatRupiah(n: number | null | undefined) {
  if (!n) return '—';
  return `Rp${n.toLocaleString('id-ID')}`;
}

function getField<T>(r: Report, camel: keyof Report, snake: keyof Report): T | null | undefined {
  return (r[camel] ?? r[snake]) as T | null | undefined;
}

interface Props { reports: Report[]; token: string; initialSearch?: string; }

export default function ReportsTab({ reports: initial, token, initialSearch = '' }: Props) {
  const [reports, setReports]         = useState<Report[]>(initial);
  const [search, setSearch]           = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [loading, setLoading]         = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [selected, setSelected]       = useState<Set<string>>(new Set());

  const filtered = reports.filter(r => {
    const val       = (getField(r, 'targetValue', 'target_value') as string) ?? '';
    const type      = (getField(r, 'targetType',  'target_type')  as string) ?? '';
    const cat       = r.category ?? '';
    const userEmail = (r as any).user_email ?? '';
    const q         = search.toLowerCase();
    const matchesQ      = val.toLowerCase().includes(q) || cat.toLowerCase().includes(q) || userEmail.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesType   = !typeFilter || type === typeFilter;
    return matchesQ && matchesStatus && matchesType;
  });

  const pendingSelectedIds = Array.from(selected).filter(id => {
    const r = reports.find(x => x.id === id);
    return r?.status === 'pending';
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const updateStatus = async (id: string, status: 'verified' | 'rejected') => {
    setLoading(id);
    try {
      const t = authClient.getToken() ?? token;
      const res = await fetch(`${API_URL}/api/admin/reports/${id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body:    JSON.stringify({ status }),
      });
      if (res.ok) setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } finally {
      setLoading(null);
    }
  };

  const bulkUpdateStatus = async (status: 'verified' | 'rejected') => {
    setBulkLoading(true);
    try {
      const t = authClient.getToken() ?? token;
      const ids = pendingSelectedIds;
      await Promise.all(ids.map(id =>
        fetch(`${API_URL}/api/admin/reports/${id}/status`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
          body:    JSON.stringify({ status }),
        })
      ));
      setReports(prev => prev.map(r => ids.includes(r.id) ? { ...r, status } : r));
      clearSelection();
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nomor, kategori, atau email..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-400 text-slate-700"
        >
          <option value="">Semua status</option>
          <option value="pending">Pending</option>
          <option value="verified">Terverifikasi</option>
          <option value="rejected">Ditolak</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-400 text-slate-700"
        >
          <option value="">Semua tipe</option>
          <option value="phone">Nomor HP</option>
          <option value="bank_account">Rekening Bank</option>
          <option value="ewallet">E-Wallet</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-slate-600">
          <span>{selected.size} laporan dipilih</span>
          {pendingSelectedIds.length < selected.size && (
            <span className="text-xs text-slate-400">({pendingSelectedIds.length} pending yang bisa diproses)</span>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => bulkUpdateStatus('verified')}
              disabled={bulkLoading || pendingSelectedIds.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Verifikasi semua
            </button>
            <button
              onClick={() => bulkUpdateStatus('rejected')}
              disabled={bulkLoading || pendingSelectedIds.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40"
            >
              <XCircle className="w-3.5 h-3.5" /> Tolak semua
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-slate-400">Tidak ada laporan ditemukan.</div>
        )}
        {filtered.map(r => {
          const isExpanded   = expanded === r.id;
          const isSelected   = selected.has(r.id);
          const status       = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
          const targetValue  = (getField(r, 'targetValue',         'target_value')          as string)   ?? '';
          const targetType   = (getField(r, 'targetType',          'target_type')           as string)   ?? '';
          const targetName   = (getField(r, 'targetName',          'target_name')           as string)   ?? null;
          const bankName     = (getField(r, 'bankName',            'bank_name')             as string)   ?? null;
          const walletName   = (getField(r, 'walletName',          'wallet_name')           as string)   ?? null;
          const createdAt    = (getField(r, 'createdAt',           'created_at')            as string)   ?? '';
          const suspectPhoto = (getField(r, 'suspectPhotoUrl',     'suspect_photo_url')     as string)   ?? null;
          const storeName    = (getField(r, 'storeName',           'store_name')            as string)   ?? null;
          const suspectCity  = (getField(r, 'suspectCity',         'suspect_city')          as string)   ?? null;
          const socialMedia  = (getField(r, 'socialMediaAccounts', 'social_media_accounts') as string[]) ?? [];
          const reportedTo   = (getField(r, 'reportedTo',          'reported_to')           as string[]) ?? [];
          const hasVictims   = (getField(r, 'hasOtherVictims',     'has_other_victims')     as string)   ?? null;
          const evidenceUrls = (getField(r, 'evidenceUrls',        'evidence_urls')         as string[]) ?? [];
          const chronology   = r.chronology ?? r.description ?? null;
          const userEmail    = (r as any).user_email ?? null;
          const userName     = (r as any).user_name  ?? null;

          return (
            <div key={r.id} className={`bg-white border rounded-lg overflow-hidden transition-colors ${isSelected ? 'border-emerald-300' : 'border-slate-200'}`}>
              {/* Row utama */}
              <div className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(r.id)}
                  className="shrink-0 w-4 h-4 accent-emerald-600"
                />
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Nomor</p>
                    <p className="font-bold text-slate-900 font-mono truncate">{targetValue}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Tipe</p>
                    <p className="text-slate-600">{TYPE_MAP[targetType] ?? targetType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Kategori</p>
                    <p className="text-slate-600 truncate">{r.category ?? '—'}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Pelapor</p>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <p className="text-slate-600 truncate text-[11px]">{userEmail ?? '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Tanggal</p>
                    <p className="text-slate-500">{formatDateID(createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.className}`}>
                    {status.label}
                  </span>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : r.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(r.id, 'verified')} disabled={loading === r.id}
                        className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-40" title="Verifikasi">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => updateStatus(r.id, 'rejected')} disabled={loading === r.id}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40" title="Tolak">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Detail expand */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-4 bg-slate-50 space-y-4">

                  {/* Info pelapor */}
                  {(userEmail || userName) && (
                    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-slate-500">
                          {userName ? userName[0].toUpperCase() : '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{userName ?? '—'}</p>
                        <p className="text-[11px] text-slate-400">{userEmail ?? '—'}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    {targetName && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Nama Pemilik</p>
                        <p className="font-semibold text-slate-800">{targetName}</p>
                      </div>
                    )}
                    {(bankName || walletName) && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Bank / E-Wallet</p>
                        <p className="font-semibold text-slate-800">{bankName ?? walletName}</p>
                      </div>
                    )}
                    {r.amount && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Kerugian</p>
                        <p className="font-semibold text-red-600">{formatRupiah(r.amount)}</p>
                      </div>
                    )}
                    {r.platform && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Platform</p>
                        <p className="font-semibold text-slate-800">{r.platform}</p>
                      </div>
                    )}
                    {storeName && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Nama Toko</p>
                        <p className="font-semibold text-slate-800">{storeName}</p>
                      </div>
                    )}
                    {suspectCity && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Provinsi</p>
                        <p className="font-semibold text-slate-800">{suspectCity}</p>
                      </div>
                    )}
                    {hasVictims && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Korban Lain</p>
                        <p className="font-semibold text-slate-800">{hasVictims === 'yes' ? 'Ya' : 'Hanya pelapor'}</p>
                      </div>
                    )}
                  </div>

                  {socialMedia.filter(Boolean).length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">Akun Media Sosial</p>
                      <div className="flex flex-wrap gap-1.5">
                        {socialMedia.filter(Boolean).map((acc, i) => (
                          <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-700">{acc}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {reportedTo.filter(Boolean).length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">Sudah Lapor Ke</p>
                      <div className="flex flex-wrap gap-1.5">
                        {reportedTo.filter(Boolean).map((to, i) => (
                          <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-700">{to}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {chronology && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">Kronologi</p>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-white border border-slate-200 rounded-lg p-3">
                        {chronology}
                      </p>
                    </div>
                  )}

                  {suspectPhoto && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">Foto Profil Penipu</p>
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                        <Image src={`${API_URL}${suspectPhoto}`} alt="Foto penipu" fill className="object-cover" unoptimized />
                      </div>
                    </div>
                  )}

                  {evidenceUrls.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">Bukti ({evidenceUrls.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {evidenceUrls.map((url, i) => (
                          <a key={i} href={`${API_URL}${url}`} target="_blank" rel="noopener noreferrer"
                            className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-400 transition-colors group">
                            <Image src={`${API_URL}${url}`} alt={`Bukti ${i + 1}`} fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => updateStatus(r.id, 'verified')} disabled={loading === r.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40">
                        <CheckCircle className="w-3.5 h-3.5" /> Verifikasi
                      </button>
                      <button onClick={() => updateStatus(r.id, 'rejected')} disabled={loading === r.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40">
                        <XCircle className="w-3.5 h-3.5" /> Tolak
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}