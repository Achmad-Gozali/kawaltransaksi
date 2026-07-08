"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle, MailCheck, RefreshCw } from "lucide-react";

function VerifikasiEmailInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const userId       = searchParams.get("userId") ?? "";
  const email        = searchParams.get("email") ?? "";

  const [otp,         setOtp]         = useState(["", "", "", "", "", ""]);
  const [loading,     setLoading]     = useState(false);
  const [resending,   setResending]   = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [countdown,   setCountdown]   = useState(60);
  const [canResend,   setCanResend]   = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== "") && newOtp.join("").length === 6) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code: string) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, otp: code }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 1500);
      } else {
        setError(data.error || "OTP tidak valid.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !userId) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCountdown(60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || "Gagal kirim ulang OTP.");
      }
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setResending(false);
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Link verifikasi tidak valid.</p>
        <Link href="/register" className="mt-4 inline-block text-sm font-semibold text-emerald-600">Daftar ulang</Link>
      </div>
    );
  }

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
              <h2 className="text-lg font-bold text-slate-900 mb-2">Email Terverifikasi!</h2>
              <p className="text-sm text-slate-500">Mengalihkan ke beranda...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MailCheck className="w-7 h-7 text-emerald-500" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Verifikasi Email</h1>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Kode OTP telah dikirim ke<br />
                  <span className="font-semibold text-slate-700">{decodeURIComponent(email)}</span>
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    disabled={loading}
                    className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all disabled:opacity-50 ${
                      digit
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-900 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => handleVerify(otp.join(""))}
                disabled={loading || otp.some(d => !d)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...</> : "Verifikasi"}
              </button>

              <div className="mt-5 text-center">
                {canResend ? (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Kirim ulang kode
                  </button>
                ) : (
                  <p className="text-sm text-slate-400">
                    Kirim ulang dalam <span className="font-semibold text-slate-600">{countdown}s</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">© 2026 KawalTransaksi</p>
      </div>
    </div>
  );
}

export default function VerifikasiEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    }>
      <VerifikasiEmailInner />
    </Suspense>
  );
}