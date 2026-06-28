import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth.middleware';
import { kv } from '../../core/redis';
import { getEnv } from '../../types';

const upload = new Hono();

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME  = ['image/jpeg', 'image/png'];
const UPLOAD_RL     = { PER_HOUR_USER: 20, PER_HOUR_IP: 30, TTL: 3600 };

const getIp = (c: any) =>
  c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'anonymous';

const validateMagicBytes = (b: Uint8Array) =>
  (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) ||
  (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47);

async function checkUploadRateLimit(userId: string, ip: string): Promise<{ blocked: boolean; reason?: string }> {
  try {
    const [userCount, ipCount] = await Promise.all([
      kv.get(`rl_upload_user_${userId}`).then(v => parseInt(v ?? '0')),
      kv.get(`rl_upload_ip_${ip}`).then(v => parseInt(v ?? '0')),
    ]);
    if (userCount >= UPLOAD_RL.PER_HOUR_USER)
      return { blocked: true, reason: `Batas upload tercapai (${UPLOAD_RL.PER_HOUR_USER}x/jam).` };
    if (ipCount >= UPLOAD_RL.PER_HOUR_IP)
      return { blocked: true, reason: 'Terlalu banyak upload dari perangkat ini.' };
    await Promise.all([
      kv.put(`rl_upload_user_${userId}`, (userCount + 1).toString(), { expirationTtl: UPLOAD_RL.TTL }),
      kv.put(`rl_upload_ip_${ip}`, (ipCount + 1).toString(), { expirationTtl: UPLOAD_RL.TTL }),
    ]);
    return { blocked: false };
  } catch {
    return { blocked: false };
  }
}

async function uploadToR2(fileName: string, buffer: ArrayBuffer, contentType: string): Promise<string> {
  const env = getEnv();
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.R2_ACCOUNT_ID}/r2/buckets/${env.R2_BUCKET_NAME}/objects/${fileName}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${env.R2_SECRET_ACCESS_KEY}`,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    },
    body: buffer,
  });
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`);
  return `${env.R2_PUBLIC_URL}/${fileName}`;
}

async function deleteFromR2(fileName: string): Promise<void> {
  const env = getEnv();
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.R2_ACCOUNT_ID}/r2/buckets/${env.R2_BUCKET_NAME}/objects/${fileName}`;
  await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${env.R2_SECRET_ACCESS_KEY}` },
  });
}

upload.post('/', authMiddleware, async (c) => {
  try {
    const env    = getEnv();
    const userId = c.get('userId');
    const ip     = getIp(c);

    if (ip !== 'anonymous') {
      const { blocked, reason } = await checkUploadRateLimit(userId, ip);
      if (blocked) return c.json({ success: false, message: reason }, 429);
    }

    const formData = await c.req.formData();
    const file     = formData.get('file') as File | null;

    if (!file) return c.json({ success: false, message: 'File tidak ditemukan.' }, 400);
    if (file.size > MAX_FILE_SIZE) return c.json({ success: false, message: 'Ukuran file melebihi batas 5MB.' }, 400);
    if (!ALLOWED_MIME.includes(file.type)) return c.json({ success: false, message: 'Tipe file tidak didukung. Hanya JPEG dan PNG.' }, 400);

    const buffer = await file.arrayBuffer();
    const bytes  = new Uint8Array(buffer);
    if (!validateMagicBytes(bytes)) return c.json({ success: false, message: 'File tidak valid.' }, 400);

    const ext      = file.type === 'image/png' ? 'png' : 'jpg';
    const safeId   = userId.replace(/[^a-zA-Z0-9-]/g, '');
    const fileName = `${safeId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const publicUrl = await uploadToR2(fileName, buffer, file.type);
    return c.json({ success: true, url: publicUrl }, 201);
  } catch (err) {
    console.error('[UPLOAD] Error:', err);
    return c.json({ success: false, message: 'Gagal mengupload file.' }, 500);
  }
});

upload.delete('/', authMiddleware, async (c) => {
  try {
    const env    = getEnv();
    const userId = c.get('userId');
    const { url } = await c.req.json();

    if (!url || typeof url !== 'string') return c.json({ success: false, message: 'URL tidak valid.' }, 400);
    if (!url.startsWith(env.R2_PUBLIC_URL)) return c.json({ success: false, message: 'URL tidak diizinkan.' }, 400);

    const fileName   = url.replace(`${env.R2_PUBLIC_URL}/`, '');
    const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
    if (!fileName.startsWith(`${safeUserId}/`)) return c.json({ success: false, message: 'Akses ditolak.' }, 403);

    await deleteFromR2(fileName);
    return c.json({ success: true });
  } catch (err) {
    console.error('[UPLOAD DELETE] Error:', err);
    return c.json({ success: false, message: 'Gagal menghapus file.' }, 500);
  }
});

export default upload;