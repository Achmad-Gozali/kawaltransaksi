'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowRight, AlertCircle, ShieldCheck, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { encodeSlug } from '@/lib/utils';
import { Turnstile } from '@marsidev/react-turnstile';
import { createClient } from '@/lib/supabase-browser';

const SEARCH_COOLDOWN_MS = 2000;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const banks = [
  { id: 'bca',     name: 'BCA',     logo: '/banks/bca.png' },
  { id: 'bri',     name: 'BRI',     logo: '/banks/bri.png' },
  { id: 'bni',     name: 'BNI',     logo: '/banks/bni.png' },
  { id: 'mandiri', name: 'Mandiri', logo: '/banks/mandiri.png' },
  { id: 'cimb',    name: 'CIMB',    logo: '/banks/cimb.png' },
  { id: 'bsi',     name: 'BSI',     logo: '/banks/bsi.png' },
];

function isValidRekening(num: string): boolean {
  const cleaned = num.replace(/\s/g, '');
  if (cleaned.startsWith('08') || cleaned.startsWith('62')) return false;
  return /^\d{10,20}$/.test(cleaned);
}

function getRekeningError(num: string): string | null {
  if (!num) return null;
  const cleaned = num.replace(/\s/g, '');
  if (cleaned.startsWith('08') || cleaned.startsWith('62')) {
    return 'Ini terlihat seperti nomor HP. Untuk cek nomor HP atau WhatsApp, gunakan halaman Cek Nomor HP.';
  }
  if (cleaned.length < 10) return 'Nomor rekening terlalu pendek. Minimal 10 digit.';
  if (cleaned.length > 20) return 'Nomor rekening terlalu panjang. Maksimal 20 digit.';
  return null;
}

export default function RekeningSearchForm() {
  const [query, setQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('loading');
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const lastSearchRef = useRef<number>(0);
  const router = useRouter();
  const supabase = createClient();

  const error = touched ? getRekeningError(query) : null;
  const isValid = isValidRekening(query);
  const selectedBankData = banks.find(b => b.id === selectedBank);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setCaptchaError(null);

    if (!turnstileToken) {
      setCaptchaError('Selesaikan verifikasi keamanan terlebih dahulu.');
      return;
    }

    if (!query.trim() || !isValid) return;

    const now = Date.now();
    if (now - lastSearchRef.current < SEARCH_COOLDOWN_MS) return;
    lastSearchRef.current = now;

    setIsLoading(true);
    setCooldown(true);
    setTimeout(() => setCooldown(false), SEARCH_COOLDOWN_MS);

    try {
      // Ambil access token kalau user sudah login, kalau tidak null
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token ?? null;

      const verifyRes = await fetch(`${BACKEND_URL}/api/search/verify-turnstile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Kalau login, kirim token → dapat kuota 15/menit
          // Kalau anonymous, tidak kirim header → dapat kuota 5/menit
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const verifyData = await verifyRes.json() as { success: boolean; message?: string };

      if (verifyRes.status === 429) {
        setCaptchaError(verifyData.message || 'Terlalu banyak pencarian. Tunggu sebentar lalu coba lagi.');
        setIsLoading(false);
        return;
      }

      if (!verifyData.success) {
        setCaptchaError('Verifikasi keamanan gagal. Coba refresh halaman.');
        setIsLoading(false);
        return;
      }

      const bankParam = selectedBank ? `&bank=${selectedBank}` : '';
      router.push(`/check/${encodeSlug(query)}?type=bank${bankParam}`);
    } catch {
      setCaptchaError('Gagal menghubungi server. Periksa koneksi internet.');
      setIsLoading(false);
    }
  };

  const examples = ['1234567890', '1122334455'];

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <form onSubmit={handleSubmit} className="group relative">

        {/* Dropdown pilih bank (opsional) */}
        <div className="mb-2 relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm hover:border-emerald-500 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              {selectedBankData ? (
                <>
                  <div className="w-12 h-6 relative shrink-0">
                    <Image src={selectedBankData.logo} alt={selectedBankData.name} fill className="object-contain object-left" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">{selectedBankData.name}</span>
                </>
              ) : (
                <span className="text-sm text-slate-400">Pilih bank (opsional)</span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <button
                type="button"
                onClick={() => { setSelectedBank(''); setDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100"
              >
                <span className="text-sm text-slate-400">Tidak tahu / lainnya</span>
              </button>
              {banks.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => { setSelectedBank(bank.id); setDropdownOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${selectedBank === bank.id ? 'bg-emerald-50' : ''}`}
                >
                  <div className="w-12 h-6 relative shrink-0">
                    <Image src={bank.logo} alt={bank.name} fill className="object-contain object-left" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">{bank.name}</span>
                  {selectedBank === bank.id && (
                    <span className="ml-auto text-emerald-500 text-xs font-semibold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input nomor rekening */}
        <div className={`relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-xl shadow-sm border p-1.5 transition-all duration-300 ${
          error
            ? 'border-red-400 ring-2 ring-red-400/10'
            : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10'
        }`}>
          <div className="relative flex-grow flex items-center">
            <div className="absolute left-4 sm:left-5 pointer-events-none">
              <Search className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-emerald-500'
              }`} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value.replace(/[^0-9]/g, ''));
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              placeholder="Masukkan nomor rekening..."
              className="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-3 bg-transparent placeholder-slate-400 focus:outline-none text-sm sm:text-base font-bold text-slate-900"
              disabled={isLoading}
              maxLength={20}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim() || cooldown || turnstileStatus !== 'ready'}
            className="mt-2 sm:mt-0 px-6 sm:px-8 py-3.5 sm:py-3 bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : turnstileStatus === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</>
            ) : (
              <>CEK DATABASE <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        <div className="mt-3 flex flex-col items-start gap-2">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => {
              setTurnstileToken(token);
              setTurnstileStatus('ready');
              setCaptchaError(null);
            }}
            onExpire={() => {
              setTurnstileToken(null);
              setTurnstileStatus('loading');
            }}
            onError={() => {
              setTurnstileToken(null);
              setTurnstileStatus('error');
              setCaptchaError('Widget keamanan gagal dimuat. Coba refresh halaman.');
            }}
          />
          {turnstileStatus === 'ready' && !captchaError && (
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verifikasi keamanan selesai
            </p>
          )}
          {turnstileStatus === 'loading' && (
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Memuat verifikasi keamanan...
            </p>
          )}
        </div>

        {error && (
          <div className="mt-2.5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-600 leading-relaxed">{error}</p>
          </div>
        )}

        {captchaError && (
          <div className="mt-2.5 flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-600 leading-relaxed">{captchaError}</p>
          </div>
        )}
      </form>

      <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contoh Pencarian:</span>
        {examples.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => { setQuery(num); setTouched(false); }}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}