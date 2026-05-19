// test-autoblock.mjs — Test auto-blacklist setelah 10x failed auth
// Jalankan: node test-autoblock.mjs

const API_URL  = 'https://api.kawaltransaksi.com';

// Key format valid tapi tidak ada di DB
const FAKE_KEY = 'kt_live_FakeKeyThatDoesNotExistInDatabaseXXXXXXXX';

const SEPARATOR = '─'.repeat(55);

async function main() {
  console.log('\n🔒 Test Auto-blacklist — 10x Failed Auth\n');
  console.log(SEPARATOR);
  console.log('Kirim request dengan key valid format tapi tidak ada di DB...\n');

  for (let i = 1; i <= 13; i++) {
    const res  = await fetch(`${API_URL}/api/v1/check?number=08100000000&type=phone`, {
      headers: { 'X-API-Key': FAKE_KEY },
    });
    const body = await res.json();

    if (res.status === 403) {
      console.log(`\n✅ Request ke-${i} → 403 IP diblokir!`);
      console.log(`   Pesan: "${body.message}"`);
      console.log(`\n   Blacklist aktif setelah ${i} request ✓`);
      break;
    } else if (res.status === 401) {
      console.log(`   Request ke-${i} → 401 (key tidak valid) — failed attempt ke-${i} dicatat`);
    } else {
      console.log(`   Request ke-${i} → ${res.status}: ${body.message}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n${SEPARATOR}`);
  console.log('Cek admin panel → tab IP Blacklist untuk konfirmasi.\n');
}

main().catch(console.error);
