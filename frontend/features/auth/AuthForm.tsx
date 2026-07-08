'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, AlertCircle, CheckCircle2, Mail, Lock,
  UserPlus, ArrowRight, Eye, EyeOff, XCircle,
} from 'lucide-react';
import { authClient } from '@/core/auth/client';

interface AuthFormProps { type: 'login' | 'register'; }

const ALLOWED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.id', 'outlook.com', 'hotmail.com',
  'icloud.com', 'live.com', 'protonmail.com', 'mail.com', 'googlemail.com',
];

function validateEmail(email: string) {
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1])
    return { valid: false, message: 'Format email tidak valid.' };
  if (!ALLOWED_DOMAINS.includes(parts[1]))
    return { valid: false, message: 'Gunakan email dari Gmail, Yahoo, Outlook, iCloud, atau ProtonMail.' };
  return { valid: true, message: '' };
}

function getPasswordChecks(password: string) {
  return [
    { label: 'Minimal 8 karakter',          passed: password.length >= 8 },
    { label: 'Mengandung huruf besar (A-Z)', passed: /[A-Z]/.test(password) },
    { label: 'Mengandung angka (0-9)',       passed: /[0-9]/.test(password) },
    { label: 'Mengandung simbol (!@#$...)',  passed: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
}

function isPasswordValid(p: string) {
  return getPasswordChecks(p).every(c => c.passed);
}

function getPasswordStrength(p: string) {
  if (!p.length) return { label: '', color: '', width: '0%' };
  const n = getPasswordChecks(p).filter(c => c.passed).length;
  if (n <= 1) return { label: 'Lemah',  color: 'bg-red-400',     width: '25%'  };
  if (n === 2) return { label: 'Cukup', color: 'bg-yellow-400',  width: '50%'  };
  if (n === 3) return { label: 'Baik',  color: 'bg-blue-400',    width: '75%'  };
  return             { label: 'Kuat',   color: 'bg-emerald-500', width: '100%' };
}

function getRedirectPath(role: string, fallback: string) {
  if (role === 'admin') return '/admin';
  return fallback || '/';
}

function AuthFormInner({ type }: AuthFormProps) {
  const [email, setEmail]                             = useState('');
  const [password, setPassword]                       = useState('');
  const [confirmPassword, setConfirmPassword]         = useState('');
  const [fullName, setFullName]                       = useState('');
  const [agreed, setAgreed]                           = useState(false);
  const [consentError, setConsentError]               = useState(false);
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading]                     = useState(false);
  const [isGoogleLoading, setIsGoogleLoading]         = useState(false);
  const [error, setError]                             = useState<string | null>(null);
  const [success, setSuccess]                         = useState<string | null>(null);
  const [passwordFocused, setPasswordFocused]         = useState(false);

  const consentRef   = useRef<HTMLDivElement>(null);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirectTo') || '/';

  const oauthError = searchParams.get('error');
  const oauthErrorMap: Record<string, string> = {
    google_cancelled: 'Login Google dibatalkan.',
    google_no_email:  'Akun Google tidak memiliki email yang dapat digunakan.',
    google_failed:    'Login Google gagal. Coba lagi.',
  };

  const strength        = type === 'register' ? getPasswordStrength(password) : { label: '', color: '', width: '0%' };
  const passwordChecks  = type === 'register' ? getPasswordChecks(password) : [];
  const passwordMatch   = confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const emailValidation = type === 'register' && email.includes('@') ? validateEmail(email) : { valid: true, message: '' };
  const emailInvalid    = type === 'register' && email.includes('@') && !emailValidation.valid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setConsentError(false);

    if (type === 'register' && !agreed) {
      setConsentError(true);
      consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const sanitizedEmail    = email.trim().toLowerCase();
    const sanitizedFullName = fullName.trim().replace(/[<>'"]/g, '');

    if (type === 'register') {
      if (sanitizedFullName.length < 2) { setError('Nama lengkap minimal 2 karakter.'); return; }
      const ec = validateEmail(sanitizedEmail);
      if (!ec.valid) { setError(ec.message); return; }
      if (!isPasswordValid(password)) { setError('Kata sandi tidak memenuhi persyaratan keamanan.'); return; }
      if (password !== confirmPassword) { setError('Kata sandi dan konfirmasi tidak cocok.'); return; }
    }

    setIsLoading(true);
    try {
      if (type === 'register') {
        const res = await authClient.register(sanitizedFullName, sanitizedEmail, password);
        if ((res as any).requiresVerification) {
          setSuccess('Akun dibuat! Mengalihkan ke verifikasi email...');
          setTimeout(() => router.push(`/verifikasi-email?userId=${(res as any).user.id}&email=${encodeURIComponent(sanitizedEmail)}`), 800);
        } else {
          setSuccess('Akun berhasil dibuat! Mengalihkan...');
          setTimeout(() => router.push(getRedirectPath(res.user.role, redirectTo)), 800);
        }
      } else {
        const res = await authClient.login(sanitizedEmail, password);
        if ((res as any).requiresVerification) {
          setSuccess('Mengarahkan ke verifikasi email...');
          setTimeout(() => router.push(`/verifikasi-email?userId=${(res as any).user.id}&email=${encodeURIComponent(sanitizedEmail)}`), 800);
        } else {
          setSuccess('Berhasil masuk! Mengalihkan...');
          router.refresh();
          setTimeout(() => router.push(getRedirectPath(res.user.role, redirectTo)), 800);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  };

  return (
    <div className="w-full">
      {(oauthError && oauthErrorMap[oauthError]) && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-red-700 leading-relaxed">{oauthErrorMap[oauthError]}</p>
        </div>
      )}
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-red-700 leading-relaxed">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-emerald-700 leading-relaxed">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'register' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Nama Lengkap</label>
            <div className="relative">
              <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Nama lengkap Anda"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                required />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Alamat Email</label>
          <div className="relative">
            <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${emailInvalid ? 'text-red-400' : 'text-slate-400'}`} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@gmail.com"
              className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 ${emailInvalid ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
              required autoComplete="email" />
          </div>
          {emailInvalid && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
              <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-red-600">{emailValidation.message}</p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Kata Sandi</label>
            {type === 'login' && (
              <Link href="/lupa-kata-sandi" className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-widest">
                Lupa kata sandi?
              </Link>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder={type === 'register' ? 'Min. 8 karakter, huruf besar, angka, simbol' : '••••••••'}
              className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
              required autoComplete={type === 'login' ? 'current-password' : 'new-password'} />
            <button type="button" onClick={() => setShowPassword(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {type === 'register' && password.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
              </div>
              <p className="text-[10px] font-semibold text-slate-400">Kekuatan: <span className="text-slate-600">{strength.label}</span></p>
            </div>
          )}
          {type === 'register' && (passwordFocused || password.length > 0) && (
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Persyaratan kata sandi:</p>
              {passwordChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-2">
                  {check.passed
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                  <span className={`text-[11px] font-medium ${check.passed ? 'text-emerald-700' : 'text-slate-400'}`}>{check.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {type === 'register' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Konfirmasi Kata Sandi</label>
            <div className="relative">
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${passwordMatch ? 'text-emerald-500' : passwordMismatch ? 'text-red-400' : 'text-slate-400'}`} />
              <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} placeholder="Ulangi kata sandi"
                className={`w-full pl-10 pr-11 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 ${passwordMatch ? 'border-emerald-400 focus:ring-emerald-500/10' : passwordMismatch ? 'border-red-300 focus:ring-red-500/10' : 'border-slate-200 focus:ring-emerald-500/10'}`}
                required autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordMatch && <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Kata sandi cocok</p>}
            {passwordMismatch && <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Kata sandi tidak cocok</p>}
          </div>
        )}

        {type === 'register' && (
          <div ref={consentRef}>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={agreed}
                onChange={e => { setAgreed(e.target.checked); if (e.target.checked) setConsentError(false); }}
                className={`mt-0.5 w-4 h-4 shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 ${consentError ? 'border-red-400 ring-2 ring-red-200' : ''}`} />
              <span className="text-xs text-gray-500 leading-relaxed">
                Saya menyetujui{' '}
                <Link href="/syarat-ketentuan" target="_blank" className="text-gray-700 hover:text-emerald-600 font-medium underline underline-offset-2">Syarat & Ketentuan</Link>
                {' '}dan{' '}
                <Link href="/kebijakan-privasi" target="_blank" className="text-gray-700 hover:text-emerald-600 font-medium underline underline-offset-2">Kebijakan Privasi</Link>.
              </span>
            </label>
            {consentError && <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Centang persetujuan untuk melanjutkan.</p>}
          </div>
        )}

        <button type="submit" disabled={isLoading || isGoogleLoading}
          className={`w-full py-3.5 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest mt-2 ${
            type === 'login' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}>
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {type === 'login' ? 'Sedang Masuk...' : 'Membuat Akun...'}</>
            : <>{type === 'login' ? 'Masuk' : 'Buat Akun'}<ArrowRight className="w-4 h-4 opacity-70" /></>
          }
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">atau</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading || isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {isGoogleLoading ? 'Mengalihkan...' : 'Lanjutkan dengan Google'}
      </button>
    </div>
  );
}

export default function AuthForm({ type }: AuthFormProps) {
  return (
    <Suspense fallback={<div className="w-full bg-slate-50 rounded-xl animate-pulse h-64 border border-slate-100" />}>
      <AuthFormInner type={type} />
    </Suspense>
  );
}