'use client';

import { useState } from 'react';
import { Search, Shield, ShieldOff, User, Crown } from 'lucide-react';
import type { AdminUser } from '@/features/admin/types';
import { formatDateID } from '@/core/utils';
import { authClient } from '@/core/auth/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function PenggunaTab({ users: initial }: { users: AdminUser[] }) {
  const [users, setUsers]     = useState(initial);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount  = users.filter(u => u.role === 'user').length;

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setLoading(id);
    try {
      const token = authClient.getToken();
      const res = await fetch(`${API_URL}/api/admin/users/${id}/role`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ role: newRole }),
      });
      if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats mini */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Pengguna', value: users.length,  color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Admin',          value: adminCount,    color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'User',           value: userCount,     color: 'text-slate-700',  bg: 'bg-slate-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border border-slate-200 rounded-xl px-4 py-3`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-10 text-center text-sm text-slate-400">
            Tidak ada pengguna ditemukan.
          </div>
        ) : filtered.map(u => (
          <div key={u.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-slate-300 transition-colors">
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
              u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {u.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                {u.role === 'admin' && <Crown className="w-3 h-3 text-purple-500 shrink-0" />}
              </div>
              <p className="text-xs text-slate-400 truncate">{u.email}</p>
            </div>

            {/* Role badge */}
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 hidden sm:inline-flex items-center gap-1 ${
              u.role === 'admin'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {u.role === 'admin' ? <><Shield className="w-2.5 h-2.5" /> Admin</> : <><User className="w-2.5 h-2.5" /> User</>}
            </span>

            {/* Tanggal */}
            <p className="text-[10px] text-slate-400 shrink-0 hidden md:block">{formatDateID(u.createdAt)}</p>

            {/* Action */}
            <button
              onClick={() => toggleRole(u.id, u.role)}
              disabled={loading === u.id}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all disabled:opacity-40 ${
                u.role === 'admin'
                  ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
              }`}
            >
              {loading === u.id ? '...' : u.role === 'admin'
                ? <><ShieldOff className="w-3 h-3" /> Jadikan User</>
                : <><Shield className="w-3 h-3" /> Jadikan Admin</>
              }
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}