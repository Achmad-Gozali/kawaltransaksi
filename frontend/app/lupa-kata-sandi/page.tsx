'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8787';

export default function LupaKataSandiPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const searchParams = useSearchParams();
  const linkExpired = searchParams.get('error') === 'link_expired';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || cooldown > 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Terjadi kesalahan. Coba lagi.');
        return;
      }

      setSent(true);
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);

    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet kamu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">

          {linkExpired && !sent && (
            <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-amber-700">Link reset sudah kadaluarsa. Masukkan email kamu untuk mendapatkan link baru.</p>
            </div>
          )}

          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Cek Email Kamu!</h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Jika email <span className="font-bold text-slate-700">{email}</span> terdaftar, kami sudah kirimkan link untuk reset kata sandi.
                </p>
                <p className="text-xs text-slate-400">Link berlaku selama 1 jam. Cek folder spam jika tidak ada.</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isLoading || cooldown > 0}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim Ulang Email'}
              </button>
              <div className="pt-2">
                <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">
                  Kembali ke Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Lupa Kata Sandi?</h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Masukkan email yang terdaftar. Kami akan kirimkan link untuk membuat kata sandi baru.
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@gmail.com"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                    : <><Mail className="w-4 h-4" /> Kirim Link Reset</>
                  }
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">
                  Ingat kata sandi kamu?{' '}
                  <Link href="/login" className="font-bold text-slate-700 hover:text-emerald-600 transition-colors">
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}