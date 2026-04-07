'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, AlertCircle, CheckCircle2, Mail, Lock,
  UserPlus, ArrowRight, Eye, EyeOff, XCircle, Timer, AlertTriangle,
} from 'lucide-react';

interface AuthFormProps {
  type: 'login' | 'register';
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// ── EMAIL VALIDATION ──────────────────────────────────────────────────────────
const ALLOWED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.id', 'outlook.com', 'hotmail.com',
  'icloud.com', 'live.com', 'protonmail.com', 'mail.com', 'googlemail.com',
];

function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().trim().split('@');
  if (!local || !domain) return email;
  const cleanLocal = local.split('+')[0];
  const finalLocal = domain === 'gmail.com' || domain === 'googlemail.com'
    ? cleanLocal.replace(/\./g, '') : cleanLocal;
  return `${finalLocal}@${domain}`;
}

function validateEmail(email: string): { valid: boolean; message: string } {
  if (!email.includes('@')) return { valid: false, message: 'Format email tidak valid.' };
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return { valid: false, message: 'Format email tidak valid.' };
  const domain = parts[1];
  if (!domain.endsWith('.com') && domain !== 'yahoo.co.id') {
    return { valid: false, message: 'Gunakan email dengan domain yang valid (contoh: @gmail.com, @yahoo.com).' };
  }
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return { valid: false, message: 'Gunakan email aktif dari Gmail, Yahoo, Outlook, iCloud, atau ProtonMail.' };
  }
  return { valid: true, message: '' };
}

// ── PASSWORD POLICY ───────────────────────────────────────────────────────────
interface PasswordCheck { label: string; passed: boolean; }

function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: 'Minimal 8 karakter', passed: password.length >= 8 },
    { label: 'Mengandung huruf besar (A-Z)', passed: /[A-Z]/.test(password) },
    { label: 'Mengandung angka (0-9)', passed: /[0-9]/.test(password) },
    { label: 'Mengandung simbol (!@#$...)', passed: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
}

function isPasswordValid(password: string): boolean {
  return getPasswordChecks(password).every(c => c.passed);
}

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: '', color: '', width: '0%' };
  const passed = getPasswordChecks(password).filter(c => c.passed).length;
  if (passed <= 1) return { label: 'Lemah', color: 'bg-red-400', width: '25%' };
  if (passed === 2) return { label: 'Cukup', color: 'bg-yellow-400', width: '50%' };
  if (passed === 3) return { label: 'Baik', color: 'bg-blue-400', width: '75%' };
  return { label: 'Kuat', color: 'bg-emerald-500', width: '100%' };
}

// ── ERROR TRANSLATION ─────────────────────────────────────────────────────────
function translateError(message: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Email atau kata sandi salah.',
    'User already registered': 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.',
    'Email not confirmed': 'Email belum dikonfirmasi. Cek kotak masuk email kamu.',
    'Password should be at least 6 characters': 'Kata sandi tidak memenuhi persyaratan keamanan.',
    'Unable to validate email address: invalid format': 'Format email tidak valid.',
    'Failed to fetch': 'Gagal terhubung ke server. Periksa koneksi internet kamu.',
    'signup is disabled': 'Pendaftaran akun sementara dinonaktifkan.',
    'Email rate limit exceeded': 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.',
    'over_email_send_rate_limit': 'Batas pengiriman email tercapai. Coba lagi dalam beberapa menit.',
    'For security purposes, you can only request this after': 'Tunggu beberapa detik sebelum mencoba lagi.',
  };
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return message;
}

// ── RECAPTCHA ─────────────────────────────────────────────────────────────────
function useRecaptcha() {
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  useEffect(() => {
    if (document.getElementById('recaptcha-script')) {
      if (window.grecaptcha) { window.grecaptcha.ready(() => setRecaptchaReady(true)); }
      return;
    }
    if (!RECAPTCHA_SITE_KEY) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.onload = () => { window.grecaptcha.ready(() => setRecaptchaReady(true)); };
    document.head.appendChild(script);
  }, []);

  const getToken = useCallback((action: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!recaptchaReady || !window.grecaptcha) return reject(new Error('Sistem keamanan belum siap.'));
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve)
          .catch(() => reject(new Error('Gagal mendapatkan token keamanan.')));
      });
    });
  }, [recaptchaReady]);

  return { getToken, recaptchaReady };
}

