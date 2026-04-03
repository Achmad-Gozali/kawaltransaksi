'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, AlertCircle, CheckCircle2, Mail, Lock,
  UserPlus, ArrowRight, Eye, EyeOff, ShieldCheck
} from 'lucide-react';

interface AuthFormProps {
  type: 'login' | 'register';
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

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
] as const;

type OAuthProvider = typeof oauthProviders[number]['id'];

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: '', color: '', width: '0%' };
  if (password.length < 6) return { label: 'Lemah', color: 'bg-red-400', width: '25%' };
  if (password.length < 8) return { label: 'Cukup', color: 'bg-yellow-400', width: '50%' };
  if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { label: 'Baik', color: 'bg-blue-400', width: '75%' };
  }
  return { label: 'Kuat', color: 'bg-emerald-500', width: '100%' };
}

function useRecaptcha() {
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  useEffect(() => {
    // Kalau script sudah ada dan grecaptcha sudah loaded
    if (document.getElementById('recaptcha-script')) {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => setRecaptchaReady(true));
      }
      return;
    }

    if (!RECAPTCHA_SITE_KEY) {
      console.error('NEXT_PUBLIC_RECAPTCHA_SITE_KEY tidak ditemukan di environment variables.');
      return;
    }

    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.onload = () => {
      window.grecaptcha.ready(() => setRecaptchaReady(true));
    };
    script.onerror = () => {
      console.error('Gagal memuat script reCAPTCHA.');
    };
    document.head.appendChild(script);
  }, []);

  const getToken = useCallback((action: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!recaptchaReady || !window.grecaptcha) {
        return reject(new Error('reCAPTCHA belum siap. Coba beberapa saat lagi.'));
      }
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action })
          .then(resolve)
          .catch(() => reject(new Error('Gagal mendapatkan token reCAPTCHA.')));
      });
    });
  }, [recaptchaReady]);

  return { getToken, recaptchaReady };
}

function AuthFormInner({ type }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { getToken, recaptchaReady } = useRecaptcha();

  const redirectTo = searchParams.get('redirectTo') || '/';
  const strength = type === 'register' ? getPasswordStrength(password) : { label: '', color: '', width: '0%' };
  const passwordMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    setError(null);
    const siteUrl = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setError(`Gagal otentikasi dengan ${provider}.`);
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (type === 'register' && password !== confirmPassword) {
      setError('Kata sandi dan konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (type === 'register' && password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    // Cek recaptcha siap sebelum submit
    if (!recaptchaReady) {
      setError('Sistem keamanan belum siap. Tunggu sebentar lalu coba lagi.');
      return;
    }

    setIsLoading(true);
    try {
      const action = type === 'register' ? 'register' : 'login';
      const token = await getToken(action);

      const verifyRes = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        setError(verifyData.message || 'Verifikasi keamanan gagal. Coba lagi.');
        return;
      }

      if (type === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;
        router.refresh();
        setTimeout(() => router.push(redirectTo), 100);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.refresh();
        setTimeout(() => router.push(redirectTo), 100);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {type === 'register' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Nama Lengkap
            </label>
            <div className="relative">
              <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap Anda"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Alamat Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={type === 'register' ? 'Minimal 6 karakter' : '••••••••'}
              className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
              required
              minLength={6}
              autoComplete={type === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {type === 'register' && password.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-[10px] font-semibold text-slate-400">
                Kekuatan: <span className="text-slate-600">{strength.label}</span>
                <span className="ml-2 text-slate-300">· Gunakan huruf besar & angka untuk kata sandi kuat</span>
              </p>
            </div>
          )}
        </div>

        {type === 'register' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <ShieldCheck className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${
                passwordMatch ? 'text-emerald-500' : passwordMismatch ? 'text-red-400' : 'text-slate-400'
              }`} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi"
                className={`w-full pl-10 pr-11 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm focus:ring-2 ${
                  passwordMatch
                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10'
                    : passwordMismatch
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'
                }`}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordMatch && (
              <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Kata sandi cocok
              </p>
            )}
            {passwordMismatch && (
              <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Kata sandi tidak cocok
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !!oauthLoading || (type === 'register' && passwordMismatch) || !recaptchaReady}
          className={`w-full py-3.5 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest mt-2 ${
            type === 'login'
              ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : !recaptchaReady ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat sistem keamanan...
            </>
          ) : (
            <>
              {type === 'login' ? 'Otentikasi Masuk' : 'Buat Akun'}
              <ArrowRight className="w-4 h-4 opacity-70" />
            </>
          )}
        </button>

        <p className="text-[9px] text-slate-300 text-center leading-relaxed">
          Dilindungi oleh reCAPTCHA &amp; berlaku{' '}
          <a href="https://policies.google.com/privacy" className="underline hover:text-slate-400" target="_blank" rel="noreferrer">Privasi</a>
          {' '}dan{' '}
          <a href="https://policies.google.com/terms" className="underline hover:text-slate-400" target="_blank" rel="noreferrer">Ketentuan</a>
          {' '}Google.
        </p>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">atau</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <div className="space-y-2.5">
        {oauthProviders.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleOAuthLogin(p.id)}
            disabled={!!oauthLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {oauthLoading === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : p.icon}
            Lanjutkan dengan {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function AuthForm({ type }: AuthFormProps) {
  return (
    <Suspense fallback={<div className="w-full bg-slate-50 rounded-xl animate-pulse h-64 border border-slate-100" />}>
      <AuthFormInner type={type} />
    </Suspense>
  );
}