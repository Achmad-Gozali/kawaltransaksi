import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createId } from "@paralleldrive/cuid2";

export type UploadFolder = "reports" | "articles";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);
const MAX_SIZE = 5 * 1024 * 1024;

const R2_BUCKET     = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!.replace(/\/$/, ""); // buang trailing slash kalau ada

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  ext?: ".jpg" | ".png";
}

export function validateImageBuffer(buffer: Buffer, mimetype: string): ImageValidationResult {
  if (!ALLOWED_MIME.has(mimetype)) {
    return { valid: false, error: "Tipe file tidak didukung. Hanya JPEG dan PNG." };
  }

  if (buffer.length > MAX_SIZE) {
    return { valid: false, error: "Ukuran file melebihi batas 5MB." };
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  if (!isJpeg && !isPng) {
    return { valid: false, error: "File tidak valid atau telah dimanipulasi." };
  }

  return { valid: true, ext: mimetype === "image/png" ? ".png" : ".jpg" };
}

function contentTypeFromExt(ext: string): string {
  return ext === ".png" ? "image/png" : "image/jpeg";
}

/**
 * Simpan buffer ke Cloudflare R2, kembalikan URL publik lengkap.
 * Signature sengaja dipertahankan sama seperti versi filesystem lama
 * (buffer, originalName, folder) => Promise<string> supaya semua pemanggil
 * (reports.route.ts, admin.route.ts, upload.route.ts) tidak perlu diubah.
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  folder: UploadFolder
): Promise<string> {
  const ext = originalName.includes(".") ? originalName.slice(originalName.lastIndexOf(".")) : "";
  const key = `${folder}/${createId()}${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket:      R2_BUCKET,
      Key:         key,
      Body:        buffer,
      ContentType: contentTypeFromExt(ext),
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Hapus file dari R2 berdasarkan URL publiknya.
 * Menerima baik URL R2 penuh (https://img.kawaltransaksi.com/reports/xxx.jpg)
 * maupun path lama gaya filesystem (/uploads/reports/xxx.jpg) untuk kompatibilitas
 * mundur selama migrasi — path lama akan di-skip dengan aman (tidak throw)
 * karena filenya memang tidak lagi ada di R2.
 */
export async function deleteFile(url: string | null | undefined): Promise<void> {
  if (!url) return;

  let key: string | null = null;

  if (url.startsWith(R2_PUBLIC_URL)) {
    key = url.slice(R2_PUBLIC_URL.length + 1); // +1 buang leading slash
  } else if (url.startsWith("/uploads/")) {
    // URL lama dari era filesystem — sudah tidak relevan pasca migrasi, skip saja
    return;
  }

  if (!key) return;

  try {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch (err: any) {
    // Kalau object memang sudah tidak ada, jangan sampai bikin request gagal
    if (err.name !== "NoSuchKey") throw err;
  }
}