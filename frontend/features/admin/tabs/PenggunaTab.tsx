'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users } from 'lucide-react';
import SectionTitle from '@/features/admin/components/SectionTitle';
import UserRow from '@/features/admin/components/UserRow';
import type { AdminUser } from '@/features/admin/types';

export default function PenggunaTab({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [userSearch, setUserSearch] = useState('');

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionTitle
        title="Pengguna"
        subtitle={`${users.length} total pengguna terdaftar`}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama atau email..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
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
          {filteredUsers.map(u => (
            <UserRow key={u.id} user={u} onRefresh={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  );
}
