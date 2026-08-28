"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function LupaKataSandiPage() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError("Email wajib diisi.");

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Terjadi kesalahan. Coba lagi sebentar lagi.");
      }
    } catch {
      setError("Tidak bisa terhubung ke server. Coba periksa koneksi internet Anda, lalu ulangi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none select-none absolute -top-32 -left-32 w-96 h-96 bg-emerald-200 rounded-full opacity-20 blur-3xl" />
      <div className="pointer-events-none select-none absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-300 rounded-full opacity-15 blur-3xl" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/logo.png" alt="KawalTransaksi" width={32} height={32} className="rounded-lg" priority />
          <span className="font-bold text-slate-800 text-lg">KawalTransaksi</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Periksa Email Anda</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Kalau email <span className="font-semibold text-slate-700">{email}</span> terdaftar, kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
              </p>
              <p className="text-xs text-slate-400 mb-4">Tidak menerima email? Periksa folder spam Anda.</p>
              <button
                onClick={() => { setSuccess(false); setEmail(""); }}
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Kirim ulang
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Lupa Kata Sandi</h1>
                <p className="text-sm text-gray-500">Masukkan email Anda, nanti kami kirimkan tautan untuk mengatur ulang kata sandi.</p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@gmail.com"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest mt-2"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</> : "Kirim Link Reset"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700 transition-colors inline-flex items-center gap-1.5 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke halaman masuk
          </Link>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">© 2026 KawalTransaksi</p>
      </div>
    </div>
  );
}