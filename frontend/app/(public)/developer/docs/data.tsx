import { CodeBlock, CodeTabs } from '@/features/developer/components/CodeBlock';

export interface DocTopic {
  slug:        string;
  title:       string;
  description: string;
  content:     React.ReactNode;
}

const InfoBox = ({ color, title, children }: { color: 'emerald' | 'amber' | 'red' | 'slate'; title: string; children: React.ReactNode }) => {
  const styles = {
    emerald: 'bg-emerald-50 border-emerald-200 [&_p:first-child]:text-emerald-800 [&_p:last-child]:text-emerald-700',
    amber:   'bg-amber-50 border-amber-200 [&_p:first-child]:text-amber-800 [&_p:last-child]:text-amber-700',
    red:     'bg-red-50 border-red-200 [&_p:first-child]:text-red-800 [&_p:last-child]:text-red-700',
    slate:   'bg-slate-50 border-slate-200 [&_p:first-child]:text-slate-800 [&_p:last-child]:text-slate-600',
  };
  return (
    <div className={`border rounded-xl px-4 py-3 ${styles[color]}`}>
      <p className="text-sm font-bold mb-1">{title}</p>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
};

const Table = ({ rows }: { rows: { left: React.ReactNode; right: React.ReactNode; sub?: string }[] }) => (
  <div className="rounded-xl border border-slate-200 overflow-hidden">
    {rows.map((r, i) => (
      <div key={i} className={`px-4 py-3.5 bg-white ${i > 0 ? 'border-t border-slate-100' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="shrink-0">{r.left}</div>
          <div>
            <p className="text-sm text-slate-600 leading-relaxed">{r.right}</p>
            {r.sub && <p className="text-xs text-slate-400 mt-0.5">{r.sub}</p>}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const mono = (s: string, cls = 'bg-slate-100 text-slate-700') =>
  <code className={`text-xs font-mono px-1.5 py-0.5 rounded ${cls}`}>{s}</code>;

const badge = (label: string, cls: string) =>
  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border font-mono ${cls}`}>{label}</span>;

const statusDot = (s: 'safe' | 'warning' | 'danger') => {
  const m = { safe: 'text-emerald-700 bg-emerald-50 border-emerald-200', warning: 'text-amber-700 bg-amber-50 border-amber-200', danger: 'text-red-700 bg-red-50 border-red-200' };
  return <span className={`text-xs font-bold px-3 py-1 rounded-lg border font-mono ${m[s]}`}>{s}</span>;
};

export const DOC_TOPICS: DocTopic[] = [
  {
    slug:        'overview',
    title:       'Overview',
    description: 'Pengenalan KawalTransaksi API — REST API untuk verifikasi nomor HP, rekening bank, dan e-wallet.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          KawalTransaksi API adalah REST API untuk memverifikasi nomor HP, rekening bank, dan e-wallet terhadap
          database laporan penipuan komunitas secara real-time. Data telah melalui proses scoring otomatis
          dan dapat diintegrasikan langsung ke alur transaksi Anda.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Cocok untuk: marketplace yang ingin memvalidasi rekening penjual, aplikasi dompet digital yang ingin
          mengecek nomor tujuan transfer, fintech untuk KYC tambahan, atau chatbot yang ingin memberi peringatan
          dini ke pengguna.
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
        <Table rows={[
          { left: <p className="text-sm font-semibold text-slate-800">Verifikasi nomor HP</p>,      right: 'Cek apakah nomor HP pernah dilaporkan terkait penipuan.' },
          { left: <p className="text-sm font-semibold text-slate-800">Verifikasi rekening bank</p>, right: 'Cek rekening bank tujuan transfer. Mendukung BCA, BRI, BNI, Mandiri, BSI, CIMB, dan lainnya.' },
          { left: <p className="text-sm font-semibold text-slate-800">Verifikasi e-wallet</p>,      right: 'Cek nomor DANA, OVO, GoPay, ShopeePay, dan LinkAja.' },
        ]} />
        <InfoBox color="emerald" title="Mulai dalam 5 menit">
          Buka halaman <strong>Quick Start</strong> untuk langkah generate API key dan request pertama Anda.
        </InfoBox>
      </div>
    ),
  },

  {
    slug:        'quick-start',
    title:       'Quick Start',
    description: 'Mulai gunakan KawalTransaksi API dalam 3 langkah mudah.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">Mulai gunakan API dalam 3 langkah.</p>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Generate API Key',  desc: 'Buat API key dari dashboard developer. Key hanya ditampilkan sekali — simpan di tempat aman.' },
            { step: '2', title: 'Pasang di Header',  desc: 'Sertakan API key di setiap request via header X-API-Key. Jangan kirim sebagai query parameter.' },
            { step: '3', title: 'Baca Response',     desc: 'Cek field success terlebih dahulu, lalu baca status di data: safe, warning, atau danger.' },
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
        <p className="text-sm font-bold text-slate-700 mb-1">Contoh request pertama</p>
        <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789" \\
  -H "X-API-Key: kt_live_your_key_here"`} />
        <p className="text-sm font-bold text-slate-700 mb-1 mt-2">Dalam berbagai bahasa</p>
        <CodeTabs />
        <p className="text-sm font-bold text-slate-700 mb-1">Contoh response</p>
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
        <InfoBox color="amber" title="Tips">
          Gunakan key environment <strong>test</strong> selama development agar tidak mengganggu metrik production.
        </InfoBox>
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
          Semua request harus menyertakan API key di header {mono('X-API-Key')}.
          Key mengidentifikasi akun dan environment, serta digunakan untuk menghitung kuota harian.
        </p>
        <CodeBlock code="X-API-Key: kt_live_your_api_key_here" language="header" />
        <p className="text-sm font-bold text-slate-700 mb-1">Contoh request</p>
        <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789&type=phone" \\
  -H "X-API-Key: kt_live_your_api_key_here" \\
  -H "Accept: application/json"`} />
        <p className="text-sm font-bold text-slate-700 mb-2">Error autentikasi</p>
        <Table rows={[
          { left: mono('401', 'bg-red-50 text-red-600'), right: 'Header X-API-Key tidak ada, format salah, key tidak ditemukan, tidak aktif, atau sudah kadaluarsa.' },
          { left: mono('403', 'bg-red-50 text-red-600'), right: 'IP diblokir sementara karena terlalu banyak percobaan autentikasi gagal.' },
        ]} />
        <InfoBox color="red" title="Jangan expose API key di frontend">
          Gunakan API key di server-side saja. Jangan simpan di variabel berprefiks {mono('NEXT_PUBLIC_')} atau repository publik.
          Jika bocor, segera regenerate melalui dashboard.
        </InfoBox>
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
          Environment ditentukan saat generate key dan <strong>tidak dapat diubah</strong> — jika ingin berganti,
          generate key baru. Gunakan {mono('test')} untuk development, {mono('live')} untuk production.
        </p>
        <Table rows={[
          {
            left: badge('Live', 'text-emerald-700 bg-emerald-50 border-emerald-200'),
            right: 'Untuk production. Request dihitung ke limit harian dan tercatat di usage history.',
            sub: 'Prefix: kt_live_...',
          },
          {
            left: badge('Test', 'text-amber-700 bg-amber-50 border-amber-200'),
            right: 'Untuk development. Data yang dikembalikan sama dengan live, dan tetap dihitung ke limit harian key tersebut.',
            sub: 'Prefix: kt_test_...',
          },
        ]} />
        <InfoBox color="slate" title="Catatan">
          Field {mono('meta.environment')} di setiap response menunjukkan environment key yang digunakan —
          gunakan untuk memverifikasi bahwa request berasal dari key yang benar.
        </InfoBox>
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
          Menerima method {mono('GET')} dengan parameter via query string.
        </p>
        <CodeBlock code="GET https://api.kawaltransaksi.com/api/v1/check" language="endpoint" />
        <p className="text-sm font-bold text-slate-700 mb-2">Query Parameters</p>
        <Table rows={[
          {
            left: mono('number', 'bg-emerald-50 text-emerald-700'),
            right: 'Nomor yang dicek. Hanya angka, tanpa spasi atau tanda hubung. Contoh: 08123456789.',
            sub: 'required · string · min 5, maks 32 digit',
          },
          {
            left: mono('type', 'bg-emerald-50 text-emerald-700'),
            right: 'Tipe nomor. Nilai: phone (default), bank_account, ewallet.',
            sub: 'optional · string',
          },
          {
            left: mono('bank', 'bg-emerald-50 text-emerald-700'),
            right: 'Kode bank (wajib jika type=bank_account). Contoh: bca, bri, bni, mandiri, bsi, cimb.',
            sub: 'optional · string',
          },
        ]} />
        <p className="text-sm font-bold text-slate-700 mb-2">Headers</p>
        <Table rows={[
          { left: mono('X-API-Key'),       right: 'API key Anda.', sub: 'required' },
          { left: mono('Idempotency-Key'), right: 'Mencegah request duplikat dihitung ganda ke limit. Lihat halaman Idempotency.', sub: 'optional' },
        ]} />
        <p className="text-sm font-bold text-slate-700 mb-2">Contoh per tipe</p>
        <div className="space-y-3">
          {[
            { label: 'Nomor HP',      code: `curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789&type=phone" \\\n  -H "X-API-Key: kt_live_your_key_here"` },
            { label: 'Rekening Bank', code: `curl "https://api.kawaltransaksi.com/api/v1/check?number=1234567890&type=bank_account&bank=bca" \\\n  -H "X-API-Key: kt_live_your_key_here"` },
            { label: 'E-Wallet',      code: `curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789&type=ewallet" \\\n  -H "X-API-Key: kt_live_your_key_here"` },
          ].map(({ label, code }) => (
            <div key={label}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</p>
              <CodeBlock language="curl" code={code} />
            </div>
          ))}
        </div>
        <p className="text-sm font-bold text-slate-700 mb-2 mt-2">Dalam berbagai bahasa</p>
        <CodeTabs />
        <InfoBox color="amber" title="Validasi sebelum request">
          Bersihkan input dari karakter non-digit (+62, spasi, tanda hubung) di sisi aplikasi Anda
          sebelum mengirim ke API untuk menghindari error 400.
        </InfoBox>
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
          Semua response JSON. Field {mono('success')} selalu ada — selalu cek ini sebelum membaca {mono('data')}.
        </p>
        <p className="text-sm font-bold text-slate-700 mb-1">Response sukses</p>
        <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "number": "08123456789",
    "type": "phone",
    "bank": null,
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
        <p className="text-sm font-bold text-slate-700 mb-2">Field {mono('data')}</p>
        <Table rows={[
          { left: mono('number',           'bg-emerald-50 text-emerald-700'), right: 'Nomor yang dicek.' },
          { left: mono('type',             'bg-emerald-50 text-emerald-700'), right: 'Tipe nomor: phone, bank_account, atau ewallet.' },
          { left: mono('bank',             'bg-emerald-50 text-emerald-700'), right: 'Kode bank jika type=bank_account, null jika tidak ada.' },
          { left: mono('status',           'bg-emerald-50 text-emerald-700'), right: 'Status risiko: safe, warning, atau danger.' },
          { left: mono('verified_reports', 'bg-emerald-50 text-emerald-700'), right: 'Jumlah laporan yang sudah diverifikasi.' },
          { left: mono('pending_reports',  'bg-emerald-50 text-emerald-700'), right: 'Jumlah laporan yang masih menunggu verifikasi.' },
          { left: mono('total_reports',    'bg-emerald-50 text-emerald-700'), right: 'Total laporan (verified + pending), tidak termasuk yang withdrawn.' },
          { left: mono('total_loss',       'bg-emerald-50 text-emerald-700'), right: 'Estimasi total kerugian (Rupiah) dari seluruh laporan.' },
          { left: mono('last_reported',    'bg-emerald-50 text-emerald-700'), right: 'Timestamp ISO 8601 laporan terakhir. Null jika belum pernah dilaporkan.' },
          { left: mono('check_url',        'bg-emerald-50 text-emerald-700'), right: 'URL halaman publik KawalTransaksi untuk nomor ini.' },
        ]} />
        <p className="text-sm font-bold text-slate-700 mb-2">Field {mono('meta')}</p>
        <Table rows={[
          { left: mono('environment'),        right: 'Environment key yang digunakan: live atau test.' },
          { left: mono('requests_today'),     right: 'Jumlah request yang sudah terpakai hari ini.' },
          { left: mono('daily_limit'),        right: 'Batas maksimal request per hari.' },
          { left: mono('requests_remaining'), right: 'Sisa kuota hari ini (daily_limit - requests_today).' },
          { left: mono('expires_at'),         right: 'Tanggal kadaluarsa key. Null jika tidak ada batas.' },
        ]} />
        <p className="text-sm font-bold text-slate-700 mb-2">Status risiko</p>
        <Table rows={[
          { left: statusDot('safe'),    right: 'Tidak ada laporan. Transaksi relatif aman, tapi bukan jaminan absolut.' },
          { left: statusDot('warning'), right: 'Ada laporan masuk tapi belum diverifikasi. Tetap waspada.' },
          { left: statusDot('danger'),  right: 'Ada laporan terverifikasi. Sangat disarankan hindari transaksi.' },
        ]} />
        <p className="text-sm font-bold text-slate-700 mb-1">Response gagal</p>
        <CodeBlock language="json" code={`{ "success": false, "message": "Nomor tidak valid (min 5, maks 32 digit)." }`} />
        <p className="text-sm font-bold text-slate-700 mb-2">HTTP Status Code</p>
        <Table rows={[
          { left: mono('200'), right: 'Request berhasil diproses.' },
          { left: mono('400'), right: 'Parameter tidak valid — nomor kosong, terlalu panjang, atau tipe tidak dikenal.' },
          { left: mono('401'), right: 'API key tidak valid, tidak aktif, atau sudah kadaluarsa.' },
          { left: mono('403'), right: 'IP Anda diblokir sementara karena aktivitas mencurigakan.' },
          { left: mono('429'), right: 'Batas request harian tercapai. Reset besok 00:00 WIB.' },
          { left: mono('500'), right: 'Kesalahan di server. Coba lagi beberapa saat.' },
        ]} />
      </div>
    ),
  },

  {
    slug:        'playground',
    title:       'Playground',
    description: 'Coba KawalTransaksi API langsung dari browser tanpa API key.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Playground memungkinkan Anda mencoba API langsung dari browser tanpa API key.
          Hasilnya identik dengan endpoint {mono('/api/v1/check')}, menggunakan data real dari database.
        </p>
        <CodeBlock code="POST https://api.kawaltransaksi.com/api/developer/playground" language="endpoint" />
        <p className="text-sm font-bold text-slate-700 mb-2">Request Body</p>
        <CodeBlock language="json" code={`{
  "number": "08123456789",
  "type": "phone",
  "bank": null
}`} />
        <p className="text-sm font-bold text-slate-700 mb-2">Batas penggunaan</p>
        <Table rows={[
          { left: <p className="text-sm font-semibold text-slate-700">Guest</p>,           right: '5 request/jam per IP.' },
          { left: <p className="text-sm font-semibold text-slate-700">Login</p>, right: '10 request/jam per IP. Kirim Authorization header dengan Bearer token Supabase Anda.' },
        ]} />
        <p className="text-sm font-bold text-slate-700 mb-1">Contoh response</p>
        <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "number": "08123456789",
    "type": "phone",
    "status": "safe",
    "verified_reports": 0,
    "pending_reports": 0,
    "total_reports": 0,
    "total_loss": 0,
    "last_reported": null,
    "check_url": "https://kawaltransaksi.com/check/08123456789"
  },
  "meta": { "playground": true, "authenticated": false }
}`} />
        <InfoBox color="amber" title="Tidak untuk production">
          Playground tidak memerlukan API key dan memiliki limit ketat. Gunakan {mono('/api/v1/check')}
          dengan API key untuk integrasi production.
        </InfoBox>
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
          Header {mono('Idempotency-Key')} mencegah request duplikat dihitung ke limit harian.
          Request dengan key yang sama dalam 5 menit dikembalikan dari cache tanpa mengurangi kuota.
          Berguna untuk aplikasi yang melakukan retry otomatis akibat timeout jaringan.
        </p>
        <CodeBlock language="curl" code={`curl "https://api.kawaltransaksi.com/api/v1/check?number=08123456789" \\
  -H "X-API-Key: kt_live_your_key_here" \\
  -H "Idempotency-Key: order-check-12345"`} />
        <p className="text-sm font-bold text-slate-700 mb-2">Cara kerja</p>
        <div className="space-y-2">
          {[
            'Request pertama diproses normal, hasilnya disimpan ke cache 5 menit.',
            'Request berikutnya dengan key yang sama dalam 5 menit mengembalikan hasil cache, tanpa mengurangi kuota.',
            'Response dari cache menyertakan field meta.idempotent: true.',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3">
              <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-black text-white">{i + 1}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
        <Table rows={[
          { left: <p className="text-sm font-semibold text-slate-700">Format</p>,  right: 'Hanya huruf, angka, tanda hubung, dan underscore. Maks 128 karakter.' },
          { left: <p className="text-sm font-semibold text-slate-700">Rekomendasi</p>, right: 'Gunakan identifier unik dari sistem Anda, misalnya order ID atau transaction ID.' },
          { left: <p className="text-sm font-semibold text-slate-700">Perhatian</p>,  right: 'Jangan gunakan key yang sama untuk dua request dengan parameter berbeda — hasil cache akan keliru.' },
        ]} />
        <InfoBox color="slate" title="Kapan digunakan">
          Gunakan untuk semua alur retry otomatis seperti job queue atau webhook.
          Tidak perlu untuk request interaktif biasa dari form pengguna.
        </InfoBox>
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
          Setiap API key memiliki batas request harian yang reset otomatis pukul 00:00 WIB.
          Selain itu, ada rate limit per IP untuk mencegah penyalahgunaan.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Free Tier',       value: '300 request/hari' },
            { label: 'Reset',           value: 'Setiap 00:00 WIB' },
            { label: 'Rate limit IP',   value: '60 req/menit per IP' },
            { label: 'Max API Key',     value: '5 key per akun' },
            { label: 'Melebihi limit',  value: 'HTTP 429' },
            { label: 'IP terblokir',    value: 'HTTP 403' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-lg px-4 py-3 border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-sm font-bold text-slate-700 mb-1">Pantau kuota via field {mono('meta')}</p>
        <CodeBlock language="json" code={`{
  "meta": {
    "requests_today": 287,
    "daily_limit": 300,
    "requests_remaining": 13
  }
}`} />
        <p className="text-sm font-bold text-slate-700 mb-1">Response saat limit tercapai</p>
        <CodeBlock language="json" code={`{ "success": false, "message": "Batas harian tercapai (300 request/hari). Reset besok." }`} />
        <Table rows={[
          { left: <p className="text-sm font-semibold text-slate-700">Cache response</p>,       right: 'Simpan hasil cek untuk nomor yang sering dicek berulang selama beberapa menit.' },
          { left: <p className="text-sm font-semibold text-slate-700">Idempotency-Key</p>,      right: 'Gunakan untuk retry agar tidak mengurangi kuota dua kali.' },
          { left: <p className="text-sm font-semibold text-slate-700">Monitor remaining</p>,    right: 'Kurangi frekuensi pengecekan jika meta.requests_remaining mendekati 0.' },
        ]} />
        <InfoBox color="red" title="Pemblokiran IP">
          IP yang terlalu sering gagal autentikasi (API key salah) dalam window 5 menit akan diblokir
          otomatis selama 24 jam. Hubungi{' '}
          <a href="mailto:kawaltransaksi@gmail.com" className="font-bold underline">kawaltransaksi@gmail.com</a>{' '}
          jika Anda yakin ini adalah kesalahan.
        </InfoBox>
      </div>
    ),
  },

  {
    slug:        'error-handling',
    title:       'Error Handling',
    description: 'Pola penanganan error dan strategi retry yang direkomendasikan.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Selalu cek field {mono('success')} sebelum membaca {mono('data')}. Jangan blokir alur transaksi
          pengguna secara keras hanya karena API error — tampilkan pesan informatif dan biarkan pengguna
          memutuskan sendiri.
        </p>
        <p className="text-sm font-bold text-slate-700 mb-2">Kapan retry aman dilakukan</p>
        <Table rows={[
          { left: mono('429'), right: 'Tunggu sampai reset 00:00 WIB atau kurangi frekuensi request.' },
          { left: mono('500'), right: 'Aman untuk di-retry dengan exponential backoff. Jika terus berulang, hubungi support.' },
          { left: mono('400'), right: 'Jangan retry. Perbaiki parameter request terlebih dahulu.' },
          { left: mono('401'), right: 'Jangan retry. Periksa API key Anda.' },
          { left: mono('403'), right: 'Jangan retry. IP Anda diblokir — hubungi support.' },
        ]} />
        <p className="text-sm font-bold text-slate-700 mb-1">Contoh error handling (JavaScript)</p>
        <CodeBlock language="javascript" code={`async function checkNumber(number, type = 'phone') {
  const res = await fetch(
    \`https://api.kawaltransaksi.com/api/v1/check?number=\${number}&type=\${type}\`,
    {
      headers: { 'X-API-Key': process.env.KAWALTRANSAKSI_API_KEY },
      signal: AbortSignal.timeout(8000),
    }
  );

  const json = await res.json();

  if (!json.success) {
    if (res.status === 429) throw new Error('QUOTA_EXCEEDED');
    if (res.status === 401) throw new Error('INVALID_KEY');
    throw new Error(json.message ?? 'API_ERROR');
  }

  return json.data;
}`} />
        <InfoBox color="slate" title="Set timeout yang wajar">
          Set timeout HTTP client ke 5–10 detik. Jika API tidak merespons, jangan blokir transaksi
          pengguna — catat error dan lanjutkan dengan kebijakan fallback Anda.
        </InfoBox>
      </div>
    ),
  },

  {
    slug:        'limits',
    title:       'Limits & Quota',
    description: 'Ringkasan semua batas dan ketentuan quota KawalTransaksi API.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Semua angka limit yang berlaku di KawalTransaksi API, terpusat di satu halaman.
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {[
            { category: 'API Key',       items: [['Maks key per akun', '5'], ['Request/hari (Free)', '300'], ['Reset harian', '00:00 WIB'], ['Maks nama key', '50 karakter']] },
            { category: 'Rate Limit IP', items: [['Request/menit per IP (endpoint /check)', '60'], ['Playground guest', '5 req/jam'], ['Playground login', '10 req/jam']] },
            { category: 'Idempotency',   items: [['Window cache', '5 menit'], ['Maks panjang key', '128 karakter'], ['Karakter valid', 'huruf, angka, -, _']] },
            { category: 'Parameter',     items: [['Panjang number', '5–32 digit'], ['Tipe valid', 'phone, bank_account, ewallet']] },
            { category: 'Blacklist IP',  items: [['Trigger', 'Terlalu banyak gagal auth dalam 5 menit'], ['Durasi blokir', '24 jam']] },
          ].map((section, si) => (
            <div key={section.category} className={si > 0 ? 'border-t border-slate-200' : ''}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 pt-3 pb-1">{section.category}</p>
              {section.items.map(([label, value], ii) => (
                <div key={label} className={`flex items-center justify-between px-4 py-2.5 bg-white ${ii < section.items.length - 1 ? 'border-t border-slate-50' : ''}`}>
                  <p className="text-sm text-slate-600">{label}</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono">{value}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
        <InfoBox color="emerald" title="Butuh lebih dari 300 request/hari?">
          Daftar minat untuk plan Pro yang sedang dikembangkan (5.000 request/hari) dengan menghubungi{' '}
          <a href="mailto:kawaltransaksi@gmail.com" className="font-bold underline">kawaltransaksi@gmail.com</a>.
        </InfoBox>
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
          API key memberi akses langsung ke kuota dan data akun Anda. Berikut praktik yang disarankan.
        </p>
        {[
          {
            title: 'Simpan di environment variable',
            desc:  'Jangan hardcode API key di source code. Gunakan .env dan pastikan masuk .gitignore.',
            code:  '# .env\nKAWALTRANSAKSI_API_KEY=kt_live_your_key_here',
          },
          { title: 'Gunakan key test untuk development',     desc: 'Simpan key live hanya untuk production dan batasi siapa saja yang punya akses.',                                                          code: null },
          { title: 'Set expiry untuk integrasi sementara',   desc: 'Untuk proyek percobaan atau integrasi pihak ketiga, set expiry agar key nonaktif otomatis setelah selesai.',                               code: null },
          { title: 'Regenerate jika dicurigai bocor',        desc: 'Jika key terekspos (misalnya ter-commit ke repo publik), segera regenerate dari dashboard. Key lama langsung invalid.',                    code: null },
          { title: 'Buat key terpisah per service',          desc: 'Buat key terpisah untuk setiap service atau anggota tim. Ini memudahkan pencabutan akses individual tanpa mengganggu service lain.',       code: null },
          { title: 'Proxy lewat backend Anda',               desc: 'Jangan panggil API langsung dari browser. Buat endpoint backend sebagai proxy agar key tidak pernah terlihat oleh klien.',                 code: null },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 px-4 py-4">
            <p className="text-sm font-bold text-slate-900 mb-1">{item.title}</p>
            <p className="text-sm text-slate-500 leading-relaxed mb-2">{item.desc}</p>
            {item.code && <CodeBlock language="bash" code={item.code} />}
          </div>
        ))}
        <InfoBox color="red" title="Jika terjadi insiden">
          Segera regenerate key yang terdampak, audit usage history, dan hubungi{' '}
          <a href="mailto:kawaltransaksi@gmail.com" className="font-bold underline">kawaltransaksi@gmail.com</a>{' '}
          jika ada penggunaan kuota yang tidak Anda lakukan.
        </InfoBox>
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
          Rekomendasi untuk mengintegrasikan KawalTransaksi API secara andal di production.
        </p>
        {[
          { title: 'Gunakan di server-side',               desc: 'Jangan panggil API dari browser. Buat endpoint backend sebagai proxy agar key tidak terekspos ke klien.' },
          { title: 'Cache response',                       desc: 'Simpan hasil cek di cache (Redis, in-memory, atau KV) untuk nomor yang sama selama beberapa menit. Mengurangi beban kuota.' },
          { title: 'Idempotency-Key untuk retry',          desc: 'Sertakan Idempotency-Key untuk semua retry otomatis agar tidak mengurangi limit dua kali.' },
          { title: 'Handle error dengan baik',             desc: 'Jika API error, jangan blokir alur transaksi pengguna secara keras. Catat error dan biarkan pengguna melanjutkan.' },
          { title: 'Monitor sisa request',                 desc: 'Pantau meta.requests_remaining di setiap response. Jika mendekati 0, kurangi frekuensi pengecekan.' },
          { title: 'Tampilkan check_url ke pengguna',      desc: 'Field check_url mengarah ke halaman publik KawalTransaksi dengan detail laporan, membantu membangun kepercayaan.' },
          { title: 'Set timeout yang wajar',               desc: 'Set timeout HTTP client ke 5–10 detik. Jika API tidak merespons, jangan blokir transaksi pengguna.' },
          { title: 'Jangan jadikan satu-satunya penentu',  desc: 'Status danger/warning adalah sinyal kuat, bukan keputusan absolut. Kombinasikan dengan proses verifikasi internal Anda.' },
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
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-slate-800 mb-2">Contoh caching sederhana</p>
          <CodeBlock language="javascript" code={`async function checkNumberCached(number, type = 'phone') {
  const cacheKey = \`check:\${type}:\${number}\`;
  const cached = await cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const res = await fetch(
    \`https://api.kawaltransaksi.com/api/v1/check?number=\${number}&type=\${type}\`,
    { headers: { 'X-API-Key': process.env.KAWALTRANSAKSI_API_KEY } }
  );
  const data = await res.json();

  await cache.set(cacheKey, JSON.stringify(data), { ttl: 300 });
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
          Kami berkomitmen menjaga backward compatibility — perubahan breaking diumumkan minimal
          30 hari sebelumnya melalui email ke pemilik API key aktif.
        </p>
        {[
          {
            version: 'v1.2', date: '19 Mei 2026',
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Terbaru',
            changes: [
              'Limit dinaikkan dari 100 ke 300 request/hari',
              'Tambah dukungan Idempotency-Key (cache 5 menit)',
              'API key environment: live dan test dengan prefix kt_live_ / kt_test_',
              'Key disimpan sebagai SHA-256 hash di database',
              'Rate limit 60 req/menit per IP untuk endpoint /check',
              'Auto-blacklist IP setelah terlalu banyak gagal auth dalam window 5 menit (blokir 24 jam)',
              'Cache hasil check nomor 5 menit di KV',
              'Playground endpoint: 5 req/jam (guest), 10 req/jam (login)',
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
        <InfoBox color="slate" title="Ingin diberitahu update selanjutnya?">
          Pemilik API key aktif otomatis menerima email saat ada perubahan penting.
          Pastikan email akun Anda selalu valid dan dapat diakses.
        </InfoBox>
      </div>
    ),
  },
];

export function getDocTopic(slug: string): DocTopic | undefined {
  return DOC_TOPICS.find(t => t.slug === slug);
}