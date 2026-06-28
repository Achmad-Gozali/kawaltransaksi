import type { KVNamespace } from '../../types';
import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import type { Env } from '../../types';

const upload = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string };
}>();

const MAX_FILE_SIZE    = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME     = ['image/jpeg', 'image/png'];
const UPLOAD_RL        = { PER_HOUR_USER: 20, PER_HOUR_IP: 30, TTL: 3600 };

// -- Helpers ------------------------------------------------------------------

const validateMagicBytes = (b: Uint8Array) =>
  (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) ||       // JPEG
  (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47); // PNG

async function checkUploadRateLimit(
  limiter: KVNamespace, userId: string, ip: string
): Promise<{ blocked: boolean; reason?: string }> {
  try {
    const [userCount, ipCount] = await Promise.all([
      limiter.get(`rl_upload_user_${userId}`).then(v => parseInt(v ?? '0')),
      limiter.get(`rl_upload_ip_${ip}`).then(v => parseInt(v ?? '0')),
    ]);
    if (userCount >= UPLOAD_RL.PER_HOUR_USER)
      return { blocked: true, reason: `Batas upload tercapai (${UPLOAD_RL.PER_HOUR_USER}x/jam). Coba lagi nanti.` };
    if (ipCount >= UPLOAD_RL.PER_HOUR_IP)
      return { blocked: true, reason: 'Terlalu banyak upload dari perangkat ini. Coba lagi nanti.' };
    await Promise.all([
      limiter.put(`rl_upload_user_${userId}`, (userCount + 1).toString(), { expirationTtl: UPLOAD_RL.TTL }),
      limiter.put(`rl_upload_ip_${ip}`,       (ipCount  + 1).toString(), { expirationTtl: UPLOAD_RL.TTL }),
    ]);
    return { blocked: false };
  } catch (err) {
    console.error('[UPLOAD RATE LIMIT] Error:', err);
    return { blocked: false };
  }
}

// -- POST /api/upload ---------------------------------------------------------

upload.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const ip     = c.req.header('CF-Connecting-IP') || 'anonymous';

    if ((c.get('env') as any).LIMITER && ip !== 'anonymous') {
      const { blocked, reason } = await checkUploadRateLimit((c.get('env') as any).LIMITER, userId, ip);
      if (blocked) return c.json({ success: false, message: reason }, 429);
    }

    const formData = await c.req.formData();
    const file     = formData.get('file') as File | null;

    if (!file)                              return c.json({ success: false, message: 'File tidak ditemukan.' }, 400);
    if (file.size > MAX_FILE_SIZE)          return c.json({ success: false, message: 'Ukuran file melebihi batas 5MB.' }, 400);
    if (!ALLOWED_MIME.includes(file.type))  return c.json({ success: false, message: 'Tipe file tidak didukung. Hanya JPEG dan PNG.' }, 400);

    const buffer = await file.arrayBuffer();
    const bytes  = new Uint8Array(buffer);

    if (!validateMagicBytes(bytes)) return c.json({ success: false, message: 'File tidak valid atau telah dimanipulasi.' }, 400);

    const ext = file.type === 'image/png' ? 'png' : 'jpg';

    // FIX: sanitasi userId untuk mencegah path traversal
    const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
    const fileName   = `${safeUserId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    await (c.get('env') as any).BUCKET.put(fileName, buffer, {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000' },
    });

    return c.json({ success: true, url: `${(c.get('env') as any).R2_PUBLIC_URL}/${fileName}` }, 201);
  } catch (err) {
    console.error('[UPLOAD] Error:', err);
    return c.json({ success: false, message: 'Gagal mengupload file.' }, 500);
  }
});

// -- DELETE /api/upload -------------------------------------------------------

upload.delete('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { url } = await c.req.json();

    if (!url || typeof url !== 'string')        return c.json({ success: false, message: 'URL tidak valid.' }, 400);
    if (!url.startsWith((c.get('env') as any).R2_PUBLIC_URL))   return c.json({ success: false, message: 'URL tidak diizinkan.' }, 400);

    const fileName = url.replace(`${(c.get('env') as any).R2_PUBLIC_URL}/`, '');
    const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');

    if (!fileName.startsWith(`${safeUserId}/`)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);

    await (c.get('env') as any).BUCKET.delete(fileName);
    return c.json({ success: true });
  } catch (err) {
    console.error('[UPLOAD DELETE] Error:', err);
    return c.json({ success: false, message: 'Gagal menghapus file.' }, 500);
  }
});

export default upload;