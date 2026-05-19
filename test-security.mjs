// ============================================================
// test-security.mjs — Test semua fitur keamanan KawalTransaksi API
// Jalankan: node test-security.mjs
// ============================================================

const API_URL = 'https://api.kawaltransaksi.com';
const VALID_KEY = 'kt_test_zPQJr2yGQ6adKfE82SKhX8G15WliRvRlzGE7nxfS'; // kt_live_... atau kt_test_...

const SEPARATOR = '─'.repeat(60);

function log(msg) { console.log(msg); }
function ok(msg)  { console.log(`  ✅ ${msg}`); }
function fail(msg){ console.log(`  ❌ ${msg}`); }
function warn(msg){ console.log(`  ⚠️  ${msg}`); }
function title(msg){ console.log(`\n${SEPARATOR}\n🧪 ${msg}\n${SEPARATOR}`); }

async function req(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options);
  let body;
  try { body = await res.json(); } catch { body = {}; }
  return { status: res.status, body };
}

// ── Test 1: Validasi format key ───────────────────────────────────────────────
async function testKeyFormat() {
  title('TEST 1: Validasi Format Key');

  const badKeys = [
    '',
    'invalid_key',
    'kt_abc123',
    'Bearer kt_live_abc',
    'kt_live_TOOSHORT',
    'kt_unknown_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl', // prefix salah
    'KT_LIVE_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn', // uppercase
  ];

  for (const key of badKeys) {
    const { status, body } = await req('/api/v1/check?number=08100000000&type=phone', {
      headers: { 'X-API-Key': key },
    });
    if (status === 401 && !body.success) {
      ok(`Key "${key.slice(0, 20)}..." → 401 ✓`);
    } else {
      fail(`Key "${key.slice(0, 20)}..." → ${status} (harusnya 401)`);
    }
  }
}

// ── Test 2: Key valid ─────────────────────────────────────────────────────────
async function testValidKey() {
  title('TEST 2: Key Valid');

  if (VALID_KEY === 'GANTI_DENGAN_API_KEY_LO') {
    warn('Skip — ganti VALID_KEY di baris 8 dengan API key lo');
    return;
  }

  const { status, body } = await req('/api/v1/check?number=08100000000&type=phone', {
    headers: { 'X-API-Key': VALID_KEY },
  });

  if (status === 200 && body.success) {
    ok(`Key valid → 200, status: ${body.data.status}`);
    ok(`Meta: ${body.meta.requests_today}/${body.meta.daily_limit} req, env: ${body.meta.environment}`);
  } else {
    fail(`Key valid → ${status}: ${body.message}`);
  }
}

// ── Test 3: Request Deduplication (Idempotency-Key) ───────────────────────────
async function testDeduplication() {
  title('TEST 3: Request Deduplication (Idempotency-Key)');

  if (VALID_KEY === 'GANTI_DENGAN_API_KEY_LO') {
    warn('Skip — butuh VALID_KEY');
    return;
  }

  const idempotencyKey = `test-idem-${Date.now()}`;

  // Request pertama
  const first = await req('/api/v1/check?number=08111111111&type=phone', {
    headers: { 'X-API-Key': VALID_KEY, 'Idempotency-Key': idempotencyKey },
  });

  if (first.status !== 200) {
    fail(`Request pertama gagal: ${first.status} — ${first.body.message}`);
    return;
  }
  ok(`Request pertama → 200 (requests_today: ${first.body.meta.requests_today})`);

  // Request kedua dengan Idempotency-Key yang sama — harusnya cached
  await new Promise(r => setTimeout(r, 500));
  const second = await req('/api/v1/check?number=08111111111&type=phone', {
    headers: { 'X-API-Key': VALID_KEY, 'Idempotency-Key': idempotencyKey },
  });

  if (second.status === 200 && second.body.meta?.idempotent === true) {
    ok(`Request kedua (same Idempotency-Key) → cached, tidak nambah counter ✓`);
    ok(`Flag idempotent: ${second.body.meta.idempotent}`);
  } else if (second.status === 200) {
    warn(`Request kedua → 200 tapi tidak ada flag idempotent (mungkin belum di-deploy)`);
  } else {
    fail(`Request kedua → ${second.status}: ${second.body.message}`);
  }

  // Request ketiga tanpa Idempotency-Key — harusnya nambah counter
  const third = await req('/api/v1/check?number=08111111111&type=phone', {
    headers: { 'X-API-Key': VALID_KEY },
  });

  if (third.status === 200) {
    ok(`Request ketiga (tanpa Idempotency-Key) → 200, counter naik ke ${third.body.meta.requests_today}`);
  }
}

