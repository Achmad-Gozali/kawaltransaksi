const FROM = 'KawalTransaksi <noreply@kawaltransaksi.com>';

async function sendEmail({
  to,
  subject,
  html,
  apiKey,
}: {
  to: string;
  subject: string;
  html: string;
  apiKey: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[RESEND] Gagal kirim email ke ${to}:`, err);
  }
}

// ── Auth emails ───────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({
  to,
  fullName,
  apiKey,
}: {
  to: string;
  fullName: string;
  apiKey: string;
}) {
  await sendEmail({
    to,
    apiKey,
    subject: 'Selamat datang di KawalTransaksi!',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1e293b;">
        <img src="https://kawaltransaksi.com/logo.png" alt="KawalTransaksi" width="48" style="border-radius: 12px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Halo, ${fullName}! 👋</h1>
        <p style="color: #475569; margin: 0 0 16px;">Selamat bergabung di <strong>KawalTransaksi</strong> — platform pelaporan penipuan digital terpercaya.</p>
        <p style="color: #475569; margin: 0 0 24px;">Akun kamu sudah aktif dan siap digunakan. Bersama-sama, kita bisa melindungi lebih banyak orang dari ancaman penipuan online.</p>
        <p style="color: #475569; margin: 0 0 8px;">Berikut yang bisa kamu lakukan:</p>
        <ul style="color: #475569; margin: 0 0 24px; padding-left: 20px; line-height: 2;">
          <li>Melaporkan nomor rekening atau e-wallet penipu</li>
          <li>Mengecek nomor yang mencurigakan sebelum bertransaksi</li>
          <li>Melihat riwayat laporan yang sudah kamu buat</li>
        </ul>
        <a href="https://kawaltransaksi.com/dashboard" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">Mulai Sekarang</a>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Email ini dikirim otomatis. Jika kamu tidak merasa mendaftar, abaikan email ini atau hubungi kami di <a href="mailto:kawaltransaksi@gmail.com" style="color: #10b981;">kawaltransaksi@gmail.com</a>.</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail({
  to,
  fullName,
  verificationLink,
  apiKey,
}: {
  to: string;
  fullName: string;
  verificationLink: string;
  apiKey: string;
}) {
  await sendEmail({
    to,
    apiKey,
    subject: 'Satu langkah lagi — verifikasi email kamu',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1e293b;">
        <img src="https://kawaltransaksi.com/logo.png" alt="KawalTransaksi" width="48" style="border-radius: 12px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Halo, ${fullName}!</h1>
        <p style="color: #475569; margin: 0 0 8px;">Terima kasih telah mendaftar di <strong>KawalTransaksi</strong>.</p>
        <p style="color: #475569; margin: 0 0 24px;">Untuk keamanan akunmu, kami perlu memverifikasi bahwa alamat email ini benar-benar milikmu. Klik tombol di bawah untuk menyelesaikan pendaftaran. Tautan ini berlaku selama <strong>1 jam</strong>.</p>
        <a href="${verificationLink}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">Verifikasi Email Saya</a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Atau salin tautan berikut ke browser kamu:<br/><span style="color: #64748b; word-break: break-all;">${verificationLink}</span></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Jika kamu tidak merasa mendaftar di KawalTransaksi, abaikan email ini. Tidak ada tindakan lebih lanjut yang diperlukan.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  fullName,
  resetLink,
  apiKey,
}: {
  to: string;
  fullName: string;
  resetLink: string;
  apiKey: string;
}) {
  await sendEmail({
    to,
    apiKey,
    subject: 'Permintaan reset kata sandi — KawalTransaksi',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1e293b;">
        <img src="https://kawaltransaksi.com/logo.png" alt="KawalTransaksi" width="48" style="border-radius: 12px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Reset Kata Sandi</h1>
        <p style="color: #475569; margin: 0 0 8px;">Halo, <strong>${fullName}</strong>.</p>
        <p style="color: #475569; margin: 0 0 24px;">Kami menerima permintaan untuk mengatur ulang kata sandi akun KawalTransaksi kamu. Klik tombol di bawah untuk membuat kata sandi baru. Tautan ini hanya berlaku selama <strong>1 jam</strong> dan hanya dapat digunakan satu kali.</p>
        <a href="${resetLink}" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">Atur Ulang Kata Sandi</a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Atau salin tautan berikut ke browser kamu:<br/><span style="color: #64748b; word-break: break-all;">${resetLink}</span></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Jika kamu tidak merasa meminta reset kata sandi, abaikan email ini. Kata sandi kamu tidak akan berubah. Jika kamu merasa ada aktivitas mencurigakan, segera hubungi kami di <a href="mailto:kawaltransaksi@gmail.com" style="color: #10b981;">kawaltransaksi@gmail.com</a>.</p>
      </div>
    `,
  });
}

