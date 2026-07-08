import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

const FROM = "KawalTransaksi <noreply@kawaltransaksi.com>";

export async function sendOtpEmail(email: string, name: string, otp: string) {
  const frontendUrl = process.env.FRONTEND_URL!;
  const formatted   = `${otp.slice(0, 3)} ${otp.slice(3)}`;

  await getResend().emails.send({
    from:    FROM,
    to:      email,
    subject: `${formatted} — Kode Verifikasi KawalTransaksi`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <img src="${frontendUrl}/logo.png" alt="KawalTransaksi" style="height:32px;margin-bottom:24px;" />
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Verifikasi Email Kamu</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6;">
          Halo <strong>${name}</strong>, masukkan kode OTP berikut untuk mengaktifkan akun KawalTransaksi kamu.
        </p>
        <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="font-size:40px;font-weight:900;letter-spacing:8px;color:#0f172a;margin:0;font-family:monospace;">${formatted}</p>
          <p style="font-size:12px;color:#94a3b8;margin:8px 0 0;">Berlaku selama <strong>10 menit</strong></p>
        </div>
        <p style="font-size:12px;color:#94a3b8;margin:0 0 8px;line-height:1.6;">
          Jangan bagikan kode ini kepada siapapun, termasuk tim KawalTransaksi.
        </p>
        <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;">
          Jika kamu tidak mendaftar, abaikan email ini.
        </p>
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
        <p style="font-size:11px;color:#cbd5e1;margin:0;">© 2026 KawalTransaksi · kawaltransaksi.com</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, resetLink: string) {
  await getResend().emails.send({
    from:    FROM,
    to:      email,
    subject: "Reset Kata Sandi KawalTransaksi",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <img src="${process.env.FRONTEND_URL}/logo.png" alt="KawalTransaksi" style="height:32px;margin-bottom:24px;" />
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Reset Kata Sandi</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6;">
          Halo <strong>${name}</strong>, kami menerima permintaan reset kata sandi untuk akun KawalTransaksi kamu.
        </p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">
          Reset Kata Sandi
        </a>
        <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;line-height:1.6;">
          Link ini berlaku selama <strong>1 jam</strong>. Jika kamu tidak meminta reset kata sandi, abaikan email ini.
        </p>
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
        <p style="font-size:11px;color:#cbd5e1;margin:0;">© 2026 KawalTransaksi · kawaltransaksi.com</p>
      </div>
    `,
  });
}

export async function sendSystemUpdateEmail(email: string, name: string) {
  const frontendUrl = process.env.FRONTEND_URL!;

  await getResend().emails.send({
    from:    FROM,
    to:      email,
    subject: "Pembaruan Sistem KawalTransaksi — Mohon Reset Kata Sandi",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <img src="${frontendUrl}/logo.png" alt="KawalTransaksi" style="height:32px;margin-bottom:24px;" />
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Sistem KawalTransaksi Telah Diperbarui</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 16px;line-height:1.6;">
          Halo <strong>${name}</strong>, kami baru saja menyelesaikan pembaruan besar pada sistem KawalTransaksi untuk meningkatkan keamanan dan performa platform.
        </p>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6;">
          Akun kamu beserta riwayat laporan tetap aman dan sudah kami pindahkan ke sistem baru. Namun, untuk alasan keamanan, kamu perlu <strong>membuat kata sandi baru</strong> sebelum bisa login kembali.
        </p>
        <a href="${frontendUrl}/lupa-kata-sandi" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">
          Buat Kata Sandi Baru
        </a>
        <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;line-height:1.6;">
          Klik tombol di atas, masukkan email kamu (<strong>${email}</strong>), dan ikuti instruksi untuk membuat kata sandi baru.
        </p>
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
        <p style="font-size:11px;color:#cbd5e1;margin:0;">© 2026 KawalTransaksi · kawaltransaksi.com</p>
      </div>
    `,
  });
}