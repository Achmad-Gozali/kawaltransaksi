'use client';

import { useState } from 'react';
import { Loader2, Mail, Calendar, FileBarChart, Ban, ShieldOff } from 'lucide-react';
import { updateUserRole, setBanStatus } from '@/features/admin/actions';
import type { AdminUser } from '@/features/admin/types';

export default function UserRow({ user, onRefresh }: { user: AdminUser; onRefresh: () => void }) {
  const [loading, setLoading]   = useState(false);
  const [action, setAction]     = useState<string | null>(null);

  const handleRole = async (r: 'user' | 'admin') => {
    setLoading(true); setAction(r);
    try { await updateUserRole(user.id, r); onRefresh(); } catch { }
    finally { setLoading(false); setAction(null); }
  };

  const handleBanStatus = async (is_banned: boolean) => {
    setLoading(true); setAction(is_banned ? 'ban' : 'unban');
    try { await setBanStatus(user.id, is_banned); onRefresh(); } catch { }
    finally { setLoading(false); setAction(null); }
  };

  const initial  = (user.full_name || 'U').charAt(0).toUpperCase();
  const isAdmin  = user.role === 'admin';
  const isBanned = user.is_banned;
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  return (
    <div className={`bg-white border rounded-2xl px-4 py-4 sm:px-5 hover:border-slate-300 transition-colors ${isBanned ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isBanned ? 'bg-red-200' : 'bg-slate-900'}`}>
          <span className={`text-sm font-bold ${isBanned ? 'text-red-700' : 'text-white'}`}>{initial}</span>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm font-semibold truncate ${isBanned ? 'text-red-700 line-through' : 'text-slate-900'}`}>
              {user.full_name || 'Tanpa Nama'}
            </p>
            {isAdmin && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold border bg-red-50 text-red-600 border-red-200">Admin</span>
            )}
            {isBanned && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold border bg-red-100 text-red-700 border-red-300">Banned</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
            {user.email && (
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <Mail className="w-3 h-3 shrink-0" /> {user.email}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" /> {joinDate}
            </span>
            <span className="flex items-center gap-1">
              <FileBarChart className="w-3 h-3 shrink-0" /> {user.report_count} laporan
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && (
            <button onClick={() => handleRole('user')} disabled={loading}
              className="text-[11px] px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-500 font-semibold disabled:opacity-50 transition-colors">
              {loading && action === 'user' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cabut'}
            </button>
          )}
          {!isAdmin && !isBanned && (
            <button onClick={() => handleRole('admin')} disabled={loading}
              className="text-[11px] px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-semibold disabled:opacity-50 transition-colors">
              {loading && action === 'admin' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Admin'}
            </button>
          )}
          {!isAdmin && !isBanned && (
            <button onClick={() => handleBanStatus(true)} disabled={loading}
              className="text-[11px] px-3 py-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:text-red-700 font-semibold disabled:opacity-50 transition-colors flex items-center gap-1">
              {loading && action === 'ban' ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Ban className="w-3 h-3" /> Ban</>}
            </button>
          )}
          {!isAdmin && isBanned && (
            <button onClick={() => handleBanStatus(false)} disabled={loading}
              className="text-[11px] px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 font-semibold disabled:opacity-50 transition-colors flex items-center gap-1">
              {loading && action === 'unban' ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ShieldOff className="w-3 h-3" /> Unban</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}