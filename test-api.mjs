const API_URL = 'https://api.kawaltransaksi.com';
const API_KEY = 'kt_test_zPQJr2yGQ6adKfE82SKhX8G15WliRvRlzGE7nxfS';

async function hitUntilLimit() {
  console.log('\n🧪 Test API KawalTransaksi — sampai daily limit\n');
  console.log('─'.repeat(55));

  const check = await fetch(`${API_URL}/api/v1/check?number=08100000000&type=phone`, {
    headers: { 'X-API-Key': API_KEY },
  });
  const checkData = await check.json();

  if (!checkData.success) {
    console.log(`❌ Error awal: ${checkData.message}`);
    process.exit(1);
  }

  console.log(`📊 Status awal: ${checkData.meta.requests_today}/${checkData.meta.daily_limit} requests hari ini`);
  console.log(`   Sisa: ${checkData.meta.requests_remaining} request\n`);

  let requestCount = 1;
  let remaining = checkData.meta.requests_remaining;

  while (remaining > 0) {
    const res = await fetch(`${API_URL}/api/v1/check?number=08100000000&type=phone`, {
      headers: { 'X-API-Key': API_KEY },
    });
    const data = await res.json();
    requestCount++;

    if (res.status === 429) {
      console.log(`\n🛑 Rate limit tercapai setelah ${requestCount} request`);
      console.log(`   Message: ${data.message}`);
      break;
    }

    if (!data.success) {
      console.log(`\n❌ Error: ${JSON.stringify(data)}`);
      break;
    }

    remaining = data.meta.requests_remaining;
    const filled = Math.floor((data.meta.requests_today / data.meta.daily_limit) * 20);
    const bar = '█'.repeat(filled).padEnd(20, '░');
    process.stdout.write(
      `\r   [${bar}] ${data.meta.requests_today}/${data.meta.daily_limit} — sisa: ${remaining}  `
    );

    if (remaining <= 0) {
      console.log(`\n\n✅ Limit tercapai! Total ${requestCount} request dikirim.`);

      console.log('\n📤 Kirim 1 request lagi setelah limit...');
      const finalRes = await fetch(`${API_URL}/api/v1/check?number=08100000000&type=phone`, {
        headers: { 'X-API-Key': API_KEY },
      });
      const finalData = await finalRes.json();

      if (finalRes.status === 429) {
        console.log(`✅ Correctly blocked → 429`);
        console.log(`   "${finalData.message}"`);
      } else {
        console.log(`❌ Tidak di-block! Status: ${finalRes.status}`);
        console.log(`   ${JSON.stringify(finalData)}`);
      }
      break;
    }

    await new Promise(r => setTimeout(r, 30));
  }

  console.log('\n' + '─'.repeat(55));
  console.log('✅ Test selesai!\n');
}

hitUntilLimit().catch(console.error);