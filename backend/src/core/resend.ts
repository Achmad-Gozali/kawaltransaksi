const FROM = 'KawalTransaksi <noreply@kawaltransaksi.com>';
const SUPPORT = 'kawaltransaksi@gmail.com';
const BASE_URL = 'https://kawaltransaksi.com';
const LOGO = `${BASE_URL}/logo.png`;

// -- Core sender ---------------------------------------------------------------

async function sendEmail({
  to,
  subject,
  html,
  text,
  apiKey,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  apiKey: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<mailto:${SUPPORT}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[RESEND] Gagal kirim email ke ${to}:`, err);
  }
}

// -- HTML helpers --------------------------------------------------------------

function layout(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#1e293b;background:#fff;border-radius:12px;margin-top:24px;">
  <img src="${LOGO}" alt="KawalTransaksi" width="40" style="border-radius:10px;margin-bottom:20px;display:block;" />
  ${content}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
  <p style="font-size:11px;color:#94a3b8;margin:0;">Email ini dikirim otomatis oleh sistem KawalTransaksi. Ada pertanyaan? Hubungi kami di <a href="mailto:${SUPPORT}" style="color:#10b981;">${SUPPORT}</a></p>
</div>
</body></html>`;
}

function btn(href: string, label: string, color = '#10b981') {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:700;font-size:14px;margin-top:4px;">${label}</a>`;
}

function card(rows: [string, string][]) {
  const inner = rows.map(([label, val]) => `
    <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">${label}</p>
    <p style="margin:0 0 14px;font-weight:700;color:#0f172a;">${val}</p>
  `).join('');
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:22px;">${inner}</div>`;
}

function badge(label: string, color: string, bg: string) {
  return `<span style="background:${bg};color:${color};padding:3px 12px;border-radius:999px;font-size:13px;font-weight:700;">${label}</span>`;
}

// -- Auth emails ---------------------------------------------------------------

export async function sendVerificationEmail({ to, fullName, verificationLink, apiKey }: { to: string; fullName: string; verificationLink: string; apiKey: string }) {
  await sendEmail({
    to, apiKey,
    subject: 'Satu langkah lagi - verifikasi email kamu',
    html: layout(`
      <h1 style="font-size:20px;font-weight:900;margin:0 0 8px;">Halo, ${fullName}!</h1>
      <p style="color:#475569;margin:0 0 12px;">Terima kasih telah mendaftar di KawalTransaksi. Untuk menjaga keamanan akunmu, kami perlu memastikan alamat email ini benar-benar milikmu.</p>
      <p style="color:#475569;margin:0 0 20px;">Klik tombol di bawah untuk menyelesaikan pendaftaran. Tautan ini berlaku selama <strong>1 jam</strong>.</p>
      ${btn(verificationLink, 'Verifikasi Email Saya')}
      <p style="color:#94a3b8;font-size:12px;margin-top:18px;">Atau salin tautan ini ke browser kamu:<br/><span style="color:#64748b;word-break:break-all;">${verificationLink}</span></p>
      <p style="color:#94a3b8;font-size:12px;margin-top:14px;">Tidak merasa mendaftar? Abaikan email ini — tidak ada tindakan lebih lanjut yang diperlukan.</p>
    `),
    text: `Halo ${fullName},\n\nVerifikasi email kamu untuk menyelesaikan pendaftaran (berlaku 1 jam):\n${verificationLink}\n\nTidak merasa mendaftar? Abaikan email ini.\n\nSalam,\nTim KawalTransaksi`,
  });
}

export async function sendPasswordResetEmail({ to, fullName, resetLink, apiKey }: { to: string; fullName: string; resetLink: string; apiKey: string }) {
  await sendEmail({
    to, apiKey,
    subject: 'Permintaan reset kata sandi - KawalTransaksi',
    html: layout(`
      <h1 style="font-size:20px;font-weight:900;margin:0 0 8px;">Reset Kata Sandi</h1>
      <p style="color:#475569;margin:0 0 12px;">Halo, <strong>${fullName}</strong>. Kami menerima permintaan untuk mengatur ulang kata sandi akun KawalTransaksi kamu.</p>
      <p style="color:#475569;margin:0 0 20px;">Klik tombol di bawah untuk membuat kata sandi baru. Tautan ini hanya berlaku selama <strong>1 jam</strong> dan hanya dapat digunakan satu kali.</p>
      ${btn(resetLink, 'Atur Ulang Kata Sandi', '#dc2626')}
      <p style="color:#94a3b8;font-size:12px;margin-top:18px;">Atau salin tautan ini ke browser kamu:<br/><span style="color:#64748b;word-break:break-all;">${resetLink}</span></p>
      <p style="color:#94a3b8;font-size:12px;margin-top:14px;">Tidak merasa meminta reset? Abaikan email ini. Kata sandi kamu tidak akan berubah.</p>
    `),
    text: `Halo ${fullName},\n\nReset kata sandi kamu (berlaku 1 jam, hanya bisa digunakan sekali):\n${resetLink}\n\nTidak merasa meminta reset? Abaikan email ini. Kata sandi kamu tidak akan berubah.\n\nSalam,\nTim KawalTransaksi`,
  });
}

// -- Report emails -------------------------------------------------------------

export async function sendReportCreatedEmail({ 
  to, 
  fullName, 
  targetNumber, 
  category, 
  apiKey 
}: { 
  to: string; 
  fullName: string; 
  targetNumber: string; 
  category: string; 
  apiKey: string;
}) {
  await sendEmail({
    to, apiKey,
    subject: 'Laporan kamu telah kami terima - KawalTransaksi',
    html: layout(`
      <h1 style="font-size:20px;font-weight:900;margin:0 0 8px;">Laporan Berhasil Dikirim</h1>
      <p style="color:#475569;margin:0 0 20px;">Halo, <strong>${fullName}</strong>. Terima kasih telah mengambil langkah nyata untuk melindungi orang lain dari penipuan digital. Laporan kamu sudah kami terima.</p>
      ${card([['Nomor yang dilaporkan', targetNumber], ['Kategori penipuan', category]])}
      <p style="color:#475569;margin:0 0 20px;font-size:14px;line-height:1.7;">Laporan kamu sedang dalam antrian tinjauan tim KawalTransaksi. Proses verifikasi biasanya memakan waktu 1–3 hari kerja. Pantau status laporan kamu langsung di dashboard.</p>
      ${btn('https://kawaltransaksi.com/dashboard/laporan', 'Lihat Laporan Saya')}
    `),
    text: `Halo ${fullName},\n\nTerima kasih telah mengambil langkah nyata untuk melindungi orang lain. Laporan kamu sudah kami terima.\n\nNomor: ${targetNumber}\nKategori: ${category}\n\nPantau status laporan kamu di: https://kawaltransaksi.com/dashboard/laporan\n\nSalam,\nTim KawalTransaksi`,
  });
}

export async function sendReportStatusChangedEmail({ to, fullName, targetNumber, newStatus, reportUrl, apiKey }: { to: string; fullName: string; targetNumber: string; newStatus: 'pending' | 'verified' | 'rejected' | 'withdrawn'; reportUrl: string; apiKey: string }) {
  const REPORT_STATUS: Record<string, { label: string; color: string; bg: string; desc: string; action?: string }> = {
    verified: {
      label: 'Terverifikasi',
      color: '#15803d', bg: '#dcfce7',
      desc: 'Laporan kamu telah ditinjau dan resmi diverifikasi oleh tim KawalTransaksi. Nomor ini kini terdaftar sebagai terindikasi penipuan dan akan muncul sebagai peringatan bagi pengguna lain yang melakukan pengecekan.',
      action: 'Kontribusimu nyata — kamu baru saja membantu melindungi orang lain dari ancaman yang sama. Terima kasih.',
    },
    rejected: {
      label: 'Tidak Dapat Diverifikasi',
      color: '#b91c1c', bg: '#fee2e2',
      desc: 'Setelah ditinjau, laporan kamu belum dapat kami verifikasi karena bukti yang dilampirkan kurang memadai atau tidak memenuhi kriteria pelaporan kami.',
      action: 'Kamu bisa menarik laporan ini dan mengajukan ulang dengan melengkapi bukti seperti tangkapan layar percakapan, bukti transfer, atau informasi pendukung lainnya.',
    },
    pending: {
      label: 'Menunggu Verifikasi',
      color: '#a16207', bg: '#fef9c3',
      desc: 'Laporan kamu kembali masuk ke antrian verifikasi dan sedang ditinjau ulang oleh tim kami. Kami akan segera menginformasikan hasilnya.',
    },
    withdrawn: {
      label: 'Sedang Direvisi',
      color: '#1d4ed8', bg: '#dbeafe',
      desc: 'Laporan kamu saat ini berstatus revisi. Kamu dapat melengkapi atau memperbaiki informasi yang ada, lalu mengirimkan ulang untuk ditinjau kembali oleh tim kami.',
      action: 'Tips: semakin lengkap dan jelas bukti yang kamu lampirkan, semakin cepat proses verifikasi dapat diselesaikan.',
    },
  };
  const cfg = REPORT_STATUS[newStatus] ?? REPORT_STATUS['pending'];
  await sendEmail({
    to, apiKey,
    subject: 'Pembaruan status laporan kamu - KawalTransaksi',
    html: layout(`
      <h1 style="font-size:20px;font-weight:900;margin:0 0 8px;">Status Laporan Diperbarui</h1>
      <p style="color:#475569;margin:0 0 20px;">Halo, <strong>${fullName}</strong>. Ada kabar terbaru mengenai laporan yang kamu ajukan.</p>
      ${card([['Nomor yang dilaporkan', targetNumber]])}
      <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;">Status terbaru</p>
      ${badge(cfg.label, cfg.color, cfg.bg)}
      <p style="color:#475569;margin:16px 0 ${cfg.action ? '12px' : '20px'};font-size:14px;line-height:1.7;">${cfg.desc}</p>
      ${cfg.action ? `<p style="color:#475569;margin:0 0 20px;font-size:14px;line-height:1.7;">${cfg.action}</p>` : ''}
      ${btn(reportUrl, 'Lihat Laporan Saya')}
    `),
    text: `Halo ${fullName},\n\nAda pembaruan untuk laporan kamu.\n\nNomor: ${targetNumber}\nStatus: ${cfg.label}\n\n${cfg.desc}${cfg.action ? '\n\n' + cfg.action : ''}\n\nDetail laporan: ${reportUrl}\n\nSalam,\nTim KawalTransaksi`,
  });
}

export async function sendNewReportAdminEmail({ adminEmail, reporterName, targetNumber, category, status, reportUrl, apiKey }: { adminEmail: string; reporterName: string; targetNumber: string; category: string; status: 'pending' | 'verified'; reportUrl: string; apiKey: string }) {
  const statusBadge = status === 'verified'
    ? badge('Terverifikasi Otomatis', '#15803d', '#dcfce7')
    : badge('Perlu Ditinjau', '#a16207', '#fef9c3');

  await sendEmail({
    to: adminEmail, apiKey,
    subject: `[Admin] Laporan baru masuk - ${targetNumber}`,
    html: layout(`
      <h1 style="font-size:20px;font-weight:900;margin:0 0 8px;">Laporan Baru Masuk</h1>
      <p style="color:#475569;margin:0 0 20px;">Terdapat laporan baru yang memerlukan perhatian kamu di panel admin.</p>
      ${card([['Dilaporkan oleh', reporterName], ['Nomor yang dilaporkan', targetNumber], ['Kategori penipuan', category]])}
      <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;">Status otomatis</p>
      ${statusBadge}
      <div style="margin-top:20px;">${btn(reportUrl, 'Buka di Panel Admin', '#1d4ed8')}</div>
    `),
    text: `[Admin] Laporan baru masuk.\n\nDilaporkan oleh: ${reporterName}\nNomor: ${targetNumber}\nKategori: ${category}\nStatus: ${status === 'verified' ? 'Terverifikasi Otomatis' : 'Perlu Ditinjau'}\n\nPanel admin: ${reportUrl}`,
  });
}

// -- Feedback email ------------------------------------------------------------

export async function sendFeedbackReplyEmail({ to, title, adminReply, apiKey }: { to: string; title: string; adminReply: string; apiKey: string }) {
  await sendEmail({
    to, apiKey,
    subject: 'Tim KawalTransaksi membalas feedback kamu',
    html: layout(`
      <h1 style="font-size:20px;font-weight:900;margin:0 0 8px;">Ada Balasan untuk Feedback Kamu</h1>
      <p style="color:#475569;margin:0 0 20px;">Tim KawalTransaksi telah membaca dan merespons feedback yang kamu kirimkan. Kami menghargai setiap masukan yang membantu kami berkembang.</p>
      ${card([['Feedback kamu', title], ['Balasan dari tim', adminReply]])}
      <p style="color:#475569;margin:0 0 20px;font-size:14px;line-height:1.7;">Punya masukan lain? Kami selalu terbuka. Kamu bisa mengirimkan feedback baru kapan saja melalui tombol di website kami.</p>
      ${btn(BASE_URL, 'Kunjungi KawalTransaksi')}
    `),
    text: `Halo,\n\nTim KawalTransaksi membalas feedback kamu.\n\nFeedback kamu:\n${title}\n\nBalasan dari tim:\n${adminReply}\n\nTerima kasih atas masukannya — setiap feedback membantu kami berkembang.\n\nKunjungi: ${BASE_URL}\n\nSalam,\nTim KawalTransaksi`,
  });
}

// -- API Anomaly email ---------------------------------------------------------

export async function sendApiAnomalyEmail({ to, keyId, requestsThisHour, avgPerHour, multiplier, apiKey }: { to: string; keyId: string; requestsThisHour: number; avgPerHour: number; multiplier: number; apiKey: string }) {
  await sendEmail({
    to, apiKey,
    subject: 'Terdeteksi lonjakan penggunaan pada API key kamu - KawalTransaksi',
    html: layout(`
      <h1 style="font-size:20px;font-weight:900;margin:0 0 8px;">Lonjakan Penggunaan API Terdeteksi</h1>
      <p style="color:#475569;margin:0 0 12px;">Sistem kami mendeteksi lonjakan penggunaan yang tidak biasa pada salah satu API key kamu. Email ini dikirim sebagai langkah kehati-hatian.</p>
      <p style="color:#475569;margin:0 0 20px;">Jika ini memang berasal dari aktivitas aplikasi kamu, tidak perlu melakukan apa-apa. Namun jika tidak, segera ambil tindakan di bawah.</p>
      <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:18px;margin-bottom:22px;">
        <p style="margin:0 0 4px;font-size:11px;color:#92400e;text-transform:uppercase;">Key ID</p>
        <p style="margin:0 0 14px;font-size:13px;font-weight:700;font-family:monospace;color:#0f172a;">${keyId}</p>
        <p style="margin:0 0 4px;font-size:11px;color:#92400e;text-transform:uppercase;">Request jam ini vs normal</p>
        <p style="margin:0 0 14px;font-size:18px;font-weight:900;color:#b45309;">${requestsThisHour} request <span style="font-size:14px;color:#64748b;">(normal: ${avgPerHour}/jam)</span></p>
        <p style="margin:0 0 4px;font-size:11px;color:#92400e;text-transform:uppercase;">Lonjakan</p>
        <p style="margin:0;font-size:20px;font-weight:900;color:#dc2626;">${multiplier}x dari biasanya</p>
      </div>
      <p style="color:#475569;margin:0 0 8px;font-size:14px;font-weight:600;">Langkah yang disarankan:</p>
      <ol style="color:#475569;font-size:14px;line-height:2;margin:0 0 20px;padding-left:20px;">
        <li>Periksa apakah ada loop atau bug di aplikasi kamu yang menyebabkan request berlebihan</li>
        <li>Jika kamu merasa key bocor atau disalahgunakan, segera regenerate dari halaman Developer</li>
        <li>Hubungi kami jika butuh bantuan — kami siap membantu</li>
      </ol>
      ${btn(`${BASE_URL}/developer`, 'Kelola API Key Saya', '#f59e0b')}
    `),
    text: `Lonjakan penggunaan API terdeteksi pada key kamu.\n\nKey ID: ${keyId}\nRequest jam ini: ${requestsThisHour}\nNormal: ${avgPerHour}/jam\nLonjakan: ${multiplier}x dari biasanya\n\nJika ini bukan dari aktivitas aplikasi kamu, segera cek atau regenerate key di: ${BASE_URL}/developer\n\nButuh bantuan? Hubungi kami di ${SUPPORT}\n\nSalam,\nTim KawalTransaksi`,
  });
}