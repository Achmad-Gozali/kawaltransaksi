import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 400 });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error('[reCAPTCHA] RECAPTCHA_SECRET_KEY tidak ditemukan di environment variables.');
      return NextResponse.json({ success: false, message: 'Konfigurasi server bermasalah.' }, { status: 500 });
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const res = await fetch(verifyUrl, { method: 'POST' });
    const data = await res.json();

    // Log untuk debugging — hapus setelah production
    console.log('[reCAPTCHA] result:', JSON.stringify(data));

    if (!data.success) {
      return NextResponse.json(
        { success: false, message: 'Verifikasi keamanan gagal. Coba lagi.' },
        { status: 403 }
      );
    }

    // Threshold 0.3 lebih toleran untuk localhost/development
    const threshold = process.env.NODE_ENV === 'production' ? 0.5 : 0.3;
    if (data.score < threshold) {
      console.warn(`[reCAPTCHA] Score terlalu rendah: ${data.score} (threshold: ${threshold})`);
      return NextResponse.json(
        { success: false, message: 'Terdeteksi aktivitas mencurigakan. Coba lagi.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, score: data.score });
  } catch (err) {
    console.error('[reCAPTCHA] Server error:', err);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}