// ── Report emails ─────────────────────────────────────────────────────────────

export async function sendReportCreatedEmail({
  to,
  fullName,
  targetNumber,
  category,
  status,
  reportUrl,
  apiKey,
}: {
  to: string;
  fullName: string;
  targetNumber: string;
  category: string;
  status: 'pending' | 'verified';
  reportUrl: string;
  apiKey: string;
}) {
  const isVerified = status === 'verified';

  const statusBadge = isVerified
    ? '<span style="background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700;">✅ Terverifikasi Otomatis</span>'
    : '<span style="background: #fef9c3; color: #a16207; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700;">⏳ Menunggu Verifikasi</span>';

  const statusDesc = isVerified
    ? 'Laporan kamu memenuhi seluruh kriteria kelengkapan bukti sehingga langsung terverifikasi oleh sistem kami. Nomor ini kini akan tampil sebagai terindikasi penipuan di halaman pengecekan.'
    : 'Laporan kamu telah kami terima dan sedang dalam antrian tinjauan oleh tim KawalTransaksi. Proses verifikasi biasanya memakan waktu 1–3 hari kerja. Kami akan mengirimkan notifikasi begitu status laporan diperbarui.';

  await sendEmail({
    to,
    apiKey,
    subject: 'Laporan kamu telah kami terima — KawalTransaksi',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1e293b;">
        <img src="https://kawaltransaksi.com/logo.png" alt="KawalTransaksi" width="48" style="border-radius: 12px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Laporan Berhasil Dikirim</h1>
        <p style="color: #475569; margin: 0 0 24px;">Halo, <strong>${fullName}</strong>. Terima kasih telah berkontribusi dalam melindungi masyarakat dari penipuan digital. Laporan kamu sangat berarti bagi kami.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Nomor yang dilaporkan</p>
          <p style="margin: 0 0 16px; font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #0f172a;">${targetNumber}</p>
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Kategori penipuan</p>
          <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #0f172a;">${category}</p>
          <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Status laporan</p>
          ${statusBadge}
        </div>
        <p style="color: #475569; margin: 0 0 24px; font-size: 14px; line-height: 1.7;">${statusDesc}</p>
        <a href="${reportUrl}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">Lihat Detail Laporan</a>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Email ini dikirim otomatis. Jangan balas email ini. Jika ada pertanyaan, hubungi kami di <a href="mailto:kawaltransaksi@gmail.com" style="color: #10b981;">kawaltransaksi@gmail.com</a>.</p>
      </div>
    `,
  });
}

export async function sendReportStatusChangedEmail({
  to,
  fullName,
  targetNumber,
  newStatus,
  reportUrl,
  apiKey,
}: {
  to: string;
  fullName: string;
  targetNumber: string;
  newStatus: 'pending' | 'verified' | 'rejected' | 'withdrawn';
  reportUrl: string;
  apiKey: string;
}) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; desc: string; action?: string }> = {
    verified: {
      label: '✅ Terverifikasi',
      color: '#15803d',
      bg: '#dcfce7',
      desc: 'Laporan kamu telah ditinjau dan diverifikasi oleh tim KawalTransaksi. Nomor ini kini resmi terdaftar sebagai terindikasi penipuan dan akan muncul di hasil pengecekan untuk memperingatkan pengguna lain.',
      action: 'Terima kasih atas kontribusimu dalam menjaga keamanan ekosistem digital Indonesia.',
    },
    rejected: {
      label: '❌ Tidak Dapat Diverifikasi',
      color: '#b91c1c',
      bg: '#fee2e2',
      desc: 'Setelah ditinjau, laporan kamu belum dapat diverifikasi karena bukti yang dilampirkan kurang memadai atau tidak memenuhi kriteria pelaporan kami.',
      action: 'Kamu dapat menarik laporan ini dan mengajukan ulang dengan melengkapi bukti seperti tangkapan layar percakapan, bukti transfer, atau informasi pendukung lainnya.',
    },
    pending: {
      label: '⏳ Kembali Menunggu Verifikasi',
      color: '#a16207',
      bg: '#fef9c3',
      desc: 'Laporan kamu kembali masuk ke antrian verifikasi dan sedang ditinjau ulang oleh tim kami. Kami akan menginformasikan hasilnya secepatnya.',
    },
    withdrawn: {
      label: '🔄 Sedang Direvisi',
      color: '#1d4ed8',
      bg: '#dbeafe',
      desc: 'Laporan kamu saat ini berstatus revisi. Kamu dapat melengkapi atau memperbaiki informasi yang ada, lalu mengirimkan ulang laporan untuk ditinjau kembali oleh tim kami.',
      action: 'Pastikan bukti yang kamu lampirkan jelas dan relevan agar proses verifikasi dapat berjalan lebih cepat.',
    },
  };

  const cfg = statusConfig[newStatus] ?? statusConfig['pending'];

  await sendEmail({
    to,
    apiKey,
    subject: 'Pembaruan status laporan kamu — KawalTransaksi',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1e293b;">
        <img src="https://kawaltransaksi.com/logo.png" alt="KawalTransaksi" width="48" style="border-radius: 12px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Status Laporan Diperbarui</h1>
        <p style="color: #475569; margin: 0 0 24px;">Halo, <strong>${fullName}</strong>. Ada kabar terbaru mengenai laporan yang kamu ajukan.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Nomor yang dilaporkan</p>
          <p style="margin: 0 0 16px; font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #0f172a;">${targetNumber}</p>
          <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Status terbaru</p>
          <span style="background: ${cfg.bg}; color: ${cfg.color}; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700;">${cfg.label}</span>
        </div>
        <p style="color: #475569; margin: 0 0 16px; font-size: 14px; line-height: 1.7;">${cfg.desc}</p>
        ${cfg.action ? `<p style="color: #475569; margin: 0 0 24px; font-size: 14px; line-height: 1.7;">${cfg.action}</p>` : '<div style="margin-bottom: 24px;"></div>'}
        <a href="${reportUrl}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">Lihat Detail Laporan</a>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Email ini dikirim otomatis. Jangan balas email ini. Jika ada pertanyaan, hubungi kami di <a href="mailto:kawaltransaksi@gmail.com" style="color: #10b981;">kawaltransaksi@gmail.com</a>.</p>
      </div>
    `,
  });
}

