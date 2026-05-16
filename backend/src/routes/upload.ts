import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../types';

const upload = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string };
}>();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

function validateMagicBytes(bytes: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  return false;
}

// ── POST /api/upload ──────────────────────────────────────────────────────────
upload.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');

    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ success: false, message: 'File tidak ditemukan.' }, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json({ success: false, message: 'Ukuran file melebihi batas 5MB.' }, 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return c.json({ success: false, message: 'Tipe file tidak didukung. Hanya JPEG dan PNG.' }, 400);
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (!validateMagicBytes(bytes)) {
      return c.json({ success: false, message: 'File tidak valid atau telah dimanipulasi.' }, 400);
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await c.env.BUCKET.put(fileName, buffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
      },
    });

    const publicUrl = `${c.env.R2_PUBLIC_URL}/${fileName}`;

    return c.json({ success: true, url: publicUrl }, 201);
  } catch (err) {
    console.error('[UPLOAD] Error:', err);
    return c.json({ success: false, message: 'Gagal mengupload file.' }, 500);
  }
});

// ── DELETE /api/upload ────────────────────────────────────────────────────────
upload.delete('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { url } = await c.req.json();

    if (!url || typeof url !== 'string') {
      return c.json({ success: false, message: 'URL tidak valid.' }, 400);
    }

    const publicUrl = c.env.R2_PUBLIC_URL;
    if (!url.startsWith(publicUrl)) {
      return c.json({ success: false, message: 'URL tidak diizinkan.' }, 400);
    }

    const fileName = url.replace(`${publicUrl}/`, '');

    // Pastikan user hanya bisa hapus file miliknya sendiri
    if (!fileName.startsWith(`${userId}/`)) {
      return c.json({ success: false, message: 'Akses ditolak.' }, 403);
    }

    await c.env.BUCKET.delete(fileName);

    return c.json({ success: true });
  } catch (err) {
    console.error('[UPLOAD DELETE] Error:', err);
    return c.json({ success: false, message: 'Gagal menghapus file.' }, 500);
  }
});

export default upload;