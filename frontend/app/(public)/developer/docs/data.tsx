import { CodeBlock, CodeTabs } from '@/features/developer/components/CodeBlock';

export interface DocTopic {
  slug:        string;
  title:       string;
  description: string;           // for <meta> description
  content:     React.ReactNode;
}

export const DOC_TOPICS: DocTopic[] = [
  {
    slug:        'overview',
    title:       'Overview',
    description: 'Pengenalan KawalTransaksi API — REST API untuk verifikasi nomor HP, rekening bank, dan e-wallet.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          KawalTransaksi API adalah REST API yang memungkinkan Anda memverifikasi nomor HP, rekening bank, dan e-wallet
          terhadap database laporan penipuan komunitas secara real-time.
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
      </div>
    ),
  },

  {
    slug:        'quick-start',
    title:       'Quick Start',
    description: 'Mulai gunakan KawalTransaksi API dalam 3 langkah mudah.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">Mulai gunakan API dalam 3 langkah mudah.</p>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Generate API Key',  desc: 'Buat API key dari dashboard developer. Key hanya ditampilkan sekali — simpan di tempat aman.' },
            { step: '2', title: 'Pasang di Header',  desc: 'Sertakan API key di header setiap request menggunakan X-API-Key.' },
            { step: '3', title: 'Baca Response',     desc: 'Cek field status di response: safe, warning, atau danger.' },
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
      </div>
    ),
  },

  {
    slug:        'autentikasi',
    title:       'Autentikasi',
    description: 'Cara autentikasi ke KawalTransaksi API menggunakan X-API-Key header.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Semua request ke API harus disertai API key di header{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">X-API-Key</code>.
        </p>
        <CodeBlock code="X-API-Key: kt_live_your_api_key_here" language="header" />
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-red-800 mb-1">Jangan expose API key di frontend</p>
          <p className="text-sm text-red-700 leading-relaxed">
            API key harus digunakan di server-side saja. Jangan simpan di kode frontend,
            environment variable client-side, atau repository publik.
          </p>
        </div>
      </div>
    ),
  },

  {
    slug:        'environment',
    title:       'Environment',
    description: 'Perbedaan environment live dan test pada KawalTransaksi API.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Setiap API key memiliki environment yang ditentukan saat generate.
          Gunakan key <strong>test</strong> untuk development dan key <strong>live</strong> untuk production.
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {[
            { env: 'kt_live_...', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', title: 'Live', desc: 'Untuk production. Request dihitung terhadap limit harian.' },
            { env: 'kt_test_...', color: 'text-amber-700 bg-amber-50 border-amber-200',       title: 'Test', desc: 'Untuk development dan testing. Data yang dikembalikan sama dengan live.' },
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
      </div>
    ),
  },

  {
    slug:        'endpoint-check',
    title:       'Endpoint /check',
    description: 'Referensi lengkap endpoint GET /api/v1/check untuk verifikasi nomor.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Endpoint utama untuk mengecek apakah nomor HP, rekening bank, atau e-wallet terindikasi penipuan.
        </p>
        <CodeBlock code="GET https://api.kawaltransaksi.com/api/v1/check" language="endpoint" />
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
      </div>
    ),
  },

  {
    slug:        'format-response',
    title:       'Format Response',
    description: 'Format JSON response dan daftar status code KawalTransaksi API.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Semua response menggunakan format JSON. Field{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">success</code>{' '}
          selalu ada untuk menandakan berhasil atau tidak.
        </p>
        <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "number": "08123456789",
    "type": "phone",
    "status": "danger",
    "verified_reports": 3,
    "pending_reports": 1,
    "total_reports": 4,
    "total_loss": 5000000,
    "last_reported": "2026-05-10T12:00:00Z",
    "check_url": "https://kawaltransaksi.com/check/08123456789"
  },
  "meta": {
    "environment": "live",
    "requests_today": 42,
    "daily_limit": 300,
    "requests_remaining": 258,
    "expires_at": null
  }
}`} />
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {[
            { status: 'safe',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Tidak ditemukan laporan penipuan. Transaksi relatif aman.' },
            { status: 'warning', color: 'text-amber-700 bg-amber-50 border-amber-200',       desc: 'Ada laporan masuk tapi belum diverifikasi. Tetap waspada.' },
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
            { code: '400', label: 'Bad Request',       desc: 'Parameter tidak valid.' },
            { code: '401', label: 'Unauthorized',      desc: 'API key tidak valid, tidak aktif, atau sudah kadaluarsa.' },
            { code: '403', label: 'Forbidden',         desc: 'IP Anda diblokir sementara karena aktivitas mencurigakan.' },
            { code: '429', label: 'Too Many Requests', desc: 'Batas request harian sudah tercapai. Reset besok 00:00 WIB.' },
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
      </div>
    ),
  },

  {
    slug:        'idempotency',
    title:       'Idempotency',
    description: 'Cara menggunakan Idempotency-Key untuk mencegah request duplikat.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Gunakan header{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">Idempotency-Key</code>{' '}
          untuk mencegah request duplikat. Request yang sama dalam 5 menit dengan key yang sama
          dikembalikan dari cache tanpa menghitung ke limit harian.
        </p>
        <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789" \\
  -H "X-API-Key: kt_live_your_key_here" \\
  -H "Idempotency-Key: order-check-12345"`} />
      </div>
    ),
  },

  {
    slug:        'rate-limiting',
    title:       'Rate Limiting',
    description: 'Informasi batas request harian dan rate limit per IP KawalTransaksi API.',
    content: (
      <div className="space-y-4">
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
      </div>
    ),
  },

  {
    slug:        'keamanan',
    title:       'Keamanan API Key',
    description: 'Praktik terbaik untuk mengamankan API key KawalTransaksi.',
    content: (
      <div className="space-y-3">
        {[
          {
            title: 'Simpan di environment variable',
            desc:  'Jangan hardcode API key di source code. Gunakan .env dan pastikan ada di .gitignore.',
            code:  '# .env\nKAWALTRANSAKSI_API_KEY=kt_live_your_key_here',
          },
          { title: 'Gunakan key test untuk development', desc: 'Generate key environment "test" untuk dev. Simpan key live hanya untuk production.', code: null },
          { title: 'Set expiry date',                    desc: 'Untuk integrasi sementara, set expiry agar key otomatis tidak bisa dipakai setelah selesai.', code: null },
          { title: 'Regenerate kalau dicurigai bocor',   desc: 'Jika key terekspos, segera regenerate. Key lama langsung invalid.', code: null },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 px-4 py-4">
            <p className="text-sm font-bold text-slate-900 mb-1">{item.title}</p>
            <p className="text-sm text-slate-500 leading-relaxed mb-2">{item.desc}</p>
            {item.code && <CodeBlock language="bash" code={item.code} />}
          </div>
        ))}
      </div>
    ),
  },

  {
    slug:        'best-practices',
    title:       'Best Practices',
    description: 'Rekomendasi implementasi KawalTransaksi API untuk production.',
    content: (
      <div className="space-y-3">
        {[
          { title: 'Gunakan di server-side',              desc: 'Jangan panggil API langsung dari browser. Buat endpoint backend sendiri sebagai proxy.' },
          { title: 'Cache response',                      desc: 'Simpan hasil cek di cache untuk nomor yang sama selama beberapa menit.' },
          { title: 'Gunakan Idempotency-Key untuk retry', desc: 'Jika aplikasi melakukan retry otomatis, sertakan Idempotency-Key agar tidak mengurangi limit.' },
          { title: 'Handle error dengan baik',            desc: 'Selalu cek field success. Jika error, jangan blokir user — tampilkan pesan informatif.' },
          { title: 'Monitor sisa request',                desc: 'Pantau meta.requests_remaining. Jika mendekati 0, kurangi frekuensi pengecekan.' },
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
    ),
  },

  {
    slug:        'changelog',
    title:       'Changelog',
    description: 'Riwayat perubahan dan pembaruan KawalTransaksi API.',
    content: (
      <div className="space-y-4">
        {[
          {
            version: 'v1.2', date: '19 Mei 2026',
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Terbaru',
            changes: [
              'Limit dinaikkan dari 100 ke 300 request/hari',
              'Tambah dukungan Idempotency-Key',
              'API key environment: live dan test',
              'Format key baru: kt_live_... dan kt_test_...',
              'Key disimpan sebagai hash di database',
              'Rate limit 60 req/menit per IP',
              'Auto-blacklist IP setelah 10x gagal auth',
              'Cache hasil check nomor 5 menit di KV',
            ],
          },
          {
            version: 'v1.1', date: '1 Mei 2026',
            badge: 'bg-slate-100 text-slate-500 border-slate-200', label: null,
            changes: ['Tambah field expires_at di API key', 'Tambah field last_used_at untuk tracking'],
          },
          {
            version: 'v1.0', date: '15 April 2026',
            badge: 'bg-slate-100 text-slate-500 border-slate-200', label: null,
            changes: [
              'Launch perdana KawalTransaksi API',
              'Endpoint GET /api/v1/check',
              'Free tier 100 request/hari',
              'Autentikasi via X-API-Key header',
            ],
          },
        ].map((release, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-black text-slate-900 font-mono">{release.version}</span>
              {release.label && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${release.badge}`}>
                  {release.label}
                </span>
              )}
              <span className="text-xs text-slate-400 ml-auto">{release.date}</span>
            </div>
            <ul className="space-y-1.5">
              {release.changes.map((change, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500 shrink-0 mt-0.5">–</span>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
  },
];

export function getDocTopic(slug: string): DocTopic | undefined {
  return DOC_TOPICS.find(t => t.slug === slug);
}