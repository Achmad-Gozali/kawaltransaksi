// ============================================
// 📁 LOKASI: components/AuthForm.tsx
// 📝 REPLACE — proper error handling, no alert()
// ============================================

'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

interface AuthFormProps {
  type: 'login' | 'register';
}

export default function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      setIsLoading(false);
      return;
    }

    try {
      if (type === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;

        setSuccessMessage('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        const redirectTo = searchParams.get('redirectTo') || '/';
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan autentikasi.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-zinc-200/50 border border-zinc-100">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 rounded-2xl mb-6 shadow-xl shadow-zinc-200">
            {type === 'login' ? <LogIn className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight">
            {type === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
          </h2>
          <p className="text-zinc-500 font-medium">
            {type === 'login'
              ? 'Masuk untuk mulai melaporkan nomor penipu.'
              : 'Daftar untuk berkontribusi dalam komunitas.'}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'register' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:border-zinc-900 focus:bg-white outline-none transition-all font-bold text-zinc-900 placeholder:text-zinc-300"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:border-zinc-900 focus:bg-white outline-none transition-all font-bold text-zinc-900 placeholder:text-zinc-300"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:border-zinc-900 focus:bg-white outline-none transition-all font-bold text-zinc-900 placeholder:text-zinc-300"
                required
                minLength={6}
              />
            </div>
            {type === 'register' && (
              <p className="text-xs text-zinc-400 ml-1 mt-1">Minimal 6 karakter</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-zinc-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 active:scale-[0.98] shadow-2xl shadow-zinc-900/20"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {type === 'login' ? 'MASUK SEKARANG' : 'DAFTAR SEKARANG'}
                <LogIn className="w-5 h-5 text-zinc-400" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-100 text-center">
          <p className="text-sm text-zinc-500 font-medium">
            {type === 'login' ? (
              <>
                Belum punya akun?{' '}
                <Link href="/register" className="text-zinc-900 font-black hover:underline underline-offset-4">
                  Daftar di sini
                </Link>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <Link href="/login" className="text-zinc-900 font-black hover:underline underline-offset-4">
                  Masuk di sini
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}