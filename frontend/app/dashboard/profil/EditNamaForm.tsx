'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Loader2, CheckCircle2, AlertCircle, Pencil, X } from 'lucide-react';

export default function EditNamaForm({ currentName }: { currentName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentName) return;
    if (name.trim().length < 2) { setError('Nama minimal 2 karakter.'); return; }
    if (name.trim().length > 100) { setError('Nama maksimal 100 karakter.'); return; }

    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      if (error) { setError('Gagal memperbarui nama. Coba lagi.'); return; }
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => { setSuccess(false); window.location.reload(); }, 1500);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
            <Pencil className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Edit Nama</p>
            <p className="text-sm font-semibold text-zinc-900 mt-0.5">{name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {success && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          <button onClick={() => { setIsEditing(true); setError(null); }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-50">
            Ubah
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
          <Pencil className="w-4 h-4 text-emerald-500" />
        </div>
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Edit Nama</p>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs font-medium text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap"
          className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
          autoFocus
          maxLength={100}
        />
        <button type="submit" disabled={isLoading || !name.trim() || name.trim() === currentName}
          className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Simpan
        </button>
        <button type="button" onClick={() => { setIsEditing(false); setName(currentName); setError(null); }}
          className="p-2.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">
          <X className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}