// ── COUNTDOWN TIMER ───────────────────────────────────────────────────────────
function useCountdown(targetMs: number | null) {
  const [remaining, setRemaining] = useState<number>(() =>
    targetMs ? Math.max(0, targetMs - Date.now()) : 0
  );

  useEffect(() => {
    const update = () => setRemaining(targetMs ? Math.max(0, targetMs - Date.now()) : 0);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  return {
    minutes: Math.floor(remaining / 60000),
    seconds: Math.floor((remaining % 60000) / 1000),
    remaining,
    isExpired: targetMs === null ? true : remaining === 0,
  };
}

// ── OAUTH PROVIDERS ───────────────────────────────────────────────────────────
const oauthProviders = [
  {
    id: 'google', label: 'Google',
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

// ── MAIN FORM ─────────────────────────────────────────────────────────────────
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
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [lockedUntilMs, setLockedUntilMs] = useState<number | null>(null);
  const [isWarning, setIsWarning] = useState(false);

  const { minutes, seconds, isExpired } = useCountdown(lockedUntilMs);
  const isLocked = lockedUntilMs !== null && !isExpired;

  // Reset saat lock expired
useEffect(() => {
  if (isExpired && lockedUntilMs !== null) {
    // Pastikan memang sudah expired beneran, bukan baru di-set
    if (lockedUntilMs <= Date.now()) {
      setLockedUntilMs(null);
      setError(null);
      setIsWarning(false);
    }
  }
}, [isExpired, lockedUntilMs]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { getToken, recaptchaReady } = useRecaptcha();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const strength = type === 'register' ? getPasswordStrength(password) : { label: '', color: '', width: '0%' };
  const passwordChecks = type === 'register' ? getPasswordChecks(password) : [];
  const passwordMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const emailValidation = type === 'register' && email.includes('@') ? validateEmail(email) : { valid: true, message: '' };
  const emailInvalid = type === 'register' && email.includes('@') && !emailValidation.valid;
  const isRegisterInvalid = type === 'register' && (
    emailInvalid || !isPasswordValid(password) || passwordMismatch || fullName.trim().length < 2
  );
  const isSubmitDisabled = isLoading || !!oauthLoading || !recaptchaReady || isRegisterInvalid || isLocked;

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    setError(null);
    setIsWarning(false);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
    if (error) { setError(`Gagal masuk dengan ${provider}. Coba lagi.`); setOauthLoading(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setError(null);
    setSuccess(null);
    setIsWarning(false);

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFullName = fullName.trim().replace(/[<>'"]/g, '');

    if (type === 'register') {
      if (!sanitizedFullName || sanitizedFullName.length < 2) {
        setError('Nama lengkap minimal 2 karakter.'); return;
      }
      const emailCheck = validateEmail(sanitizedEmail);
      if (!emailCheck.valid) { setError(emailCheck.message); return; }
      if (!isPasswordValid(password)) {
        setError('Kata sandi tidak memenuhi persyaratan keamanan.'); return;
      }
      if (password !== confirmPassword) {
        setError('Kata sandi dan konfirmasi tidak cocok.'); return;
      }
    }

    if (!recaptchaReady) {
      setError('Sistem keamanan belum siap. Tunggu sebentar lalu coba lagi.'); return;
    }

    setIsLoading(true);
    try {
      const action = type === 'register' ? 'register' : 'login';
      const token = await getToken(action);

      const verifyRes = await fetch(`${BACKEND_URL}/api/auth/verify-recaptcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      });
      const verifyData = await verifyRes.json().catch(() => ({})) as { success?: boolean; message?: string };
      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.message || 'Verifikasi keamanan gagal. Coba lagi.');
        return;
      }

      if (type === 'register') {
        const normalizedEmail = normalizeEmail(sanitizedEmail);
        const { error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail, password,
          options: { data: { full_name: sanitizedFullName } },
        });
        if (signUpError) throw signUpError;
        setSuccess('Akun berhasil dibuat! Mengalihkan...');
        router.refresh();
        setTimeout(() => router.push(redirectTo), 1500);
        return;
      }

      // ── LOGIN ─────────────────────────────────────────────────────────────
      const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sanitizedEmail, password }),
      });
      const loginData = await loginRes.json().catch(() => ({})) as {
        success?: boolean;
        message?: string;
        locked?: boolean;
        locked_until?: string;
        warning?: boolean;
        session?: { access_token: string; refresh_token: string };
      };

      if (!loginData.success) {
        if (loginData.locked && loginData.locked_until) {
          // ── Akun dikunci ────────────────────────────────────────────────
          setLockedUntilMs(new Date(loginData.locked_until).getTime());
          setError(loginData.message ?? 'Akun dikunci sementara.');
          setIsWarning(false);
        } else if (loginData.warning) {
          // ── Warning: 1 percobaan tersisa ───────────────────────────────
          setIsWarning(true);
          setError(loginData.message ?? 'Kata sandi salah.');
        } else {
          // ── Error biasa ────────────────────────────────────────────────
          setIsWarning(false);
          setError(loginData.message ?? 'Email atau kata sandi salah.');
        }
        return;
      }

      if (loginData.session) {
        await supabase.auth.setSession({
          access_token: loginData.session.access_token,
          refresh_token: loginData.session.refresh_token,
        });
      }

      setSuccess('Berhasil masuk! Mengalihkan...');
      router.refresh();
      setTimeout(() => router.push(redirectTo), 1000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setError(translateError(message));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Style notif berdasarkan state ─────────────────────────────────────────
  const errorStyle = isLocked
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : isWarning
    ? 'bg-orange-50 border-orange-300 text-orange-700'
    : 'bg-red-50 border-red-200 text-red-700';

  const errorIcon = isLocked
    ? <Timer className="w-4 h-4 shrink-0 mt-0.5" />
    : isWarning
    ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
    : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />;

  return (
    <div className="w-full">
      {/* ── Error / Lock Notification ── */}
      {error && (
        <div className={`mb-5 p-3.5 border rounded-xl flex items-start gap-3 shadow-sm ${errorStyle}`}>
          {errorIcon}
          <div className="flex-1">
            <p className="text-xs font-semibold leading-relaxed">{error}</p>
            {isLocked && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1 bg-amber-100 px-2.5 py-1 rounded-lg">
                  <Timer className="w-3 h-3 text-amber-600" />
                  <span className="text-xs font-black text-amber-700 tabular-nums">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] text-amber-600">tersisa</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Success Notification ── */}
      {success && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-700 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold leading-relaxed">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Nama Lengkap (Register only) ── */}
        {type === 'register' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Nama Lengkap</label>
            <div className="relative">
              <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap Anda"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
                required />
            </div>
          </div>
        )}

        {/* ── Email ── */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Alamat Email</label>
          <div className="relative">
            <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${emailInvalid ? 'text-red-400' : 'text-slate-400'}`} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@gmail.com"
              className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm focus:ring-2 ${emailInvalid ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
              required autoComplete="email" disabled={isLocked} />
          </div>
          {emailInvalid && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
              <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-red-600 leading-relaxed">{emailValidation.message}</p>
            </div>
          )}
          {type === 'register' && (
            <p className="text-[10px] text-slate-400 font-medium ml-1">
              Gunakan email dari Gmail, Yahoo, Outlook, iCloud, atau ProtonMail.
            </p>
          )}
        </div>

        {/* ── Password ── */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Kata Sandi</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)}
              placeholder={type === 'register' ? 'Min. 8 karakter, huruf besar, angka, simbol' : '••••••••'}
              className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
              required minLength={type === 'register' ? 8 : 6}
              autoComplete={type === 'login' ? 'current-password' : 'new-password'}
              disabled={isLocked} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5" tabIndex={-1}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {type === 'register' && password.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
              </div>
              <p className="text-[10px] font-semibold text-slate-400">
                Kekuatan: <span className="text-slate-600">{strength.label}</span>
              </p>
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
                  <span className={`text-[11px] font-medium ${check.passed ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Konfirmasi Password (Register only) ── */}
        {type === 'register' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Konfirmasi Kata Sandi</label>
            <div className="relative">
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${passwordMatch ? 'text-emerald-500' : passwordMismatch ? 'text-red-400' : 'text-slate-400'}`} />
              <input
                type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi kata sandi"
                className={`w-full pl-10 pr-11 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm focus:ring-2 ${passwordMatch ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10' : passwordMismatch ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                required autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5" tabIndex={-1}>
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

        {/* ── Submit Button ── */}
        <button type="submit" disabled={isSubmitDisabled}
          className={`w-full py-3.5 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest mt-2 ${
            isLocked ? 'bg-amber-400 cursor-not-allowed'
            : isWarning ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
            : type === 'login' ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
          }`}>
          {isLocked
            ? <><Timer className="w-4 h-4" /> Dikunci {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</>
            : isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {type === 'login' ? 'Sedang Masuk...' : 'Membuat Akun...'}</>
            : !recaptchaReady
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Memuat keamanan...</>
            : isWarning
            ? <><AlertTriangle className="w-4 h-4" /> Coba Lagi (Percobaan Terakhir)</>
            : <>{type === 'login' ? 'Masuk' : 'Buat Akun'}<ArrowRight className="w-4 h-4 opacity-70" /></>
          }
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
          <button key={p.id} type="button" onClick={() => handleOAuthLogin(p.id)}
            disabled={!!oauthLoading || isLoading || isLocked}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50">
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