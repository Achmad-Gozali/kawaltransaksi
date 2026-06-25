'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, RefreshCw, AlertTriangle, ChevronDown, Zap, Lock, Play,
  CheckCircle, XCircle, AlertCircle, ShoppingCart, Wallet,
  ShieldCheck, Headset, Database, RadioTower, KeyRound, ChevronRight,
} from 'lucide-react';
import { KeyCard, KeyRevealModal, type ApiKey } from '@/features/developer/components/KeyCard';
import { CodeBlock } from '@/features/developer/components/CodeBlock';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

interface Props { token: string; userEmail: string; isLoggedIn: boolean }

const EXPIRY_OPTIONS = [
  { value: 'never', label: 'Tidak ada kadaluarsa' },
  { value: '7d',    label: '7 hari' },
  { value: '30d',   label: '30 hari' },
  { value: '90d',   label: '90 hari' },
  { value: '1y',    label: '1 tahun' },
];

const PRICING = [
  {
    tier: 'Free', price: 'Gratis', comingSoon: false,
    description: 'Untuk developer individu & eksperimen',
    features: [
      { label: '300 request/hari',           available: true },
      { label: '5 API key per akun',         available: true },
      { label: 'Endpoint /check',            available: true },
      { label: 'Idempotency-Key support',    available: true },
      { label: 'Bulk check (maks 20 nomor)', available: false },
      { label: 'Usage history 30 hari',      available: false },
      { label: 'Priority support',           available: false },
    ],
  },
  {
    tier: 'Pro', price: 'Segera Hadir', comingSoon: true,
    description: 'Untuk aplikasi production & bisnis',
    features: [
      { label: '5.000 request/hari',         available: true },
      { label: '20 API key per akun',        available: true },
      { label: 'Endpoint /check',            available: true },
      { label: 'Idempotency-Key support',    available: true },
      { label: 'Bulk check (maks 20 nomor)', available: true },
      { label: 'Usage history 30 hari',      available: true },
      { label: 'Priority support',           available: true },
    ],
  },
];

const USE_CASES = [
  {
    icon: ShoppingCart,
    title: 'Marketplace & E-commerce',
    desc: 'Validasi rekening dan nomor penjual sebelum transaksi disetujui, mengurangi risiko penipuan pada platform jual-beli daring.',
  },
  {
    icon: Wallet,
    title: 'Dompet Digital & Pembayaran',
    desc: 'Periksa nomor e-wallet tujuan transfer secara real-time sebelum pengguna menyelesaikan pembayaran, mencegah dana terkirim ke pihak yang salah.',
  },
  {
    icon: ShieldCheck,
    title: 'Fintech & Layanan Keuangan',
    desc: 'Tambahkan lapisan verifikasi tambahan pada proses KYC dan onboarding nasabah, melengkapi prosedur kepatuhan internal yang sudah berjalan.',
  },
  {
    icon: Headset,
    title: 'Customer Service & Chatbot',
    desc: 'Berikan peringatan dini secara otomatis kepada pengguna saat nomor yang mereka tuju terindikasi dalam laporan penipuan komunitas.',
  },
];

const ALASAN_PILIH = [
  {
    icon: Database,
    title: 'Data dari Laporan Komunitas',
    desc: 'Basis data dibangun dari laporan pengguna nyata, bukan daftar statis yang jarang diperbarui.',
  },
  {
    icon: ShieldCheck,
    title: 'Verifikasi Berlapis',
    desc: 'Setiap laporan melewati proses scoring otomatis sebelum dianggap terverifikasi, mengurangi false positive.',
  },
  {
    icon: RadioTower,
    title: 'Respons Real-Time',
    desc: 'Hasil pengecekan dikembalikan secara langsung tanpa antrian, cocok untuk alur transaksi yang membutuhkan kecepatan.',
  },
  {
    icon: KeyRound,
    title: 'Mulai Tanpa Friksi',
    desc: '300 request/hari gratis tanpa kartu kredit. Cocok untuk validasi konsep sebelum komit ke skala produksi.',
  },
];

