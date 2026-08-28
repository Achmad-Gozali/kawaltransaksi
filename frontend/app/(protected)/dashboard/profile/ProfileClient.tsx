'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/core/auth/client';
import { User, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const inputCls = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all";

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
      type === 'success'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-600 border-red-200'
    }`}>
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />
      }
      {message}
    </div>
  );
}

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ProfileClient() {
  const [user, setUser]               = useState<ProfileUser | null>(null);
  const [name, setName]               = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg]         = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading]         = useState(false);
  const [passMsg, setPassMsg]                 = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isGoogleUser, setIsGoogleUser]       = useState(false);

  useEffect(() => {
    authClient.me().then(u => {
      if (!u) return;
      setUser({ id: u.id, name: u.name, email: u.email, role: u.role });
      setName(u.name);
    });
  }, []);

  const handleUpdateName = async () => {
    if (!name.trim() || name === user?.name) return;
    setNameLoading(true);
    setNameMsg(null);
    try {
      const token = authClient.getToken();
      const res   = await fetch(`${API_URL}/api/auth/me`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameMsg({ text: data.error ?? 'Gagal memperbarui nama. Coba lagi sebentar lagi.', type: 'error' });
      } else {
        setUser(prev => prev ? { ...prev, name: data.name } : prev);
        setNameMsg({ text: 'Nama berhasil diperbarui.', type: 'success' });
      }
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassMsg({ text: 'Semua field wajib diisi.', type: 'error' }); return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'Konfirmasi password tidak cocok.', type: 'error' }); return;
    }
    if (newPassword.length < 8) {
      setPassMsg({ text: 'Password baru minimal 8 karakter.', type: 'error' }); return;
    }
    setPassLoading(true);
    setPassMsg(null);
    try {
      const token = authClient.getToken();
      const res   = await fetch(`${API_URL}/api/auth/change-password`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes('Google')) setIsGoogleUser(true);
        setPassMsg({ text: data.error ?? 'Gagal mengubah kata sandi. Coba lagi sebentar lagi.', type: 'error' });
      } else {
        setPassMsg({ text: 'Password berhasil diubah.', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setPassLoading(false);
    }
  };

  const initials = user?.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?';

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-emerald-700 flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-black">{initials}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Informasi Akun</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Email</label>
                <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 select-none">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Nama Lengkap</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputCls}
                  placeholder="Nama lengkap"
                />
              </div>
              {nameMsg && <Toast message={nameMsg.text} type={nameMsg.type} />}
              <button
                onClick={handleUpdateName}
                disabled={nameLoading || !name.trim() || name === user.name}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40"
              >
                {nameLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Ganti Password</p>
            </div>

            {isGoogleUser ? (
              <p className="text-sm text-slate-400">Akun ini terdaftar via Google. Password tidak dapat diubah di sini.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Password Saat Ini</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="..." className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Password Baru</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 karakter" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Konfirmasi Password Baru</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru" className={inputCls} />
                </div>
                {passMsg && <Toast message={passMsg.text} type={passMsg.type} />}
                <button
                  onClick={handleChangePassword}
                  disabled={passLoading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40"
                >
                  {passLoading ? 'Menyimpan...' : 'Ubah Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