// ── Test 4: Rate limit per IP ─────────────────────────────────────────────────
async function testIpRateLimit() {
  title('TEST 4: Rate Limit per IP (60 req/menit)');
  log('  Kirim 65 request berturut-turut (tanpa delay)...');

  if (VALID_KEY === 'GANTI_DENGAN_API_KEY_LO') {
    warn('Skip — butuh VALID_KEY');
    return;
  }

  let blocked = false;
  let blockedAt = 0;

  for (let i = 1; i <= 65; i++) {
    const { status, body } = await req('/api/v1/check?number=08100000000&type=phone', {
      headers: { 'X-API-Key': VALID_KEY },
    });

    if (status === 429 && body.message?.includes('IP')) {
      blocked = true;
      blockedAt = i;
      ok(`Di-block pada request ke-${i} karena rate limit IP ✓`);
      ok(`Pesan: "${body.message}"`);
      break;
    }

    if (i % 10 === 0) process.stdout.write(`\r  Progress: ${i}/65 request...`);
  }

  if (!blocked) {
    warn('Tidak di-block setelah 65 request — mungkin IP lo sudah reset atau limit belum aktif');
    warn('Note: Rate limit IP 60/menit hanya aktif di production (Cloudflare Workers)');
  }
}

// ── Test 5: Auto-blacklist setelah 10x failed ─────────────────────────────────
async function testAutoBlacklist() {
  title('TEST 5: Auto-blacklist setelah 10x Failed Auth');
  log('  Kirim 12 request dengan key format valid tapi tidak ada di DB...');

  // Generate key format valid tapi tidak ada di DB
  const fakeKey = 'kt_live_FakeKeyThatDoesNotExistInDatabaseXXXXXXXX';

  let blockedAt = 0;
  for (let i = 1; i <= 12; i++) {
    const { status, body } = await req('/api/v1/check?number=08100000000&type=phone', {
      headers: { 'X-API-Key': fakeKey },
    });

    if (status === 403 && body.message?.includes('diblokir')) {
      blockedAt = i;
      ok(`IP di-blacklist pada request ke-${i} ✓`);
      ok(`Pesan: "${body.message}"`);
      break;
    }

    process.stdout.write(`\r  Request ${i}/12: status ${status}...`);
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('');
  if (!blockedAt) {
    warn('IP belum di-blacklist setelah 12 request — mungkin sudah kena dari test sebelumnya');
    warn('Cek tab IP Blacklist di admin panel');
  }
}

// ── Test 6: Honeypot endpoints ────────────────────────────────────────────────
async function testHoneypot() {
  title('TEST 6: Honeypot Endpoints');

  const honeypots = [
    '/api/v1/accounts',
    '/api/v1/reports',
    '/api/v1/keys',
    '/api/v1/token',
    '/api/v1/users',
    '/api/v1/admin',
    '/api/internal',
  ];

  for (const endpoint of honeypots) {
    const { status, body } = await req(endpoint, {
      headers: { 'X-API-Key': VALID_KEY !== 'GANTI_DENGAN_API_KEY_LO' ? VALID_KEY : 'test' },
    });

    if (status === 404) {
      ok(`${endpoint} → 404 (honeypot aktif, IP dicatat) ✓`);
    } else {
      fail(`${endpoint} → ${status} (harusnya 404)`);
    }
  }

  log('\n  Setelah test ini, cek admin panel:');
  log('  - Tab IP Blacklist: IP lo harusnya masuk blacklist');
  log('  - Tab IP Logs: ada log dengan label "scanner"');
}

// ── Test 7: Fake robots.txt ───────────────────────────────────────────────────
async function testRobotsTxt() {
  title('TEST 7: Fake robots.txt');

  const res = await fetch(`${API_URL}/robots.txt`);
  const text = await res.text();

  if (res.status === 200 && text.includes('Disallow: /api/v1/accounts')) {
    ok(`robots.txt ada dan berisi honeypot disallow ✓`);
    log('\n  Isi robots.txt:');
    text.split('\n').forEach(line => log(`  ${line}`));
  } else {
    fail(`robots.txt tidak ada atau tidak berisi disallow (status: ${res.status})`);
  }
}

// ── Test 8: Expired key ───────────────────────────────────────────────────────
async function testExpiredKey() {
  title('TEST 8: Expired Key');
  log('  Generate key dengan expiry 7d dari /developer, lalu test di sini');
  log('  Untuk test ini, lo perlu key yang sudah expired — skip untuk sekarang');
  warn('Skip — butuh key yang sudah expired');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔒 KawalTransaksi — Security Test Suite');
  console.log(`📡 Target: ${API_URL}`);
  console.log(`🔑 Valid Key: ${VALID_KEY === 'GANTI_DENGAN_API_KEY_LO' ? '❌ Belum diset' : '✅ ' + VALID_KEY.slice(0, 15) + '...'}`);

  try {
    await testKeyFormat();
    await testValidKey();
    await testDeduplication();
    await testHoneypot();       // honeypot dulu sebelum IP rate limit
    await testAutoBlacklist();  // ini akan kena blacklist dari honeypot juga
    await testIpRateLimit();
    await testRobotsTxt();
    await testExpiredKey();
  } catch (err) {
    console.error('\n💥 Error tidak terduga:', err.message);
  }

  console.log(`\n${SEPARATOR}`);
  console.log('✅ Test selesai!');
  console.log('\n📋 Yang perlu dicek manual di admin panel:');
  console.log('  1. Tab IP Blacklist — IP lo harusnya masuk (dari honeypot + auto-blacklist)');
  console.log('  2. Tab IP Logs — ada log dengan label "scanner" dan "failed auth"');
  console.log('  3. Tab API Keys — req hari ini naik sesuai jumlah request yang berhasil');
  console.log(`${SEPARATOR}\n`);
}

main().catch(console.error);
