'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertTriangle, ChevronDown } from 'lucide-react';
import { KeyCard, type ApiKey } from '@/features/developer/components/KeyCard';
import { KeyRevealModal } from '@/features/developer/components/KeyRevealModal';
import { CodeBlock, CodeTabs } from '@/features/developer/components/CodeBlock';
import { DocSection } from '@/features/developer/components/DocSection';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

interface Props {
  token: string;
  userEmail: string;
  isLoggedIn: boolean;
}

const EXPIRY_OPTIONS = [
  { value: 'never', label: 'Tidak ada kadaluarsa' },
  { value: '7d',    label: '7 hari' },
  { value: '30d',   label: '30 hari' },
  { value: '90d',   label: '90 hari' },
  { value: '1y',    label: '1 tahun' },
];

export default function DeveloperClient({ token, isLoggedIn }: Props) {
  const [keys, setKeys]               = useState<ApiKey[]>([]);
  const [loading, setLoading]         = useState(true);
  const [newKeyName, setNewKeyName]   = useState('');
  const [expiresIn, setExpiresIn]     = useState('never');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [creating, setCreating]       = useState(false);
  const [revealKey, setRevealKey]     = useState<string | null>(null);
  const [isBlocked, setIsBlocked]     = useState(false);

  useEffect(() => { if (isLoggedIn) fetchKeys(); else setLoading(false); }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/developer/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 403 && data.message?.includes('diblokir')) {
        setIsBlocked(true);
      } else if (data.success) {
        setIsBlocked(false);
        setKeys(data.data ?? []);
      }
    } finally { setLoading(false); }
  };

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
        setNewKeyName('');
        setExpiresIn('never');
        setEnvironment('live');
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

      {/* ÔöÇÔöÇ Hero ÔöÇÔöÇ */}
      <section className="bg-slate-900 text-white px-4 pt-14 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase mb-4 leading-tight">
            Integrasikan KawalTransaksi<br />
            <span className="text-emerald-400">ke Aplikasi Anda</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
            REST API untuk verifikasi nomor HP, rekening bank, dan e-wallet. Gratis 300 request/hari, tanpa kartu kredit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#api-keys" className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors uppercase tracking-wider">
              Generate API Key
            </a>
            <a href="#dokumentasi" className="w-full sm:w-auto px-6 py-3 border border-white/20 text-slate-300 hover:text-white text-sm font-bold rounded-xl transition-colors uppercase tracking-wider">
              Lihat Dokumentasi
            </a>
          </div>
        </div>
      </section>

      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full block bg-slate-900 -mb-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C360,20 1080,60 1440,20 L1440,80 L0,80 Z" fill="#ffffff" />
      </svg>

      {/* ÔöÇÔöÇ API Keys ÔöÇÔöÇ */}
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
                      Ini bisa terjadi karena terlalu banyak percobaan auth yang gagal atau akses ke endpoint yang tidak diizinkan.
                    </p>
                    <p className="text-sm text-red-700 leading-relaxed">
                      Jika ini kesalahan, hubungi kami di{' '}
                      <a href="mailto:kawaltransaksi@gmail.com" className="font-bold underline hover:text-red-900">
                        kawaltransaksi@gmail.com
                      </a>
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
                  <a href="/login?redirectTo=/developer"
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors uppercase tracking-wider">
                    Login Sekarang
                  </a>
                  <a href="/register"
                    className="w-full sm:w-auto px-6 py-3 border-2 border-slate-200 text-slate-700 hover:border-slate-400 text-sm font-bold rounded-xl transition-colors uppercase tracking-wider">
                    Daftar Gratis
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5">
                  <p className="text-sm font-bold text-slate-700 mb-3">Generate API Key Baru</p>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Nama project (contoh: MyApp Production)"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createKey()}
                      maxLength={50}
                      className="flex-1 px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all"
                    />
                    <button
                      onClick={createKey}
                      disabled={creating || !newKeyName.trim() || keys.length >= 5}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors shrink-0"
                    >
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
                          {EXPIRY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
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

      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full block bg-white -mb-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 C240,60 480,20 720,45 C960,70 1200,30 1440,50 L1440,80 L0,80 Z" fill="#f8fafc" />
      </svg>

      {/* ÔöÇÔöÇ Dokumentasi ÔöÇÔöÇ */}
      <section id="dokumentasi" className="bg-slate-50 pt-10 pb-16 sm:pt-14 sm:pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">Dokumentasi API</h2>
            <p className="text-sm text-slate-500 mt-1">Panduan lengkap untuk integrasi KawalTransaksi API ke aplikasi Anda.</p>
          </div>

          <div className="space-y-3">

            <DocSection title="Overview">
              <p className="text-sm text-slate-600 leading-relaxed">
                KawalTransaksi API adalah REST API yang memungkinkan Anda memverifikasi nomor HP, rekening bank, dan e-wallet terhadap database laporan penipuan komunitas secara real-time.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Base URL', value: 'api.kawaltransaksi.com' },
                  { label: 'Protocol', value: 'HTTPS only' },
                  { label: 'Format',   value: 'JSON' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm font-mono font-semibold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
              <CodeBlock code="https://api.kawaltransaksi.com" language="base url" />
            </DocSection>

            <DocSection title="Quick Start">
              <p className="text-sm text-slate-600 leading-relaxed">Mulai gunakan API dalam 3 langkah mudah.</p>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Generate API Key', desc: 'Buat API key dari dashboard di atas. Key hanya ditampilkan sekali ÔÇö simpan di tempat aman.' },
                  { step: '2', title: 'Pasang di Header',  desc: 'Sertakan API key di header setiap request menggunakan X-API-Key.' },
                  { step: '3', title: 'Cek Response',      desc: 'Baca field status di response: safe, warning, atau danger.' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-4 bg-white rounded-xl border border-slate-100 px-4 py-4">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-black text-white">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-1">{item.title}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789" \\
  -H "X-API-Key: kt_live_your_key_here"`} />
            </DocSection>

            <DocSection title="Autentikasi">
              <p className="text-sm text-slate-600 leading-relaxed">
                Semua request ke API harus disertai API key di header <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">X-API-Key</code>.
              </p>
              <CodeBlock code={`X-API-Key: kt_live_your_api_key_here`} language="header" />
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-red-800 mb-1">Jangan expose API key di frontend</p>
                <p className="text-sm text-red-700 leading-relaxed">
                  API key harus digunakan di server-side saja. Jangan simpan di kode frontend, environment variable client-side, atau repository publik.
                </p>
              </div>
            </DocSection>

            <DocSection title="Environment (Live vs Test)">
              <p className="text-sm text-slate-600 leading-relaxed">
                Setiap API key memiliki environment yang ditentukan saat generate. Gunakan key <strong>test</strong> untuk development dan key <strong>live</strong> untuk production.
              </p>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {[
                  { env: 'kt_live_...', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', title: 'Live', desc: 'Untuk production. Request dihitung terhadap limit harian. Gunakan di aplikasi yang sudah live.' },
                  { env: 'kt_test_...', color: 'text-amber-700 bg-amber-50 border-amber-200',       title: 'Test', desc: 'Untuk development dan testing. Request tetap dihitung terhadap limit harian. Data yang dikembalikan sama dengan live.' },
                ].map((e, i) => (
                  <div key={e.title} className={`px-4 py-4 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border font-mono ${e.color}`}>{e.title}</span>
                      <code className="text-xs font-mono text-slate-500">{e.env}</code>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{e.desc}</p>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection title="Endpoint ÔÇö GET /api/v1/check">
              <p className="text-sm text-slate-600 leading-relaxed">
                Gunakan untuk mengecek apakah sebuah nomor HP, rekening bank, atau e-wallet terindikasi penipuan berdasarkan laporan komunitas.
              </p>
              <CodeBlock code={`GET https://api.kawaltransaksi.com/api/v1/check`} language="endpoint" />
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">Query Parameters</p>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  {[
                    { param: 'number', type: 'string', req: true,  desc: 'Nomor yang ingin dicek. Hanya angka, tanpa spasi atau tanda hubung. Contoh: 08123456789' },
                    { param: 'type',   type: 'string', req: false, desc: 'Tipe nomor. Nilai: phone (default), bank_account, ewallet' },
                    { param: 'bank',   type: 'string', req: false, desc: 'Kode bank untuk rekening. Nilai: bca, bri, bni, mandiri, bsi, cimb, dan lainnya' },
                  ].map((p, i) => (
                    <div key={p.param} className={`px-4 py-3.5 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <code className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{p.param}</code>
                        <span className="text-xs text-slate-400 font-mono">{p.type}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ml-auto ${p.req ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                          {p.req ? 'required' : 'optional'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">Contoh Request</p>
                <CodeTabs />
              </div>
            </DocSection>

            <DocSection title="Format Response">
              <p className="text-sm text-slate-600 leading-relaxed">
                Semua response menggunakan format JSON. Field <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">success</code> selalu ada untuk menandakan berhasil atau tidak.
              </p>
              <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "number": "08123456789",
    "type": "phone",
    "status": "danger",           // safe | warning | danger
    "verified_reports": 3,
    "pending_reports": 1,
    "total_reports": 4,
    "total_loss": 5000000,        // dalam rupiah
    "last_reported": "2026-05-10T12:00:00Z",
    "check_url": "https://kawaltransaksi.com/check/08123456789"
  },
  "meta": {
    "environment": "live",        // live | test
    "requests_today": 42,
    "daily_limit": 300,
    "requests_remaining": 258,
    "expires_at": null
  }
}`} />
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {[
                  { status: 'safe',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Tidak ditemukan laporan penipuan. Transaksi relatif aman.' },
                  { status: 'warning', color: 'text-amber-700 bg-amber-50 border-amber-200',       desc: 'Ada laporan masuk tapi belum diverifikasi moderator. Tetap waspada.' },
                  { status: 'danger',  color: 'text-red-700 bg-red-50 border-red-200',             desc: 'Ada laporan terverifikasi. Sangat disarankan hindari transaksi.' },
                ].map((s, i) => (
                  <div key={s.status} className={`flex items-start gap-4 px-4 py-4 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                    <span className={`text-xs font-bold px-3 py-1 rounded-lg border font-mono shrink-0 mt-0.5 ${s.color}`}>{s.status}</span>
                    <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {[
                  { code: '400', label: 'Bad Request',       desc: 'Parameter tidak valid. Cek format number dan nilai type.' },
                  { code: '401', label: 'Unauthorized',      desc: 'API key tidak valid, tidak aktif, atau sudah kadaluarsa.' },
                  { code: '403', label: 'Forbidden',         desc: 'IP Anda diblokir sementara karena aktivitas mencurigakan.' },
                  { code: '429', label: 'Too Many Requests', desc: 'Batas request harian sudah tercapai (300/hari). Reset besok 00:00 WIB.' },
                  { code: '500', label: 'Server Error',      desc: 'Terjadi kesalahan di server kami. Coba lagi beberapa saat.' },
                ].map((e, i) => (
                  <div key={e.code} className={`flex items-start gap-4 px-4 py-3.5 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                    <span className="text-xs font-black font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded shrink-0">{e.code}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{e.label}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection title="Idempotency" defaultOpen={false}>
              <p className="text-sm text-slate-600 leading-relaxed">
                Untuk mencegah request duplikat (misalnya karena retry otomatis), gunakan header{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">Idempotency-Key</code>.
                Jika request yang sama dikirim ulang dalam 5 menit dengan key yang sama, sistem akan mengembalikan
                response yang sudah di-cache tanpa menghitung ke limit harian.
              </p>
              <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
                <ul className="text-sm text-slate-600 space-y-1.5 leading-relaxed">
                  <li>ÔÇó Kirim header <code className="bg-slate-100 px-1 rounded text-xs font-mono">Idempotency-Key</code> dengan nilai unik (misalnya UUID)</li>
                  <li>ÔÇó Request duplikat dalam 5 menit dikembalikan dari cache</li>
                  <li>ÔÇó Response cached ditandai <code className="bg-slate-100 px-1 rounded text-xs font-mono">meta.idempotent: true</code></li>
                </ul>
              </div>
              <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789" \\
  -H "X-API-Key: kt_live_your_key_here" \\
  -H "Idempotency-Key: order-check-12345"`} />
            </DocSection>

            <DocSection title="Rate Limiting">
              <p className="text-sm text-slate-600 leading-relaxed">
                Setiap API key memiliki batas request harian yang direset otomatis setiap hari pukul 00:00 WIB.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Free Tier',      value: '300 request/hari' },
                  { label: 'Reset',          value: 'Setiap 00:00 WIB' },
                  { label: 'Melebihi limit', value: 'HTTP 429' },
                  { label: 'Max API Key',    value: '5 key per akun' },
                  { label: 'Rate limit IP',  value: '60 req/menit per IP' },
                  { label: 'IP terblokir',   value: 'HTTP 403' },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-lg px-4 py-3 border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
              <CodeBlock language="javascript" code={`const data = await response.json();
const remaining = data.meta.requests_remaining;
if (remaining < 30) {
  console.warn(\`Sisa request hari ini: \${remaining}\`);
}`} />
            </DocSection>

            <DocSection title="Keamanan API Key" defaultOpen={false}>
              <p className="text-sm text-slate-600 leading-relaxed">
                API key adalah kredensial yang memberikan akses ke akun Anda. Jaga keamanannya seperti password.
              </p>
              <div className="space-y-3">
                {[
                  { title: 'Simpan di environment variable', desc: 'Jangan hardcode API key di source code. Gunakan .env dan pastikan ada di .gitignore.', code: '# .env\nKAWALTRANSAKSI_API_KEY=kt_live_your_key_here' },
                  { title: 'Gunakan key test untuk development', desc: 'Generate key environment "test" untuk dev. Simpan key live hanya untuk production.', code: null },
                  { title: 'Set expiry date', desc: 'Untuk integrasi sementara, set expiry agar key otomatis tidak bisa dipakai setelah selesai.', code: null },
                  { title: 'Regenerate kalau dicurigai bocor', desc: 'Jika key terekspos (commit ke repo publik, dll), segera regenerate. Key lama langsung invalid.', code: null },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 px-4 py-4">
                    <p className="text-sm font-bold text-slate-900 mb-1">{item.title}</p>
                    <p className="text-sm text-slate-500 leading-relaxed mb-2">{item.desc}</p>
                    {item.code && <CodeBlock language="bash" code={item.code} />}
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection title="Best Practices" defaultOpen={false}>
              <div className="space-y-3">
                {[
                  { title: 'Gunakan di server-side', desc: 'Jangan panggil API langsung dari browser. Buat endpoint backend sendiri sebagai proxy.' },
                  { title: 'Cache response', desc: 'Simpan hasil cek di cache (Redis, dll) untuk nomor yang sama selama beberapa menit.' },
                  { title: 'Gunakan Idempotency-Key untuk retry', desc: 'Jika aplikasi melakukan retry otomatis, sertakan Idempotency-Key agar tidak mengurangi limit.' },
                  { title: 'Handle error dengan baik', desc: 'Selalu cek field success. Jika error, jangan blokir user ÔÇö tampilkan pesan informatif.' },
                  { title: 'Monitor sisa request', desc: 'Pantau meta.requests_remaining. Jika mendekati 0, kurangi frekuensi pengecekan.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-slate-100 px-4 py-4">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-white">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-1">{item.title}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection title="Changelog" defaultOpen={false}>
              <div className="space-y-4">
                {[
                  {
                    version: 'v1.2', date: '19 Mei 2026',
                    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Terbaru',
                    changes: [
                      'Limit dinaikkan dari 100 ÔåÆ 300 request/hari',
                      'Tambah dukungan Idempotency-Key untuk deduplication request',
                      'API key sekarang punya environment: live dan test',
                      'Format key baru: kt_live_... dan kt_test_...',
                      'Keamanan: key disimpan sebagai hash di database',
                      'Keamanan: rate limit 60 req/menit per IP',
                      'Keamanan: auto-blacklist IP setelah 10x gagal auth',
                      'Optimasi: cache hasil check nomor 5 menit di KV',
                    ],
                  },
                  {
                    version: 'v1.1', date: '1 Mei 2026',
                    badge: 'bg-slate-100 text-slate-500 border-slate-200', label: null,
                    changes: [
                      'Tambah field expires_at di API key ÔÇö bisa set masa berlaku',
                      'Tambah field last_used_at untuk tracking penggunaan',
                    ],
                  },
                  {
                    version: 'v1.0', date: '15 April 2026',
                    badge: 'bg-slate-100 text-slate-500 border-slate-200', label: null,
                    changes: [
                      'Launch perdana KawalTransaksi API',
                      'Endpoint GET /api/v1/check untuk cek nomor HP, rekening, dan e-wallet',
                      'Free tier 100 request/hari',
                      'Autentikasi via X-API-Key header',
                    ],
                  },
                ].map((release, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 px-4 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-black text-slate-900 font-mono">{release.version}</span>
                      {release.label && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${release.badge}`}>{release.label}</span>
                      )}
                      <span className="text-xs text-slate-400 ml-auto">{release.date}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {release.changes.map((change, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="text-emerald-500 shrink-0 mt-0.5">ÔÇó</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </DocSection>

          </div>
        </div>
      </section>

    </main>
  );
}
