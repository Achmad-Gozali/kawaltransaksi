'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Mail, ArrowLeft, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8787';

function LupaKataSandiContent() {
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Tombol back -- hidden di desktop, tampil di mobile */}
        <div className="mb-6 md:hidden">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Header strip */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Lupa Kata Sandi?</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Masukkan email yang terdaftar dan kami akan kirimkan link untuk membuat kata sandi baru.
            </p>
          </div>

          <div className="px-8 py-6">

            {/* Link expired warning */}
            {linkExpired && !sent && (
              <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-700">
                  Link reset sudah kadaluarsa. Masukkan email kamu untuk mendapatkan link baru.
                </p>
              </div>
            )}

            {sent ? (
              /* Success state */
              <div className="py-4 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-gray-900">Email Terkirim!</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Jika email <span className="font-semibold text-gray-700">{email}</span> terdaftar,
                    kami sudah kirimkan link untuk reset kata sandi.
                  </p>
                  <p className="text-xs text-gray-400">
                    Link berlaku selama 1 jam. Cek folder <span className="italic">spam</span> jika tidak ada di inbox.
                  </p>
                </div>

                <div className="pt-2 flex flex-col items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || cooldown > 0}
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {cooldown > 0 ? `Kirim ulang dalam ${cooldown}d` : 'Kirim Ulang Email'}
                  </button>
                  <Link
                    href="/login"
                    className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <- Kembali ke Login
                  </Link>
                </div>
              </div>
            ) : (
              /* Form state */
              <>
                {error && (
                  <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-red-600">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 block">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contoh@email.com"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
                        required
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                      : 'Kirim Link Reset'
                    }
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-sm text-gray-500">
                    Ingat kata sandi kamu?{' '}
                    <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                      Masuk di sini
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LupaKataSandiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    }>
      <LupaKataSandiContent />
    </Suspense>
  );
}