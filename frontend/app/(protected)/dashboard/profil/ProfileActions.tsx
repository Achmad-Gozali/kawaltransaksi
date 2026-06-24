'use client';

import { useState } from 'react';
import { createClient } from '@/core/supabase/browser';
import { Loader2, CheckCircle2, AlertCircle, Pencil, X, Lock } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8787';

function EditNama({ currentName }: { currentName: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) return;
    if (trimmed.length < 2) return setError('Nama minimal 2 karakter.');
    if (trimmed.length > 100) return setError('Nama maksimal 100 karakter.');

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
      if (error) return setError('Gagal memperbarui nama.');
      setSuccess(true);
      setEditing(false);
      setTimeout(() => { setSuccess(false); window.location.reload(); }, 1500);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => { setEditing(false); setName(currentName); setError(null); };

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <Pencil className="w-4 h-4 text-zinc-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-zinc-400">Nama</p>
            <p className="text-sm font-medium text-zinc-900 truncate">{name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {success && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          <button
            onClick={() => { setEditing(true); setError(null); }}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Ubah
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3.5 space-y-3">
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap"
          autoFocus
          maxLength={100}
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={loading || !name.trim() || name.trim() === currentName}
          className="px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan'}
        </button>
        <button type="button" onClick={cancel} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function GantiPassword({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.message || 'Gagal mengirim email.');
      setSent(true);
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-zinc-400">Password</p>
          {sent
            ? <p className="text-xs font-medium text-emerald-600">Email terkirim — cek inbox kamu.</p>
            : error
              ? <p className="text-xs font-medium text-red-500 truncate">{error}</p>
              : <p className="text-sm font-medium text-zinc-900">Reset via email</p>
          }
        </div>
      </div>
      {sent
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-3" />
        : (
          <button
            onClick={handleClick}
            disabled={loading}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0 ml-3"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Kirim'}
          </button>
        )
      }
    </div>
  );
}

export default function ProfileActions({
  currentName,
  email,
  provider,
}: {
  currentName: string;
  email: string;
  provider: string;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl px-5 divide-y divide-zinc-100">
      <EditNama currentName={currentName} />
      {provider === 'email' ? (
        <GantiPassword email={email} />
      ) : (
        <div className="flex items-center gap-3 py-3.5">
          <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
          <div>
            <p className="text-xs text-zinc-400">Password</p>
            <p className="text-sm font-medium text-zinc-500">
              Dikelola oleh {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}