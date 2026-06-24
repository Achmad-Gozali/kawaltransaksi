'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, AlertTriangle, ChevronDown, Zap, Lock } from 'lucide-react';
import { KeyCard, type ApiKey } from '@/features/developer/components/KeyCard';
import { KeyRevealModal } from '@/features/developer/components/KeyRevealModal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

interface Props { token: string; userEmail: string; isLoggedIn: boolean; }

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
    <section className="bg-white pt-10 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">Pilih Plan</h2>
          <p className="text-sm text-slate-500 mt-1">Mulai gratis, upgrade saat butuh lebih.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRICING.map((plan) => (
            <div key={plan.tier} className={`rounded-2xl border overflow-hidden relative ${
              plan.comingSoon ? 'border-slate-200 opacity-80' : 'border-emerald-200 ring-1 ring-emerald-100'
            }`}>
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                {!plan.comingSoon && isLoggedIn && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white uppercase tracking-wider">Plan Anda</span>
                )}
                {plan.comingSoon && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900 text-white uppercase tracking-wider">Segera Hadir</span>
                )}
              </div>
              <div className={`px-5 py-5 ${plan.comingSoon ? 'bg-slate-50' : 'bg-emerald-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {plan.comingSoon ? <Lock className="w-4 h-4 text-slate-400" /> : <Zap className="w-4 h-4 text-emerald-500" />}
                  <p className="text-sm font-black text-slate-900 uppercase tracking-wide">{plan.tier}</p>
                </div>
                <p className={`text-2xl font-black ${plan.comingSoon ? 'text-slate-400' : 'text-emerald-600'}`}>{plan.price}</p>
                <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
              </div>
              <div className="bg-white px-5 py-4 space-y-2.5">
                {plan.features.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <FeatureIcon available={f.available} comingSoon={plan.comingSoon} />
                    <span className={`text-sm ${f.available ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{f.label}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                {plan.comingSoon ? (
                  <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed">Segera Hadir</button>
                ) : isLoggedIn ? (
                  <a href="#api-keys" className="block w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors text-center">Kelola API Key</a>
                ) : (
                  <a href="#api-keys" className="block w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors text-center">Mulai Gratis</a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
        <div className="max-w-4xl mx-auto text-center pb-16 sm:pb-24">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-900 uppercase mb-4 leading-tight">
            Integrasikan KawalTransaksi<br />
            <span className="text-emerald-600">ke Aplikasi Anda</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
            REST API untuk verifikasi nomor HP, rekening bank, dan e-wallet. Gratis 300 request/hari, tanpa kartu kredit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#api-keys" className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors uppercase tracking-wider">
              {isLoggedIn ? 'Kelola API Key' : 'Generate API Key'}
            </a>
            <a href="/developer/docs/overview" className="w-full sm:w-auto px-6 py-3 border border-slate-300 text-slate-600 hover:bg-slate-200 text-sm font-bold rounded-xl transition-colors uppercase tracking-wider">
              Lihat Dokumentasi
            </a>
          </div>
        </div>
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 sm:h-20 block">
          <path d="M0,20 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#ffffff" />
        </svg>
      </section>

      {/* Pricing */}
      <PricingSection isLoggedIn={isLoggedIn} />

      {/* API Keys */}
      <section id="api-keys" className="bg-white pt-10 pb-12 sm:pt-14 sm:pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">API Keys Saya</h2>
              <p className="text-sm text-slate-500 mt-1">Kelola API key untuk integrasi aplikasi Anda.</p>
            </div>
            {isLoggedIn && <span className="text-sm font-bold text-slate-400">{keys.length}/5</span>}
          </div>

          <div className="space-y-4">
            {isBlocked && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-800 mb-1">IP Anda Diblokir Sementara</p>
                    <p className="text-sm text-red-700 leading-relaxed mb-3">
                      Akses API Anda diblokir selama 24 jam karena terdeteksi aktivitas mencurigakan dari IP Anda.
                    </p>
                    <p className="text-sm text-red-700">
                      Jika ini kesalahan, hubungi{' '}
                      <a href="mailto:kawaltransaksi@gmail.com" className="font-bold underline hover:text-red-900">kawaltransaksi@gmail.com</a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isLoggedIn ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 sm:p-10 text-center">
                <p className="text-base font-bold text-slate-700 mb-1">Login untuk generate API key</p>
                <p className="text-sm text-slate-400 mb-6">API key terhubung ke akun Anda. Gratis, tanpa batas waktu.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a href="/login?redirectTo=/developer" className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors uppercase tracking-wider">Login Sekarang</a>
                  <a href="/register" className="w-full sm:w-auto px-6 py-3 border-2 border-slate-200 text-slate-700 hover:border-slate-400 text-sm font-bold rounded-xl transition-colors uppercase tracking-wider">Daftar Gratis</a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
            )}
          </div>
        </div>
      </section>

      {/* CTA Docs */}
      <section className="bg-slate-50 py-12 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Siap integrasi?</p>
          <p className="text-sm text-slate-500 mb-6">Baca dokumentasi lengkap untuk panduan step-by-step.</p>
          <a href="/developer/docs/overview" className="inline-block px-6 py-3 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors uppercase tracking-wider">
            Baca Dokumentasi
          </a>
        </div>
      </section>
    </main>
  );
}