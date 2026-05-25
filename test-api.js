const API_URL = 'https://api.kawaltransaksi.com';
const API_KEY = 'kt_live_52ca227360f98622997c3e80eb8792fb35e37ce7d22da86c'; // ganti dengan API key yang mau di-test sampai limit

async function hitUntilLimit() {
  console.log('\n Test sampai daily limit\n');
  console.log('-'.repeat(50));

  let requestCount = 0;
  let remaining = 999;

  while (remaining > 0) {
    const res = await fetch(`${API_URL}/api/v1/check/08100000000`, {
      headers: { 'X-API-Key': API_KEY },
    });
    const data = await res.json();
    requestCount++;

    if (res.status === 429) {
      console.log(`\n[STOP] Rate limit tercapai setelah ${requestCount} request`);
      console.log(`   Error: ${data.error}`);
      break;
    }

    if (!data.success) {
      console.log(`\n[X] Error: ${data.error}`);
      break;
    }

    remaining = data.meta.remaining;
    const bar = '#'.repeat(Math.floor((data.meta.requests_today / data.meta.daily_limit) * 20));
    process.stdout.write(`\r   Request ${requestCount}: ${data.meta.requests_today}/${data.meta.daily_limit} [${bar.padEnd(20)}] sisa: ${remaining}`);

    if (remaining === 0) {
      console.log(`\n\n[OK] Limit tercapai! Total ${requestCount} request dikirim.`);

      // Test sekali lagi -- harusnya 429
      const finalRes = await fetch(`${API_URL}/api/v1/check/08100000000`, {
        headers: { 'X-API-Key': API_KEY },
      });
      const finalData = await finalRes.json();

      if (finalRes.status === 429) {
        console.log(`[OK] Request setelah limit -> 429 dengan benar`);
        console.log(`   "${finalData.error}"`);
      } else {
        console.log(`[X] Request setelah limit tidak di-block! Status: ${finalRes.status}`);
      }
      break;
    }

    // Delay kecil biar ga terlalu agresif
    await new Promise(r => setTimeout(r, 50));
  }

  console.log('\n' + '-'.repeat(50));
  console.log('[OK] Test selesai!\n');
}

hitUntilLimit().catch(console.error);