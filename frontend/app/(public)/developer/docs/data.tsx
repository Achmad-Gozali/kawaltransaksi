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
          terhadap database laporan penipuan komunitas secara real-time. API ini dibangun di atas data laporan yang
          telah melalui proses verifikasi otomatis (robot scoring) dan dapat diandalkan untuk mencegah transaksi
          dengan pihak yang berpotensi melakukan penipuan.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Cocok digunakan untuk: marketplace yang ingin memvalidasi rekening penjual, aplikasi dompet digital
          yang ingin mengecek nomor tujuan transfer, fintech yang melakukan KYC tambahan, atau chatbot customer
          service yang ingin memberi peringatan dini ke pengguna.
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

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Apa yang bisa Anda lakukan dengan API ini?</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              { title: 'Verifikasi nomor HP',     desc: 'Cek apakah nomor HP pernah dilaporkan terkait penipuan (penipuan jual-beli online, modal/investasi bodong, dll).' },
              { title: 'Verifikasi rekening bank', desc: 'Cek rekening bank tujuan transfer sebelum melakukan pembayaran. Mendukung BCA, BRI, BNI, Mandiri, BSI, CIMB, dan bank lainnya.' },
              { title: 'Verifikasi e-wallet',       desc: 'Cek nomor e-wallet (DANA, OVO, GoPay, ShopeePay, LinkAja) yang terhubung dengan laporan penipuan.' },
            ].map((f, i) => (
              <div key={f.title} className={`px-4 py-3.5 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">{f.title}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-emerald-800 mb-1">Mulai dalam 5 menit</p>
          <p className="text-sm text-emerald-700 leading-relaxed">
            Buka halaman <strong>Quick Start</strong> untuk langkah generate API key dan request pertama Anda.
          </p>
        </div>
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
            { step: '1', title: 'Generate API Key',  desc: 'Buat API key dari dashboard developer. Key hanya ditampilkan sekali — simpan di tempat aman. Pilih environment "test" untuk development atau "live" untuk production.' },
            { step: '2', title: 'Pasang di Header',  desc: 'Sertakan API key di header setiap request menggunakan X-API-Key. Jangan kirim API key sebagai query parameter karena bisa tercatat di access log server.' },
            { step: '3', title: 'Baca Response',     desc: 'Cek field status di response: safe, warning, atau danger. Selalu cek field success sebelum membaca data, dan tangani kode error non-200 dengan baik.' },
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

        <p className="text-sm font-bold text-slate-700 mb-1 mt-2">Contoh request pertama Anda</p>
        <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789" \\
  -H "X-API-Key: kt_live_your_key_here"`} />

        <p className="text-sm font-bold text-slate-700 mb-1 mt-4">Dalam berbagai bahasa</p>
        <CodeTabs />

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Contoh response sukses</p>
          <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "number": "08123456789",
    "type": "phone",
    "status": "danger",
    "verified_reports": 3,
    "total_loss": 5000000
  }
}`} />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-amber-800 mb-1">Tips</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            Gunakan key dengan environment <strong>test</strong> selama development. Data yang dikembalikan
            identik dengan key live, tapi tidak mengganggu metrik production Anda.
          </p>
        </div>
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
          API key Anda mengidentifikasi akun dan environment (live/test), serta digunakan untuk menghitung
          kuota harian dan mencatat riwayat penggunaan.
        </p>
        <CodeBlock code="X-API-Key: kt_live_your_api_key_here" language="header" />

        <p className="text-sm font-bold text-slate-700 mb-1 mt-2">Contoh request lengkap</p>
        <CodeBlock language="curl" code={`curl -X GET "https://api.kawaltransaksi.com/api/v1/check?number=08123456789&type=phone" \\
  -H "X-API-Key: kt_live_your_api_key_here" \\
  -H "Accept: application/json"`} />

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Kemungkinan error autentikasi</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              { code: '401', label: 'Header X-API-Key tidak ada',     desc: 'Request tidak menyertakan header X-API-Key sama sekali.' },
              { code: '401', label: 'API key tidak valid',           desc: 'Format key salah atau key tidak ditemukan di database.' },
              { code: '401', label: 'API key tidak aktif',           desc: 'Key telah di-deactivate atau di-regenerate sehingga key lama tidak berlaku.' },
              { code: '401', label: 'API key kadaluarsa',            desc: 'Key memiliki expires_at yang sudah lewat dari waktu saat ini.' },
              { code: '403', label: 'IP diblokir sementara',         desc: 'Terdeteksi terlalu banyak percobaan autentikasi gagal dari IP Anda.' },
            ].map((e, i) => (
              <div key={i} className={`flex items-start gap-4 px-4 py-3.5 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className="text-xs font-black font-mono bg-red-50 text-red-600 px-2 py-1 rounded shrink-0">{e.code}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{e.label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-red-800 mb-1">Jangan expose API key di frontend</p>
          <p className="text-sm text-red-700 leading-relaxed">
            API key harus digunakan di server-side saja. Jangan simpan di kode frontend,
            environment variable client-side (contoh: variabel berprefiks <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_</code>),
            atau repository publik. Jika API key Anda bocor, segera regenerate melalui dashboard.
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
          Setiap API key memiliki environment yang ditentukan saat generate dan{' '}
          <strong>tidak dapat diubah</strong> setelah key dibuat — jika ingin berganti environment, generate key baru.
          Gunakan key <strong>test</strong> untuk development dan key <strong>live</strong> untuk production.
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {[
            { env: 'kt_live_...', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', title: 'Live', desc: 'Untuk production. Request dihitung terhadap limit harian dan tercatat di usage history.' },
            { env: 'kt_test_...', color: 'text-amber-700 bg-amber-50 border-amber-200',       title: 'Test', desc: 'Untuk development dan testing. Data yang dikembalikan sama dengan live, dan tetap dihitung ke limit harian key tersebut.' },
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

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Praktik yang disarankan</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              'Gunakan key test di environment staging/development Anda.',
              'Gunakan key live hanya di environment production.',
              'Jangan pernah commit key live ke version control, bahkan di branch privat.',
              'Set nama key yang deskriptif (misal: "Production - Checkout Service") agar mudah diaudit.',
            ].map((tip, i) => (
              <div key={i} className={`flex items-start gap-2.5 px-4 py-3 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className="text-emerald-500 shrink-0 mt-0.5 text-sm">–</span>
                <p className="text-sm text-slate-600 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-slate-800 mb-1">Catatan</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Field <code className="bg-slate-200 px-1 rounded">meta.environment</code> di setiap response
            menunjukkan environment key yang digunakan pada request tersebut — gunakan untuk memverifikasi
            di sisi Anda bahwa request berasal dari key yang benar.
          </p>
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
          Endpoint ini menerima method <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">GET</code>{' '}
          dengan parameter dikirim melalui query string.
        </p>
        <CodeBlock code="GET https://api.kawaltransaksi.com/api/v1/check" language="endpoint" />

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Query Parameters</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              { param: 'number', type: 'string', req: true,  desc: 'Nomor yang ingin dicek. Hanya angka, tanpa spasi, tanda hubung, atau awalan negara (+62). Contoh: 08123456789. Panjang minimal 5, maksimal 32 digit.' },
              { param: 'type',   type: 'string', req: false, desc: 'Tipe nomor. Nilai: phone (default), bank_account, ewallet.' },
              { param: 'bank',   type: 'string', req: false, desc: 'Kode bank untuk rekening (wajib diisi jika type=bank_account). Nilai: bca, bri, bni, mandiri, bsi, cimb, dan lainnya.' },
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
          <p className="text-sm font-bold text-slate-700 mb-2">Header yang didukung</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              { header: 'X-API-Key',        req: true,  desc: 'API key Anda. Lihat halaman Autentikasi.' },
              { header: 'Idempotency-Key',  req: false, desc: 'Opsional. Mencegah request duplikat dihitung ganda ke limit. Lihat halaman Idempotency.' },
            ].map((h, i) => (
              <div key={h.header} className={`px-4 py-3.5 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <code className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{h.header}</code>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ml-auto ${h.req ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                    {h.req ? 'required' : 'optional'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Contoh Request</p>
          <CodeTabs />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Contoh untuk masing-masing tipe</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nomor HP</p>
              <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789&type=phone" \\
  -H "X-API-Key: kt_live_your_key_here"`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Rekening Bank</p>
              <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=1234567890&type=bank_account&bank=bca" \\
  -H "X-API-Key: kt_live_your_key_here"`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">E-Wallet</p>
              <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789&type=ewallet" \\
  -H "X-API-Key: kt_live_your_key_here"`} />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-amber-800 mb-1">Validasi nomor sebelum request</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            Bersihkan input dari karakter non-digit (spasi, tanda hubung, +62) di sisi aplikasi Anda
            sebelum mengirim ke API, untuk menghindari response 400 Bad Request.
          </p>
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
          Semua response menggunakan format JSON dengan{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">Content-Type: application/json</code>.
          Field{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">success</code>{' '}
          selalu ada untuk menandakan berhasil atau tidak — selalu cek field ini terlebih dahulu sebelum membaca <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">data</code>.
        </p>

        <p className="text-sm font-bold text-slate-700 mb-1">Response sukses</p>
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

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Penjelasan field <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">data</code></p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              { field: 'number',           type: 'string',       desc: 'Nomor yang dicek, sama dengan parameter request.' },
              { field: 'type',             type: 'string',       desc: 'Tipe nomor: phone, bank_account, atau ewallet.' },
              { field: 'status',           type: 'string',       desc: 'Status risiko: safe, warning, atau danger. Lihat tabel di bawah.' },
              { field: 'verified_reports', type: 'number',       desc: 'Jumlah laporan yang sudah diverifikasi terhadap nomor ini.' },
              { field: 'pending_reports',  type: 'number',       desc: 'Jumlah laporan yang masih menunggu verifikasi.' },
              { field: 'total_reports',    type: 'number',       desc: 'Total seluruh laporan (verified + pending), tidak termasuk yang ditarik/withdrawn.' },
              { field: 'total_loss',       type: 'number',       desc: 'Estimasi total kerugian (Rupiah) dari seluruh laporan terhadap nomor ini.' },
              { field: 'last_reported',    type: 'string | null', desc: 'Timestamp ISO 8601 laporan terakhir. Null jika belum pernah dilaporkan.' },
              { field: 'check_url',        type: 'string',       desc: 'URL halaman publik KawalTransaksi untuk nomor ini, bisa ditampilkan ke pengguna Anda untuk detail lebih lanjut.' },
            ].map((f, i) => (
              <div key={f.field} className={`px-4 py-3 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{f.field}</code>
                  <span className="text-xs text-slate-400 font-mono">{f.type}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Penjelasan field <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">meta</code></p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              { field: 'environment',         type: 'string',       desc: 'Environment API key yang digunakan: live atau test.' },
              { field: 'requests_today',      type: 'number',       desc: 'Jumlah request yang sudah terpakai hari ini oleh key ini.' },
              { field: 'daily_limit',         type: 'number',       desc: 'Batas maksimal request per hari untuk key ini.' },
              { field: 'requests_remaining',  type: 'number',       desc: 'Sisa kuota request hari ini (daily_limit - requests_today).' },
              { field: 'expires_at',          type: 'string | null', desc: 'Tanggal kadaluarsa key ini. Null jika tidak ada kadaluarsa.' },
            ].map((f, i) => (
              <div key={f.field} className={`px-4 py-3 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{f.field}</code>
                  <span className="text-xs text-slate-400 font-mono">{f.type}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Status risiko</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              { status: 'safe',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Tidak ditemukan laporan penipuan. Transaksi relatif aman, namun bukan jaminan absolut.' },
              { status: 'warning', color: 'text-amber-700 bg-amber-50 border-amber-200',       desc: 'Ada laporan masuk tapi belum diverifikasi. Tetap waspada dan pertimbangkan verifikasi tambahan.' },
              { status: 'danger',  color: 'text-red-700 bg-red-50 border-red-200',             desc: 'Ada laporan terverifikasi terhadap nomor ini. Sangat disarankan untuk menghindari transaksi.' },
            ].map((s, i) => (
              <div key={s.status} className={`flex items-start gap-4 px-4 py-4 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border font-mono shrink-0 mt-0.5 ${s.color}`}>{s.status}</span>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm font-bold text-slate-700 mb-1 mt-2">Response gagal</p>
        <CodeBlock language="json" code={`{
  "success": false,
  "message": "Nomor tidak valid (min 5, maks 32 digit)."
}`} />

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">HTTP Status Code</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              { code: '200', label: 'OK',                 desc: 'Request berhasil diproses.' },
              { code: '400', label: 'Bad Request',        desc: 'Parameter tidak valid — misal nomor kosong, terlalu panjang, atau tipe tidak dikenal.' },
              { code: '401', label: 'Unauthorized',       desc: 'API key tidak valid, tidak aktif, atau sudah kadaluarsa.' },
              { code: '403', label: 'Forbidden',          desc: 'IP Anda diblokir sementara karena aktivitas mencurigakan.' },
              { code: '429', label: 'Too Many Requests',  desc: 'Batas request harian sudah tercapai. Reset besok 00:00 WIB.' },
              { code: '500', label: 'Server Error',       desc: 'Terjadi kesalahan di server kami. Coba lagi beberapa saat, hubungi support jika berulang.' },
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
          dikembalikan dari cache tanpa menghitung ke limit harian. Ini sangat berguna untuk aplikasi
          yang melakukan retry otomatis akibat timeout jaringan.
        </p>

        <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789" \\
  -H "X-API-Key: kt_live_your_key_here" \\
  -H "Idempotency-Key: order-check-12345"`} />

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Cara kerja</p>
          <div className="space-y-3">
            {[
              { step: '1', desc: 'Anda mengirim request pertama dengan Idempotency-Key tertentu, misal order-check-12345.' },
              { step: '2', desc: 'Server memproses request secara normal dan menyimpan hasilnya ke cache selama 5 menit, terkait dengan key tersebut.' },
              { step: '3', desc: 'Jika Anda mengirim ulang request dengan Idempotency-Key yang sama dalam 5 menit, server mengembalikan hasil dari cache — tanpa mengurangi kuota harian Anda.' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-4 bg-white rounded-xl border border-slate-100 px-4 py-4">
                <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black text-white">{item.step}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Rekomendasi membuat key</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              'Gunakan identifier unik dari sistem Anda, misalnya order ID atau transaction ID.',
              'Jangan gunakan nilai yang sama untuk dua request dengan parameter berbeda — hasil cache akan keliru.',
              'Panjang maksimal 128 karakter, hanya huruf, angka, tanda hubung, dan underscore.',
            ].map((tip, i) => (
              <div key={i} className={`flex items-start gap-2.5 px-4 py-3 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className="text-emerald-500 shrink-0 mt-0.5 text-sm">–</span>
                <p className="text-sm text-slate-600 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-slate-800 mb-1">Kapan sebaiknya digunakan</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Gunakan Idempotency-Key untuk semua alur retry otomatis (misal pada job queue atau webhook).
            Tidak diperlukan untuk request interaktif biasa seperti pengecekan langsung dari form pengguna.
          </p>
        </div>
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
          Selain limit harian per key, terdapat juga rate limit per alamat IP untuk mencegah penyalahgunaan.
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

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Cara memantau sisa kuota</p>
          <p className="text-sm text-slate-600 leading-relaxed mb-2">
            Setiap response sukses menyertakan informasi kuota di field <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">meta</code>:
          </p>
          <CodeBlock language="json" code={`{
  "meta": {
    "environment": "live",
    "requests_today": 287,
    "daily_limit": 300,
    "requests_remaining": 13,
    "expires_at": null
  }
}`} />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Contoh respons saat limit tercapai</p>
          <CodeBlock language="json" code={`{
  "success": false,
  "message": "Batas request harian sudah tercapai. Reset besok 00:00 WIB."
}`} />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Strategi menghindari rate limit</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {[
              'Cache hasil pengecekan di sisi Anda selama beberapa menit untuk nomor yang sering dicek berulang.',
              'Gunakan Idempotency-Key untuk request retry agar tidak mengurangi kuota dua kali.',
              'Pantau meta.requests_remaining dan kurangi frekuensi pengecekan jika mendekati 0.',
              'Jika kebutuhan Anda melebihi 300 request/hari secara konsisten, daftar minat untuk plan Pro yang sedang dikembangkan (5.000 request/hari).',
            ].map((tip, i) => (
              <div key={i} className={`flex items-start gap-2.5 px-4 py-3 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className="text-emerald-500 shrink-0 mt-0.5 text-sm">–</span>
                <p className="text-sm text-slate-600 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-red-800 mb-1">Tentang pemblokiran IP</p>
          <p className="text-sm text-red-700 leading-relaxed">
            IP yang melakukan terlalu banyak percobaan autentikasi gagal (API key salah/tidak valid) secara
            berturut-turut akan diblokir otomatis selama 24 jam. Jika Anda yakin ini adalah kesalahan,
            hubungi <a href="mailto:kawaltransaksi@gmail.com" className="font-bold underline">kawaltransaksi@gmail.com</a>.
          </p>
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
        <p className="text-sm text-slate-600 leading-relaxed mb-1">
          API key memberi akses langsung ke kuota dan data akun Anda. Berikut praktik yang disarankan
          untuk mencegah penyalahgunaan.
        </p>
        {[
          {
            title: 'Simpan di environment variable',
            desc:  'Jangan hardcode API key di source code. Gunakan .env dan pastikan ada di .gitignore agar tidak ikut ter-commit ke repository.',
            code:  '# .env\nKAWALTRANSAKSI_API_KEY=kt_live_your_key_here',
          },
          {
            title: 'Gunakan key test untuk development',
            desc:  'Generate key environment "test" untuk dev. Simpan key live hanya untuk production, dan batasi siapa saja yang punya akses ke key tersebut.',
            code:  null,
          },
          {
            title: 'Set expiry date untuk integrasi sementara',
            desc:  'Untuk integrasi pihak ketiga sementara atau proyek percobaan, set expiry agar key otomatis tidak bisa dipakai lagi setelah selesai, tanpa Anda harus mengingat untuk menghapusnya manual.',
            code:  null,
          },
          {
            title: 'Regenerate kalau dicurigai bocor',
            desc:  'Jika key terekspos (misal tidak sengaja ter-commit ke repo publik, atau bocor di log), segera regenerate dari dashboard. Key lama langsung invalid dan tidak bisa dipakai lagi.',
            code:  null,
          },
          {
            title: 'Jangan bagikan API key antar tim tanpa kontrol',
            desc:  'Buat key terpisah untuk setiap service atau anggota tim yang membutuhkan, dengan nama yang deskriptif. Ini memudahkan Anda melacak dan mencabut akses individual tanpa mengganggu service lain.',
            code:  null,
          },
          {
            title: 'Proxy lewat backend Anda sendiri',
            desc:  'Jangan panggil API langsung dari kode yang berjalan di browser pengguna. Buat endpoint backend Anda sendiri yang meneruskan request ke KawalTransaksi API, sehingga key tidak pernah terlihat oleh klien.',
            code:  null,
          },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 px-4 py-4">
            <p className="text-sm font-bold text-slate-900 mb-1">{item.title}</p>
            <p className="text-sm text-slate-500 leading-relaxed mb-2">{item.desc}</p>
            {item.code && <CodeBlock language="bash" code={item.code} />}
          </div>
        ))}

        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-2">
          <p className="text-sm font-bold text-red-800 mb-1">Jika terjadi insiden</p>
          <p className="text-sm text-red-700 leading-relaxed">
            Segera regenerate API key yang terdampak, audit usage history untuk aktivitas tidak wajar,
            dan hubungi <a href="mailto:kawaltransaksi@gmail.com" className="font-bold underline">kawaltransaksi@gmail.com</a> jika
            Anda melihat penggunaan kuota yang tidak Anda lakukan sendiri.
          </p>
        </div>
      </div>
    ),
  },

  {
    slug:        'best-practices',
    title:       'Best Practices',
    description: 'Rekomendasi implementasi KawalTransaksi API untuk production.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-600 leading-relaxed mb-1">
          Kumpulan rekomendasi untuk mengintegrasikan KawalTransaksi API secara andal di production.
        </p>
        {[
          { title: 'Gunakan di server-side',              desc: 'Jangan panggil API langsung dari browser. Buat endpoint backend sendiri sebagai proxy, sehingga API key tidak pernah terekspos ke klien.' },
          { title: 'Cache response',                      desc: 'Simpan hasil cek di cache (Redis, in-memory, atau KV) untuk nomor yang sama selama beberapa menit. Mengurangi beban kuota dan mempercepat response ke pengguna Anda.' },
          { title: 'Gunakan Idempotency-Key untuk retry', desc: 'Jika aplikasi melakukan retry otomatis akibat timeout, sertakan Idempotency-Key agar tidak mengurangi limit dua kali untuk request yang secara logis sama.' },
          { title: 'Handle error dengan baik',            desc: 'Selalu cek field success terlebih dahulu. Jika error, jangan blokir alur transaksi pengguna secara keras — tampilkan pesan informatif dan biarkan pengguna melanjutkan dengan kebijaksanaan sendiri.' },
          { title: 'Monitor sisa request',                desc: 'Pantau meta.requests_remaining di setiap response. Jika mendekati 0, kurangi frekuensi pengecekan atau pertimbangkan upgrade plan.' },
          { title: 'Tampilkan check_url ke pengguna',      desc: 'Field check_url mengarah ke halaman publik KawalTransaksi yang menampilkan detail laporan. Ini membangun kepercayaan karena pengguna bisa memverifikasi sendiri.' },
          { title: 'Set timeout request yang wajar',       desc: 'Set timeout HTTP client Anda ke sekitar 5-10 detik. Jika API tidak merespons dalam waktu tersebut, anggap sebagai gagal dan jangan blokir transaksi pengguna karenanya.' },
          { title: 'Jangan jadikan satu-satunya pertimbangan', desc: 'Status danger/warning adalah sinyal kuat, bukan keputusan absolut. Kombinasikan dengan proses verifikasi internal Anda sendiri untuk keputusan akhir.' },
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

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mt-2">
          <p className="text-sm font-bold text-slate-800 mb-1">Contoh pola caching sederhana</p>
          <p className="text-sm text-slate-600 leading-relaxed mb-2">
            Periksa cache lokal Anda terlebih dahulu sebelum memanggil API, dan simpan hasilnya untuk
            request berikutnya dalam window waktu singkat.
          </p>
          <CodeBlock language="javascript" code={`async function checkNumberCached(number, type = 'phone') {
  const cacheKey = \`check:\${type}:\${number}\`;
  const cached = await cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const res = await fetch(
    \`https://api.kawaltransaksi.com/api/v1/check?number=\${number}&type=\${type}\`,
    { headers: { 'X-API-Key': process.env.KAWALTRANSAKSI_API_KEY } }
  );
  const data = await res.json();

  await cache.set(cacheKey, JSON.stringify(data), { ttl: 300 }); // 5 menit
  return data;
}`} />
        </div>
      </div>
    ),
  },

  {
    slug:        'changelog',
    title:       'Changelog',
    description: 'Riwayat perubahan dan pembaruan KawalTransaksi API.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Riwayat lengkap perubahan pada KawalTransaksi API. Kami berkomitmen menjaga backward compatibility —
          perubahan yang sifatnya breaking akan diumumkan minimal 30 hari sebelumnya melalui email ke pemilik API key aktif.
        </p>
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

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-slate-800 mb-1">Ingin diberitahu update selanjutnya?</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Pemilik API key aktif otomatis menerima email saat ada perubahan penting pada API.
            Pastikan email akun Anda selalu valid dan dapat diakses.
          </p>
        </div>
      </div>
    ),
  },
];

export function getDocTopic(slug: string): DocTopic | undefined {
  return DOC_TOPICS.find(t => t.slug === slug);
}