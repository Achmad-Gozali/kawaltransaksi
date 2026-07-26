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
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Verifikasi Email Anda</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6;">
          Halo <strong>${name}</strong>, terima kasih telah mendaftar di KawalTransaksi. Gunakan kode verifikasi berikut untuk mengaktifkan akun Anda.
        </p>
        <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="font-size:40px;font-weight:900;letter-spacing:8px;color:#0f172a;margin:0;font-family:monospace;">${formatted}</p>
          <p style="font-size:12px;color:#94a3b8;margin:8px 0 0;">Berlaku selama <strong>10 menit</strong></p>
        </div>
        <p style="font-size:13px;color:#64748b;margin:0 0 12px;line-height:1.6;">
          Kode ini diminta dari perangkat yang sedang mendaftarkan akun baru dengan alamat email Anda. Mohon jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku sebagai tim KawalTransaksi — kami tidak pernah meminta kode verifikasi melalui telepon, WhatsApp, atau media sosial.
        </p>
        <p style="font-size:13px;color:#64748b;margin:0;line-height:1.6;">
          Jika Anda tidak melakukan pendaftaran ini, abaikan saja email ini — akun tidak akan aktif tanpa kode ini.
        </p>
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
        <p style="font-size:11px;color:#cbd5e1;margin:0;">© 2026 KawalTransaksi · kawaltransaksi.com</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, resetLink: string) {
  const frontendUrl = process.env.FRONTEND_URL!;
  const requestTime = new Date().toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });

  await getResend().emails.send({
    from:    FROM,
    to:      email,
    subject: "Pengaturan Ulang Kata Sandi KawalTransaksi",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <img src="${frontendUrl}/logo.png" alt="KawalTransaksi" style="height:32px;margin-bottom:24px;" />
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Pengaturan Ulang Kata Sandi</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6;">
          Halo <strong>${name}</strong>, kami menerima permintaan untuk mengatur ulang kata sandi akun KawalTransaksi Anda pada <strong>${requestTime} WIB</strong>.
        </p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;margin-bottom:24px;">
          Atur Ulang Kata Sandi
        </a>
        <p style="font-size:13px;color:#64748b;margin:0 0 12px;line-height:1.6;">
          Tautan ini berlaku selama <strong>1 jam</strong>. Jika Anda tidak mengajukan permintaan ini, abaikan email ini — kata sandi Anda tidak akan berubah kecuali Anda mengklik tautan di atas dan menyelesaikan prosesnya.
        </p>
        <p style="font-size:13px;color:#64748b;margin:0;line-height:1.6;">
          Jika Anda menerima permintaan serupa berulang kali tanpa Anda minta, sebaiknya segera masuk ke akun Anda dan ganti kata sandi sebagai langkah pencegahan.
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
    subject: "Pembaruan Sistem KawalTransaksi — Mohon Atur Ulang Kata Sandi",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <img src="${frontendUrl}/logo.png" alt="KawalTransaksi" style="height:32px;margin-bottom:24px;" />
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Sistem KawalTransaksi Telah Diperbarui</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 16px;line-height:1.6;">
          Halo <strong>${name}</strong>, kami baru saja menyelesaikan pembaruan pada sistem keamanan KawalTransaksi untuk melindungi data pengguna dengan lebih baik. Sebagai bagian dari pembaruan ini, seluruh pengguna perlu membuat kata sandi baru sebelum dapat masuk kembali.
        </p>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6;">
          Akun Anda beserta seluruh riwayat laporan tetap tersimpan aman dan telah dipindahkan sepenuhnya ke sistem baru.
        </p>
        <a href="${frontendUrl}/lupa-kata-sandi" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;margin-bottom:24px;">
          Buat Kata Sandi Baru
        </a>
        <p style="font-size:13px;color:#64748b;margin:0;line-height:1.6;">
          Klik tombol di atas, masukkan alamat email Anda (<strong>${email}</strong>), lalu ikuti instruksi untuk membuat kata sandi baru. Kami mohon maaf atas ketidaknyamanan ini.
        </p>
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
        <p style="font-size:11px;color:#cbd5e1;margin:0;">© 2026 KawalTransaksi · kawaltransaksi.com</p>
      </div>
    `,
  });
}

export interface WeeklyDigestCategoryCount {
  phone: number;
  bank_account: number;
  ewallet: number;
}

export async function sendWeeklyDigestEmail(
  email: string,
  name: string,
  totalReports: number,
  categoryCounts: WeeklyDigestCategoryCount,
) {
  const frontendUrl = process.env.FRONTEND_URL!;

  const categoryLabels: Record<keyof WeeklyDigestCategoryCount, string> = {
    phone:        "Nomor HP/WhatsApp",
    bank_account: "Rekening Bank",
    ewallet:      "E-Wallet",
  };

  const categoryRows = (Object.keys(categoryCounts) as (keyof WeeklyDigestCategoryCount)[])
    .filter(key => categoryCounts[key] > 0)
    .map(key => `
      <tr>
        <td style="padding:10px 0;font-size:14px;color:#475569;border-bottom:1px solid #f1f5f9;">${categoryLabels[key]}</td>
        <td style="padding:10px 0;font-size:14px;color:#0f172a;font-weight:700;text-align:right;border-bottom:1px solid #f1f5f9;">${categoryCounts[key]}</td>
      </tr>
    `).join("");

  await getResend().emails.send({
    from:    FROM,
    to:      email,
    subject: `Ringkasan Mingguan: ${totalReports} Laporan Baru Terverifikasi — KawalTransaksi`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <img src="${frontendUrl}/logo.png" alt="KawalTransaksi" style="height:32px;margin-bottom:24px;" />
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Ringkasan Laporan Minggu Ini</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6;">
          Halo <strong>${name}</strong>, berikut ringkasan laporan penipuan yang berhasil diverifikasi tim KawalTransaksi dalam 7 hari terakhir.
        </p>

        <div style="background:#f8fafc;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="font-size:40px;font-weight:900;color:#0f172a;margin:0;">${totalReports}</p>
          <p style="font-size:12px;color:#94a3b8;margin:4px 0 0;">Laporan baru terverifikasi</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          ${categoryRows}
        </table>

        <a href="${frontendUrl}/laporan-publik" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;margin-bottom:24px;">
          Lihat Semua Laporan
        </a>

        <p style="font-size:13px;color:#64748b;margin:0;line-height:1.6;">
          Modus penipuan terus berkembang — selalu cek nomor HP, rekening, atau e-wallet penerima sebelum bertransaksi, terutama di platform jual-beli online atau transfer dana ke pihak yang tidak dikenal.
        </p>

        <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
        <p style="font-size:11px;color:#cbd5e1;margin:0;">© 2026 KawalTransaksi · kawaltransaksi.com</p>
      </div>
    `,
  });
}