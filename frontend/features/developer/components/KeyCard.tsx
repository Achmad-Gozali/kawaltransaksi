'use client';

import { useState } from 'react';
import { Trash2, RotateCcw, Pencil, Clock, Copy, Check, X, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export interface ApiKey {
  id: string;
  name: string;
  key?: string;           // hanya ada saat baru generate/regenerate
  key_prefix?: string;    // 12 char pertama untuk display
  show_once?: boolean;
  environment?: string;   // live | test
  requests_today: number;
  requests_total: number;
  daily_limit: number;
  last_used_at: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Belum pernah';
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
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatExpiry(expiresAt: string | null): { label: string; isExpired: boolean; isSoon: boolean } {
  if (!expiresAt) return { label: 'Tidak ada kadaluarsa', isExpired: false, isSoon: false };
  const date = new Date(expiresAt);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Sudah kadaluarsa', isExpired: true, isSoon: false };
  if (diffDays <= 7) return { label: `Kadaluarsa ${diffDays} hari lagi`, isExpired: false, isSoon: true };
  return {
    label: `Exp: ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    isExpired: false,
    isSoon: false,
  };
}

export function KeyCard({ k, token, onDelete, onRename, onRegenerate }: {
  k: ApiKey;
  token: string;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRegenerate: (id: string, newKey: string) => void;
}) {
  const [isEditing, setIsEditing]       = useState(false);
  const [editName, setEditName]         = useState(k.name);
  const [renaming, setRenaming]         = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting]         = useState(false);

  const expiry = formatExpiry(k.expires_at);

  const handleRename = async () => {
    if (!editName.trim() || editName === k.name) { setIsEditing(false); return; }
    setRenaming(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/developer/keys/${k.id}/rename`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (data.success) { onRename(k.id, editName.trim()); setIsEditing(false); }
    } finally { setRenaming(false); }
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerate akan membuat key baru dan invalidate key lama. Lanjut?')) return;
    setRegenerating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/developer/keys/${k.id}/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.key) onRegenerate(k.id, data.data.key);
    } finally { setRegenerating(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin hapus API key ini? Tidak bisa dibatalkan.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/developer/keys/${k.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if ((await res.json()).success) onDelete(k.id);
    } finally { setDeleting(false); }
  };

  return (
    <div className={`bg-slate-50 rounded-xl border overflow-hidden ${expiry.isExpired ? 'border-red-200' : 'border-slate-200'}`}>
      {/* Header */}
      <div className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between gap-3 ${expiry.isExpired ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                autoFocus value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
                maxLength={50}
                className="flex-1 px-2 py-1 text-sm font-bold border border-emerald-400 rounded-lg focus:outline-none bg-white"
              />
              <button onClick={handleRename} disabled={renaming}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 bg-emerald-50 rounded-lg transition-colors">
                {renaming ? '...' : 'Simpan'}
              </button>
              <button onClick={() => setIsEditing(false)} className="text-xs text-slate-400 hover:text-slate-600">Batal</button>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-900 truncate">{k.name}</p>
              <button onClick={() => setIsEditing(true)} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            k.environment === 'test'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {k.environment ?? 'live'}
          </span>
          {expiry.isExpired
            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">Kadaluarsa</span>
            : <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${k.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {k.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
          }
          <button onClick={handleRegenerate} disabled={regenerating} title="Regenerate key baru"
            className="w-7 h-7 bg-white text-slate-400 hover:bg-amber-50 hover:text-amber-500 rounded-lg flex items-center justify-center transition-colors border border-slate-200">
            <RotateCcw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleDelete} disabled={deleting} title="Hapus key"
            className="w-7 h-7 bg-white text-red-400 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors border border-slate-200">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 py-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2.5 mb-3">
          <code className="flex-1 text-xs sm:text-sm font-mono text-slate-500 truncate">
            {k.key_prefix
            ? `${k.key_prefix.slice(0, 8)}${'•'.repeat(12)}${k.key_prefix.slice(-4)}`
            : `kt_${'•'.repeat(12)}xxxx`}
          </code>
          <span className="text-[10px] text-slate-400 shrink-0 font-medium">Tersimpan</span>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Terakhir dipakai: {formatRelative(k.last_used_at)}</span>
          </div>
          {k.expires_at && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              expiry.isExpired ? 'bg-red-50 text-red-600' :
              expiry.isSoon ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {expiry.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'Req Hari Ini',  value: `${k.requests_today} / ${k.daily_limit}` },
            { label: 'Total Req',     value: k.requests_total.toLocaleString('id-ID') },
            { label: 'Sisa Hari Ini', value: Math.max(0, k.daily_limit - k.requests_today) },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-base font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
          <div
            className={`h-full rounded-full transition-all ${k.requests_today >= k.daily_limit ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, (k.requests_today / k.daily_limit) * 100)}%` }}
          />
        </div>

        <p className="text-xs text-slate-400 mt-2.5">
          Dibuat {new Date(k.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

export function KeyRevealModal({ apiKey, onClose }: { apiKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-base font-black text-slate-900">Simpan API Key Anda</p>
            <p className="text-sm text-slate-500 mt-1">Key ini hanya ditampilkan sekali. Salin dan simpan sekarang.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 leading-relaxed">
            Setelah menutup modal ini, key tidak bisa dilihat lagi. Kalau hilang, gunakan tombol <strong>Regenerate</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-4 py-3 mb-4">
          <code className="flex-1 text-sm font-mono text-emerald-400 break-all">{apiKey}</code>
          <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors shrink-0 ml-2">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          {copied
            ? <><Check className="w-4 h-4 text-emerald-400" /> Tersalin!</>
            : <><Copy className="w-4 h-4" /> Salin API Key</>}
        </button>

        <button onClick={onClose} className="w-full mt-2 py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          Sudah disimpan, tutup
        </button>
      </div>
    </div>
  );
}