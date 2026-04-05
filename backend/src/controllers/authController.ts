import { Request, Response } from 'express';

// POST /api/auth/verify-recaptcha
export async function verifyRecaptcha(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Token tidak ditemukan.' });
      return;
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      res.status(500).json({ success: false, message: 'Konfigurasi server bermasalah.' });
      return;
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    const response = await fetch(verifyUrl, { method: 'POST' });
    
    // Ini doang yang ditambahin (: any) biar TypeScript gak rewel
    const data: any = await response.json();

    if (!data.success) {
      res.status(403).json({ success: false, message: 'Verifikasi keamanan gagal. Coba lagi.' });
      return;
    }

    const threshold = process.env.NODE_ENV === 'production' ? 0.5 : 0.3;
    if (data.score < threshold) {
      res.status(403).json({ success: false, message: 'Terdeteksi aktivitas mencurigakan. Coba lagi.' });
      return;
    }

    res.json({ success: true, score: data.score });
  } catch {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
}