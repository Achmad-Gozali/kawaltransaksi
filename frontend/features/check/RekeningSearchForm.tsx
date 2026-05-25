"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { encodeSlug } from "@/core/utils";
import Link from "next/link";

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
  return url;
})();

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

function isLikelyHP(num: string): boolean {
  if (num.length === 0) return false;
  if (num.startsWith("08")) return true;
  if (num.startsWith("628")) return true;
  if (num === "0") return false;
  if (num === "6") return false;
  if (num === "62") return false;
  return false;
}

export default function RekeningSearchForm() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken(null);
    setTurnstileKey((prev) => prev + 1);
  }, []);

  const handleSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const cleaned = query.replace(/\D/g, "");
  const isWrongInput = isLikelyHP(cleaned);

  const handleChange = (val: string) => {
    setQuery(val.replace(/\D/g, ""));
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isWrongInput) return;

    if (!cleaned || cleaned.length < 6) {
      setError("Masukkan nomor rekening yang valid (minimal 6 digit).");
      return;
    }
    if (!turnstileToken) {
      setError("Selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/search/verify-turnstile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const data = (await res.json()) as { success: boolean; message?: string };

      if (!data.success) {
        setError(data.message ?? "Verifikasi keamanan gagal. Coba lagi.");
        resetTurnstile();
        setLoading(false);
        return;
      }

      router.push(`/check/${encodeSlug(cleaned)}?type=bank`);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-lg space-y-3">
      {/* Container kotak search -- tombol di dalam */}
      <div
        className={`flex items-center gap-2 bg-white border-2 rounded-md px-3 py-2 transition-all ${
          isWrongInput
            ? "border-amber-400 ring-2 ring-amber-100"
            : "border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100"
        }`}
      >
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Contoh: 1234567890"
          maxLength={20}
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1"
        />
        <button
          type="submit"
          disabled={loading || !turnstileToken || isWrongInput}
          className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cek"}
        </button>
      </div>

      {isWrongInput && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Sepertinya ini nomor HP/WA, bukan nomor rekening.{" "}
            <Link
              href="/cek-nomor"
              className="font-bold underline underline-offset-2 hover:text-amber-900"
            >
              Gunakan halaman Cek Nomor HP
            </Link>{" "}
            untuk hasil yang akurat.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {TURNSTILE_SITE_KEY && (
        <Turnstile
          key={turnstileKey}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={handleSuccess}
          onExpire={resetTurnstile}
          onError={resetTurnstile}
          options={{ theme: "light", size: "normal" }}
        />
      )}
    </form>
  );
}
