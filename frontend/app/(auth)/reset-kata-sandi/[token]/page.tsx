"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, XCircle } from "lucide-react";

function getPasswordChecks(p: string) {
  return [
    { label: "Minimal 8 karakter",          passed: p.length >= 8 },
    { label: "Mengandung huruf besar (A-Z)", passed: /[A-Z]/.test(p) },
    { label: "Mengandung angka (0-9)",       passed: /[0-9]/.test(p) },
    { label: "Mengandung simbol (!@#$...)",  passed: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  ];
}

export default function ResetKataSandiPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [focused,         setFocused]         = useState(false);

  const checks       = getPasswordChecks(password);
  const allPassed    = checks.every(c => c.passed);
  const passwordMatch = confirmPassword.length > 0 && password === confirmPassword;
  const mismatch      = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!allPassed) return setError("Kata sandi tidak memenuhi persyaratan.");
    if (password !== confirmPassword) return setError("Konfirmasi kata sandi tidak cocok.");

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token: params.token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setError(data.error || "Terjadi kesalahan.");
      }
    } catch {
      setError("Gagal menghubungi server. Periksa koneksi.");
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
              <h2 className="text-lg font-bold text-slate-900 mb-2">Kata Sandi Berhasil Diubah</h2>
              <p className="text-sm text-slate-500 leading-relaxed">Mengalihkan ke halaman masuk...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Buat Kata Sandi Baru</h1>
                <p className="text-sm text-gray-500">Pastikan kata sandi memenuhi semua persyaratan.</p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="Min. 8 karakter, huruf besar, angka, simbol"
                      className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                      required
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {(focused || password.length > 0) && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Persyaratan:</p>
                      {checks.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {c.passed
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                          <span className={`text-[11px] font-medium ${c.passed ? "text-emerald-700" : "text-slate-400"}`}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Konfirmasi Kata Sandi</label>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${passwordMatch ? "text-emerald-500" : mismatch ? "text-red-400" : "text-slate-400"}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 ${passwordMatch ? "border-emerald-400 focus:ring-emerald-500/10" : mismatch ? "border-red-300 focus:ring-red-500/10" : "border-slate-200 focus:ring-emerald-500/10"}`}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  {passwordMatch && <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Kata sandi cocok</p>}
                  {mismatch && <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Kata sandi tidak cocok</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading || !allPassed || !passwordMatch}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest mt-2"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Kata Sandi Baru"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium">
            Kembali ke halaman masuk
          </Link>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">© 2026 KawalTransaksi</p>
      </div>
    </div>
  );
}