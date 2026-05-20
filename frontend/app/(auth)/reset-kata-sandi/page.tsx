'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/core/supabase/browser';
import {
  Loader2, Lock, Eye, EyeOff, CheckCircle2,
  XCircle, AlertCircle, ArrowRight,
} from 'lucide-react';

interface PasswordCheck { label: string; passed: boolean; }

function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: 'Minimal 8 karakter', passed: password.length >= 8 },
    { label: 'Mengandung huruf besar (A-Z)', passed: /[A-Z]/.test(password) },
    { label: 'Mengandung angka (0-9)', passed: /[0-9]/.test(password) },
    { label: 'Mengandung simbol (!@#$...)', passed: /[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/.test(password) },
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

export default function ResetKataSandiPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  const strength = getPasswordStrength(password);
  const passwordChecks = getPasswordChecks(password);
  const passwordMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    const checkSession = async () => {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            setSessionReady(true);
            setCheckingSession(false);
            return;
          }
        }
      }

      const searchParams = new URLSearchParams(window.location.search);
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (token_hash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery',
        });
        if (!error) {
          setSessionReady(true);
          setCheckingSession(false);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        router.push('/lupa-kata-sandi?error=link_expired');
      }
      setCheckingSession(false);
    };

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid(password)) {
      setError('Kata sandi tidak memenuhi persyaratan keamanan.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Kata sandi dan konfirmasi tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message || 'Gagal mengubah kata sandi. Coba lagi.');
        return;
      }

      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => router.push('/login?reset=success'), 2000);

    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm font-medium">Memverifikasi link reset...</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Kata Sandi Berhasil Diubah!</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Kata sandi kamu sudah diperbarui. Kamu akan diarahkan ke halaman login...
              </p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-600 transition-colors uppercase tracking-widest">
              Masuk Sekarang <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Buat Kata Sandi Baru</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Masukkan kata sandi baru untuk akun kamu. Pastikan kata sandi memenuhi persyaratan keamanan.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Kata Sandi Baru</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Min. 8 karakter, huruf besar, angka, simbol"
                  className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
                  required minLength={8} autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Kekuatan: <span className="text-slate-600">{strength.label}</span>
                  </p>
                </div>
              )}
              {(passwordFocused || password.length > 0) && (
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Konfirmasi Kata Sandi Baru</label>
              <div className="relative">
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${passwordMatch ? 'text-emerald-500' : passwordMismatch ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className={`w-full pl-10 pr-11 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm focus:ring-2 ${passwordMatch ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10' : passwordMismatch ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                  required autoComplete="new-password"
                />
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

            <button
              type="submit"
              disabled={isLoading || !isPasswordValid(password) || !passwordMatch}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest mt-2"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                : <><CheckCircle2 className="w-4 h-4" /> Simpan Kata Sandi Baru</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}