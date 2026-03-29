'use client';

import React, { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

interface AuthFormProps {
  type: 'login' | 'register';
}

const oauthProviders = [
  {
    id: 'google',
    label: 'Google',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
] as const;

type OAuthProvider = typeof oauthProviders[number]['id'];

// ✅ Pisahkan komponen yang pakai useSearchParams ke dalam komponen sendiri
// lalu wrap dengan Suspense di parent — ini yang diminta Next.js
function AuthFormInner({ type }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectTo = searchParams.get('redirectTo') || '/';

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      console.error(`OAuth ${provider} error:`, error);
      setError(`Gagal login dengan ${provider}. Silakan coba lagi.`);
      setOauthLoading(null);
    }
  };

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
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;
        setSuccessMessage('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan autentikasi.';
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
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{successMessage}</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-8">
          {oauthProviders.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleOAuthLogin(provider.id)}
              disabled={!!oauthLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-zinc-50 border border-zinc-200 rounded-2xl font-bold text-sm text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === provider.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                provider.icon
              )}
              {type === 'login' ? 'Masuk' : 'Daftar'} dengan {provider.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-zinc-100" />
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">atau dengan email</span>
          <div className="flex-1 h-px bg-zinc-100" />
        </div>

        {/* Email/Password Form */}
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
            disabled={isLoading || !!oauthLoading}
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

// ✅ Wrap dengan Suspense di sini — fix "useSearchParams() should be wrapped in a suspense boundary"
export default function AuthForm({ type }: AuthFormProps) {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-zinc-200/50 border border-zinc-100 animate-pulse">
          <div className="h-16 w-16 bg-zinc-100 rounded-2xl mx-auto mb-6" />
          <div className="h-8 bg-zinc-100 rounded-xl mb-3" />
          <div className="h-4 bg-zinc-50 rounded-lg mb-10" />
          <div className="space-y-3">
            <div className="h-14 bg-zinc-50 rounded-2xl" />
            <div className="h-14 bg-zinc-50 rounded-2xl" />
          </div>
        </div>
      </div>
    }>
      <AuthFormInner type={type} />
    </Suspense>
  );
}