const DEV_FAQS = [
  {
    q: 'Apakah ada SDK resmi untuk bahasa tertentu?',
    a: 'Saat ini belum ada SDK resmi. API mengikuti standar REST biasa sehingga dapat dipanggil langsung menggunakan HTTP client di bahasa apa pun. Lihat contoh kode pada halaman Quick Start untuk cURL, Python, dan JavaScript.',
  },
  {
    q: 'Bisakah saya mengecek banyak nomor sekaligus (bulk check)?',
    a: 'Bulk check belum tersedia di plan Free. Fitur ini direncanakan untuk plan Pro yang sedang dikembangkan, dengan batas maksimal 20 nomor per request.',
  },
  {
    q: 'Apa bedanya API key live dan test?',
    a: 'Kedua jenis key mengembalikan data yang identik. Key test ditujukan untuk development agar tidak tercampur dengan metrik production, namun tetap dihitung terhadap limit harian key tersebut.',
  },
  {
    q: 'Kenapa IP saya bisa terblokir, dan bagaimana mengatasinya?',
    a: 'IP diblokir otomatis selama 24 jam setelah terdeteksi terlalu banyak percobaan autentikasi gagal secara berturut-turut. Jika Anda yakin ini kesalahan, hubungi kawaltransaksi@gmail.com.',
  },
  {
    q: 'Apakah API ini bisa dipanggil langsung dari frontend?',
    a: 'Tidak disarankan. API key harus digunakan di server-side saja. Buat endpoint backend Anda sendiri sebagai proxy agar API key tidak pernah terekspos ke klien.',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UseCaseSection() {
  return (
    <section className="bg-white pt-12 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">Dirancang Untuk</h2>
          <p className="text-sm text-slate-500 mt-1">Diadopsi oleh berbagai jenis layanan yang membutuhkan verifikasi transaksi.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
          {USE_CASES.map((uc) => (
            <div key={uc.title} className="flex items-start gap-3.5">
              <uc.icon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">{uc.title}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{uc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MengapaSection() {
  return (
    <section className="bg-white pt-12 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">Mengapa KawalTransaksi</h2>
          <p className="text-sm text-slate-500 mt-1">Pertimbangan teknis sebelum Anda mengintegrasikan API ini.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
          {ALASAN_PILIH.map((r) => (
            <div key={r.title} className="flex items-start gap-3.5">
              <r.icon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">{r.title}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqDevSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section className="bg-slate-50 pt-12 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">FAQ Developer</h2>
          <p className="text-sm text-slate-500 mt-1">Pertanyaan teknis yang sering diajukan seputar integrasi.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {DEV_FAQS.map((item, i) => {
            const open = openIdx === i;
            return (
              <div key={item.q} className={i > 0 ? 'border-t border-slate-100' : ''}>
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-800">{item.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
                </button>
                {open && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Playground
// ---------------------------------------------------------------------------

interface PlaygroundResult {
  success: boolean;
  data?: {
    number: string; type: string; status: 'safe' | 'warning' | 'danger';
    verified_reports: number; pending_reports: number; total_reports: number;
    total_loss: number; last_reported: string | null; check_url: string;
  };
  meta?: { playground: boolean; authenticated: boolean };
  message?: string;
}

const STATUS_CONFIG = {
  safe:    { label: 'Aman',      icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  warning: { label: 'Waspada',   icon: AlertCircle,  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  danger:  { label: 'Berbahaya', icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
};

function Playground({ token, isLoggedIn }: { token: string; isLoggedIn: boolean }) {
  const [number, setNumber] = useState('');
  const [type, setType]     = useState('phone');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<PlaygroundResult | null>(null);

  const run = async () => {
    if (!number.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/developer/playground`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isLoggedIn ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ number: number.trim(), type, bank: null }),
      });
      setResult(await res.json());
    } catch {
      setResult({ success: false, message: 'Gagal terhubung ke server.' });
    } finally {
      setLoading(false);
    }
  };

  const status = result?.data?.status;
  const cfg    = status ? STATUS_CONFIG[status] : null;

  const placeholder = type === 'phone' ? '08123456789' : type === 'bank_account' ? '1234567890' : '08123456789';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        {/* Type tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['phone', 'bank_account', 'ewallet'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                type === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400'
              }`}>
              {t === 'phone' ? 'Nomor HP' : t === 'bank_account' ? 'Rekening' : 'E-Wallet'}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={placeholder}
            value={number}
            onChange={e => setNumber(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && run()}
            maxLength={32}
            className="flex-1 px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all font-mono"
          />
          <button onClick={run} disabled={loading || !number.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shrink-0">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Coba
          </button>
        </div>

        {!isLoggedIn && (
          <p className="text-xs text-slate-400">
            Guest: 5x/jam ·{' '}
            <a href="/login?redirectTo=/developer" className="text-emerald-600 font-semibold hover:underline">Login</a>
            {' '}untuk 10x/jam
          </p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {result.success && result.data && cfg ? (
            <>
              <div className={`rounded-xl border px-4 py-4 flex items-center gap-3 ${cfg.bg}`}>
                <cfg.icon className={`w-5 h-5 shrink-0 ${cfg.color}`} />
                <div>
                  <p className={`text-sm font-black uppercase tracking-wide ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {result.data.verified_reports} laporan terverifikasi · {result.data.pending_reports} pending · total kerugian Rp {result.data.total_loss.toLocaleString('id-ID')}
                  </p>
                </div>
                <a href={result.data.check_url} target="_blank" rel="noopener noreferrer"
                  className="ml-auto text-xs font-bold text-slate-500 hover:text-slate-800 shrink-0 underline">
                  Detail →
                </a>
              </div>
              <CodeBlock language="json" code={JSON.stringify(result, null, 2)} />
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-red-700">{result.message ?? 'Terjadi kesalahan.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

function FeatureIcon({ available, comingSoon }: { available: boolean; comingSoon: boolean }) {
  if (available) {
    return (
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${comingSoon ? 'bg-slate-300' : 'bg-emerald-500'}`}>
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 4l2.5 2.5L9 1" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-red-100">
      <svg className="w-2.5 h-2.5 text-red-500" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 2l6 6M8 2l-6 6" />
      </svg>
    </div>
  );
}

function PricingSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="bg-slate-50 pt-10 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">Pilih Plan</h2>
          <p className="text-sm text-slate-500 mt-1">Mulai gratis, upgrade saat butuh lebih.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PRICING.map((plan) => (
            <div key={plan.tier} className={`bg-white rounded-[8px] border overflow-hidden relative flex flex-col ${
              plan.comingSoon ? 'border-slate-200' : 'border-emerald-500 shadow-sm'
            }`}>
              {!plan.comingSoon && isLoggedIn && (
                <span className="absolute top-5 right-5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white uppercase tracking-wider">Plan Anda</span>
              )}
              {plan.comingSoon && (
                <span className="absolute top-5 right-5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900 text-white uppercase tracking-wider">Segera Hadir</span>
              )}
              <div className="px-6 pt-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  {plan.comingSoon
                    ? <Lock className="w-4 h-4 text-slate-400" />
                    : <Zap className="w-4 h-4 text-emerald-500" />}
                  <p className="text-sm font-black text-slate-900 uppercase tracking-wide">{plan.tier}</p>
                </div>
                <p className={`text-3xl font-black mb-1 ${plan.comingSoon ? 'text-slate-300' : 'text-slate-900'}`}>{plan.price}</p>
                <p className="text-xs text-slate-500">{plan.description}</p>
              </div>
              <div className="px-6 py-5 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <FeatureIcon available={f.available} comingSoon={plan.comingSoon} />
                    <span className={`text-sm ${f.available ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{f.label}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                {plan.comingSoon ? (
                  <button disabled className="w-full py-3 bg-slate-100 text-slate-400 text-sm font-bold rounded-[8px] cursor-not-allowed">Segera Hadir</button>
                ) : isLoggedIn ? (
                  <a href="#api-keys" className="block w-full py-3 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold rounded-[8px] transition-colors text-center">Kelola API Key</a>
                ) : (
                  <a href="#api-keys" className="block w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-[8px] transition-colors text-center">Mulai Gratis</a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Divider wave helper
// ---------------------------------------------------------------------------

function Wave({ from, to }: { from: string; to: string }) {
  return (
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className={`w-full h-12 sm:h-20 block -mb-1 ${from}`} xmlns="http://www.w3.org/2000/svg">
      <path d="M0,24 C240,54 480,6 720,30 C960,54 1200,6 1440,30 L1440,60 L0,60 Z" fill={to} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function DeveloperClient({ token, isLoggedIn }: Props) {
  const [keys, setKeys]               = useState<ApiKey[]>([]);
  const [loading, setLoading]         = useState(true);
  const [newKeyName, setNewKeyName]   = useState('');
  const [expiresIn, setExpiresIn]     = useState('never');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [creating, setCreating]       = useState(false);
  const [revealKey, setRevealKey]     = useState<string | null>(null);
  const [isBlocked, setIsBlocked]     = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/developer/keys`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.status === 403 && data.message?.includes('diblokir')) setIsBlocked(true);
      else if (data.success) { setIsBlocked(false); setKeys(data.data ?? []); }
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (isLoggedIn) fetchKeys(); else setLoading(false);
  }, [isLoggedIn, fetchKeys]);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/developer/keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim(), expires_in: expiresIn, environment }),
      });
      const data = await res.json();
      if (data.success) {
        const { key: fullKey, ...keyWithoutFull } = data.data;
        setKeys(prev => [keyWithoutFull, ...prev]);
        setNewKeyName(''); setExpiresIn('never'); setEnvironment('live');
        if (fullKey) setRevealKey(fullKey);
      }
    } finally { setCreating(false); }
  };

  const handleDelete     = (id: string) => setKeys(prev => prev.filter(k => k.id !== id));
  const handleRename     = (id: string, name: string) => setKeys(prev => prev.map(k => k.id === id ? { ...k, name } : k));
  const handleRegenerate = (id: string, newKey: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, requests_today: 0, requests_total: 0, last_used_at: null } : k));
    setRevealKey(newKey);
  };

  return (
    <main className="bg-white font-sans overflow-x-hidden">
      {revealKey && <KeyRevealModal apiKey={revealKey} onClose={() => setRevealKey(null)} />}

      {/* Hero */}
      <section className="bg-slate-100 pt-14 pb-0 sm:pt-20 overflow-hidden px-4">
        <div className="max-w-3xl mx-auto pb-16 sm:pb-24 text-center">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-900 uppercase mb-4 leading-tight">
            Integrasikan KawalTransaksi<br />
            <span className="text-emerald-600">ke Aplikasi Anda</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
            REST API untuk verifikasi nomor HP, rekening bank, dan e-wallet. Gratis 300 request/hari, tanpa kartu kredit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={isLoggedIn ? '#api-keys' : '/register'}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-[8px] transition-colors uppercase tracking-wider text-center">
              {isLoggedIn ? 'Kelola API Key' : 'Generate API Key'}
            </a>
            <a href="/developer/docs/overview"
              className="px-6 py-3 border border-slate-300 text-slate-600 hover:bg-slate-200 text-sm font-bold rounded-[8px] transition-colors uppercase tracking-wider text-center">
              Lihat Dokumentasi
            </a>
          </div>
        </div>
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 sm:h-20 block">
          <path d="M0,24 C240,54 480,6 720,30 C960,54 1200,6 1440,30 L1440,60 L0,60 Z" fill="#ffffff" />
        </svg>
      </section>

      <UseCaseSection />

      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 sm:h-20 block bg-white -mb-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,18 C240,48 480,6 720,33 C960,60 1200,12 1440,36 L1440,60 L0,60 Z" fill="#f8fafc" />
      </svg>

      {/* Playground */}
      <section className="bg-slate-50 pt-10 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">Coba API Langsung</h2>
            <p className="text-sm text-slate-500 mt-1">Masukkan nomor dan lihat hasilnya secara real-time. Tanpa setup, tanpa API key.</p>
          </div>
          <Playground token={token} isLoggedIn={isLoggedIn} />
        </div>
      </section>

      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 sm:h-20 block bg-slate-50 -mb-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,36 C240,9 480,54 720,27 C960,3 1200,51 1440,21 L1440,60 L0,60 Z" fill="#ffffff" />
      </svg>

      <MengapaSection />

      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 sm:h-20 block bg-white -mb-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,33 C240,6 480,51 720,24 C960,0 1200,48 1440,18 L1440,60 L0,60 Z" fill="#f8fafc" />
      </svg>

      <PricingSection isLoggedIn={isLoggedIn} />

      {/* API Keys */}
      {isLoggedIn && (
        <>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 sm:h-20 block bg-slate-50 -mb-1" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,36 C240,9 480,54 720,27 C960,3 1200,51 1440,21 L1440,60 L0,60 Z" fill="#ffffff" />
          </svg>
          <section id="api-keys" className="bg-white pt-10 pb-12 sm:pt-14 sm:pb-16 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">API Keys Saya</h2>
                  <p className="text-sm text-slate-500 mt-1">Kelola API key untuk integrasi aplikasi Anda.</p>
                </div>
                <span className="text-sm font-bold text-slate-400">{keys.length}/5</span>
              </div>

              <div className="space-y-4">
                {isBlocked && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
                    <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-800 mb-1">IP Anda Diblokir Sementara</p>
                      <p className="text-sm text-red-700 leading-relaxed mb-1">Akses API Anda diblokir selama 24 jam karena terdeteksi aktivitas mencurigakan.</p>
                      <p className="text-sm text-red-700">
                        Hubungi <a href="mailto:kawaltransaksi@gmail.com" className="font-bold underline hover:text-red-900">kawaltransaksi@gmail.com</a>
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5">
                  <p className="text-sm font-bold text-slate-700 mb-3">Generate API Key Baru</p>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text" placeholder="Nama project (contoh: MyApp Production)"
                      value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createKey()} maxLength={50}
                      className="flex-1 px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all"
                    />
                    <button onClick={createKey} disabled={creating || !newKeyName.trim() || keys.length >= 5}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors shrink-0">
                      {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Generate
                    </button>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm text-slate-500 shrink-0">Masa berlaku:</span>
                      <div className="relative">
                        <select value={expiresIn} onChange={e => setExpiresIn(e.target.value)}
                          className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-emerald-400 transition-all cursor-pointer">
                          {EXPIRY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm text-slate-500 shrink-0">Environment:</span>
                      <div className="flex gap-1.5">
                        {(['live', 'test'] as const).map(env => (
                          <button key={env} onClick={() => setEnvironment(env)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors capitalize ${
                              environment === env
                                ? env === 'live' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400'
                            }`}>
                            {env}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {keys.length >= 5 && <p className="text-sm text-amber-600 mt-2">Maksimal 5 API key per akun.</p>}
                </div>

                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 leading-relaxed">
                    API key hanya ditampilkan <strong>sekali</strong> saat generate. Simpan di tempat aman. Kalau hilang, gunakan tombol <strong>Regenerate</strong>.
                  </p>
                </div>

                {loading ? (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-10 text-center">
                    <RefreshCw className="w-6 h-6 text-slate-300 animate-spin mx-auto" />
                  </div>
                ) : keys.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-10 text-center">
                    <p className="text-sm font-semibold text-slate-400 mb-1">Belum ada API key</p>
                    <p className="text-sm text-slate-400">Generate key pertama Anda di atas untuk mulai.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {keys.map(k => (
                      <KeyCard key={k.id} k={k} token={token}
                        onDelete={handleDelete} onRename={handleRename} onRegenerate={handleRegenerate} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      <svg viewBox="0 0 1440 60" preserveAspectRatio="none"
        className={`w-full h-12 sm:h-20 block -mb-1 ${isLoggedIn ? 'bg-white' : 'bg-slate-50'}`}
        xmlns="http://www.w3.org/2000/svg">
        <path d="M0,24 C240,54 480,6 720,30 C960,54 1200,6 1440,30 L1440,60 L0,60 Z" fill="#f8fafc" />
      </svg>

      <FaqDevSection />

      {!isLoggedIn && (
        <>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 sm:h-20 block bg-slate-50 -mb-1" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,33 C240,6 480,51 720,24 C960,0 1200,48 1440,18 L1440,60 L0,60 Z" fill="#ffffff" />
          </svg>
          <section className="bg-white py-12 sm:py-16 px-4 text-center">
            <div className="max-w-xl mx-auto">
              <p className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Siap integrasi?</p>
              <p className="text-sm text-slate-500 mb-6">Daftar gratis dan generate API key dalam 30 detik.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="/register" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-[8px] transition-colors uppercase tracking-wider">
                  Daftar Gratis
                </a>
                <a href="/developer/docs/overview" className="px-6 py-3 border border-slate-300 text-slate-600 hover:bg-slate-100 text-sm font-bold rounded-[8px] transition-colors uppercase tracking-wider">
                  Lihat Dokumentasi
                </a>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}