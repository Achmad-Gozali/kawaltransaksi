'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { encodeSlug } from '@/lib/utils';
import Link from 'next/link';

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) throw new Error('NEXT_PUBLIC_BACKEND_URL is not defined');
  return url;
})();

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

function validateHP(num: string): { valid: boolean; warning: string | null } {
  if (num.length === 0) return { valid: false, warning: null };

  // Masih ngetik prefix, jangan warning dulu
  if (num === '0') return { valid: false, warning: null };
  if (num === '6') return { valid: false, warning: null };
  if (num === '62') return { valid: false, warning: null };

  // Prefix valid Indo
  const validPrefix =
    num.startsWith('08') ||
    num.startsWith('628');

  if (!validPrefix) {
    return {
      valid: false,
      warning: 'Nomor HP Indonesia harus diawali 08 atau 628.',
    };
  }

  // Prefix benar tapi belum cukup panjang — belum valid, tapi juga jangan warning
  if (num.length < 10) return { valid: false, warning: null };

  // Panjang maksimal nomor HP Indo adalah 13 digit
  if (num.length > 13) {
    return {
      valid: false,
      warning: 'Nomor HP terlalu panjang. Maksimal 13 digit.',
    };
  }

  return { valid: true, warning: null };
}

export default function NomorSearchForm() {
  const [query, setQuery] = useState('');
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

  const cleaned = query.replace(/\D/g, '');
  const { valid: isValidHP, warning } = validateHP(cleaned);

  const handleChange = (val: string) => {
    setQuery(val.replace(/\D/g, ''));
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Guard — tidak bisa dibypass walau tombol di-enable paksa via DevTools
    if (!isValidHP) return;

    if (!turnstileToken) {
      setError('Selesaikan verifikasi keamanan terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/search/verify-turnstile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const data = (await res.json()) as { success: boolean; message?: string };

      if (!data.success) {
        setError(data.message ?? 'Verifikasi keamanan gagal. Coba lagi.');
        resetTurnstile();
        setLoading(false);
        return;
      }

      router.push(`/check/${encodeSlug(cleaned)}?type=phone`);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-lg space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Contoh: 081234567890"
            maxLength={15}
            className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
              warning
                ? 'border-amber-400 focus:border-amber-400 focus:ring-amber-100'
                : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-100'
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !turnstileToken || !isValidHP}
          className="px-5 py-3 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek'}
        </button>
      </div>

      {warning && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{warning}</span>
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
          options={{ theme: 'light', size: 'normal' }}
        />
      )}
    </form>
  );
}