export async function sendWelcomeEmail({
  to,
  fullName,
  apiKey,
}: {
  to: string;
  fullName: string;
  apiKey: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'KawalTransaksi <noreply@kawaltransaksi.com>',
      to: [to],
      subject: 'Selamat datang di KawalTransaksi!',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1e293b;">
          <img src="https://kawaltransaksi.com/logo.png" alt="KawalTransaksi" width="48" style="border-radius: 12px; margin-bottom: 24px;" />
          <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Halo, ${fullName}!</h1>
          <p style="color: #475569; margin: 0 0 24px;">Akun kamu di <strong>KawalTransaksi</strong> berhasil dibuat. Kamu sekarang bisa melaporkan dan mengecek nomor rekening atau e-wallet yang mencurigakan.</p>
          <a href="https://kawaltransaksi.com/dashboard" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">Masuk ke Dashboard</a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">Jika kamu tidak merasa mendaftar, abaikan email ini.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[RESEND] Gagal kirim welcome email:', err);
  }
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
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'KawalTransaksi <noreply@kawaltransaksi.com>',
      to: [to],
      subject: 'Verifikasi Email Kamu — KawalTransaksi',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1e293b;">
          <img src="https://kawaltransaksi.com/logo.png" alt="KawalTransaksi" width="48" style="border-radius: 12px; margin-bottom: 24px;" />
          <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Halo, ${fullName}!</h1>
          <p style="color: #475569; margin: 0 0 8px;">Terima kasih sudah mendaftar di <strong>KawalTransaksi</strong>.</p>
          <p style="color: #475569; margin: 0 0 24px;">Klik tombol di bawah untuk verifikasi email kamu. Link berlaku selama <strong>1 jam</strong>.</p>
          <a href="${verificationLink}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">Verifikasi Email Saya</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Atau copy link ini ke browser kamu:<br/><span style="color: #64748b; word-break: break-all;">${verificationLink}</span></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">Jika kamu tidak merasa mendaftar, abaikan email ini.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[RESEND] Gagal kirim verification email:', err);
  }
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
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'KawalTransaksi <noreply@kawaltransaksi.com>',
      to: [to],
      subject: 'Reset Kata Sandi — KawalTransaksi',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1e293b;">
          <img src="https://kawaltransaksi.com/logo.png" alt="KawalTransaksi" width="48" style="border-radius: 12px; margin-bottom: 24px;" />
          <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Reset Kata Sandi</h1>
          <p style="color: #475569; margin: 0 0 8px;">Halo, <strong>${fullName}</strong>.</p>
          <p style="color: #475569; margin: 0 0 24px;">Kami menerima permintaan untuk mereset kata sandi akun KawalTransaksi kamu. Klik tombol di bawah untuk membuat kata sandi baru. Link berlaku selama <strong>1 jam</strong>.</p>
          <a href="${resetLink}" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">Reset Kata Sandi Saya</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Atau copy link ini ke browser kamu:<br/><span style="color: #64748b; word-break: break-all;">${resetLink}</span></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">Jika kamu tidak merasa meminta reset kata sandi, abaikan email ini. Kata sandi kamu tidak akan berubah.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[RESEND] Gagal kirim reset password email:', err);
  }
}