export async function sendNewReportAdminEmail({
  adminEmail,
  reporterName,
  targetNumber,
  category,
  status,
  reportUrl,
  apiKey,
}: {
  adminEmail: string;
  reporterName: string;
  targetNumber: string;
  category: string;
  status: 'pending' | 'verified';
  reportUrl: string;
  apiKey: string;
}) {
  const statusLabel = status === 'verified'
    ? '<span style="background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700;">✅ Terverifikasi Otomatis</span>'
    : '<span style="background: #fef9c3; color: #a16207; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700;">⏳ Perlu Ditinjau</span>';

  await sendEmail({
    to: adminEmail,
    apiKey,
    subject: `[Admin] Laporan baru masuk — ${targetNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1e293b;">
        <img src="https://kawaltransaksi.com/logo.png" alt="KawalTransaksi" width="48" style="border-radius: 12px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Laporan Baru Masuk</h1>
        <p style="color: #475569; margin: 0 0 24px;">Terdapat laporan baru yang memerlukan perhatian kamu di panel admin.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Dilaporkan oleh</p>
          <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #0f172a;">${reporterName}</p>
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Nomor yang dilaporkan</p>
          <p style="margin: 0 0 16px; font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #0f172a;">${targetNumber}</p>
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Kategori penipuan</p>
          <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #0f172a;">${category}</p>
          <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Status otomatis</p>
          ${statusLabel}
        </div>
        <a href="${reportUrl}" style="display: inline-block; background: #1d4ed8; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">Buka di Panel Admin</a>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Email ini dikirim otomatis oleh sistem KawalTransaksi.</p>
      </div>
    `,
  });
}

// ── Feedback email ────────────────────────────────────────────────────────────

export async function sendFeedbackReplyEmail({
  to,
  title,
  adminReply,
  apiKey,
}: {
  to: string;
  title: string;
  adminReply: string;
  apiKey: string;
}) {
  await sendEmail({
    to,
    apiKey,
    subject: 'Tim KawalTransaksi membalas feedback kamu',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1e293b;">
        <img src="https://kawaltransaksi.com/logo.png" alt="KawalTransaksi" width="48" style="border-radius: 12px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Ada Balasan untuk Feedback Kamu</h1>
        <p style="color: #475569; margin: 0 0 24px;">Tim KawalTransaksi telah merespons feedback yang kamu kirimkan.</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Feedback kamu</p>
          <p style="margin: 0 0 20px; font-size: 15px; font-weight: 600; color: #0f172a;">${title}</p>
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Balasan dari tim</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.7; white-space: pre-wrap;">${adminReply}</p>
        </div>

        <p style="color: #475569; margin: 0 0 24px; font-size: 14px; line-height: 1.7;">
          Terima kasih sudah meluangkan waktu untuk memberikan masukan. Feedback kamu sangat membantu kami dalam terus meningkatkan KawalTransaksi.
        </p>

        <a href="https://kawaltransaksi.com" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">Kunjungi KawalTransaksi</a>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Email ini dikirim otomatis. Jangan balas email ini. Jika ada pertanyaan lain, kirim feedback baru melalui tombol di website kami.</p>
      </div>
    `,
  });
}