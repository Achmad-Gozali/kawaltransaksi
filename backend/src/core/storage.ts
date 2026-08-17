import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createId } from "@paralleldrive/cuid2";

export type UploadFolder = "reports" | "articles";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);
const MAX_SIZE = 5 * 1024 * 1024;

interface R2Context {
  client:    S3Client;
  bucket:    string;
  publicUrl: string;
}

let r2Context: R2Context | null = null;

/**
 * Lazy-init + memoize client & config R2 (pola sama seperti getResend() di
 * mailer.ts). Sengaja TIDAK dibaca di top-level module -- di ES Modules,
 * modul yang di-import (lewat rantai reports.route.ts/admin.route.ts/
 * upload.route.ts -> storage.ts) dievaluasi SEBELUM configDotenv() di
 * index.ts sempat jalan, jadi process.env.* masih kosong kalau dibaca di
 * top-level. Dengan dipanggil di dalam fungsi (saat request beneran masuk),
 * .env sudah pasti ke-load duluan.
 */
function getR2(): R2Context {
  if (!r2Context) {
    r2Context = {
      client: new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT!,
        credentials: {
          accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      }),
      bucket:    process.env.R2_BUCKET_NAME!,
      publicUrl: process.env.R2_PUBLIC_URL!.replace(/\/$/, ""), // buang trailing slash kalau ada
    };
  }
  return r2Context;
}

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
  const { client, bucket, publicUrl } = getR2();
  const ext = originalName.includes(".") ? originalName.slice(originalName.lastIndexOf(".")) : "";
  const key = `${folder}/${createId()}${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        buffer,
      ContentType: contentTypeFromExt(ext),
    })
  );

  return `${publicUrl}/${key}`;
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

  const { client, bucket, publicUrl } = getR2();
  let key: string | null = null;

  if (url.startsWith(publicUrl)) {
    key = url.slice(publicUrl.length + 1); // +1 buang leading slash
  } else if (url.startsWith("/uploads/")) {
    // URL lama dari era filesystem — sudah tidak relevan pasca migrasi, skip saja
    return;
  }

  if (!key) return;

  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err: any) {
    // Kalau object memang sudah tidak ada, jangan sampai bikin request gagal
    if (err.name !== "NoSuchKey") throw err;
  }
}

/**
 * Cek apakah sebuah URL benar-benar menunjuk ke storage R2 milik kita.
 *
 * Dipakai untuk memvalidasi `evidenceUrls` yang dikirim client saat membuat
 * laporan. Tanpa ini, penyerang bisa mengirim URL sembarangan (misal ke server
 * miliknya sendiri) dan URL itu akan tersimpan sebagai "bukti" lalu dirender
 * di halaman publik -- artinya halaman kita memuat aset pihak ketiga yang bisa
 * dipakai untuk melacak pengunjung (IP/User-Agent) atau menampilkan gambar
 * yang menyesatkan. Bukti HARUS berasal dari file yang benar-benar di-upload
 * lewat endpoint upload kita sendiri.
 */
export function isOwnStorageUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url) return false;
  const { publicUrl } = getR2();
  // Harus tepat di bawah origin R2 kita, bukan sekadar mengandung string-nya
  // (mencegah https://evil.com/?x=https://img.kawaltransaksi.com lolos).
  return url.startsWith(publicUrl + "/");
}

/**
 * Ambil ukuran file (bytes) dari R2 berdasarkan URL publiknya.
 * Return 0 kalau URL bukan URL R2 (misal path lama era filesystem) atau
 * objectnya tidak ditemukan, supaya pemanggil bisa langsung memperlakukannya
 * sebagai "tidak valid" tanpa perlu try/catch sendiri.
 */
export async function getFileSizeFromR2(url: string): Promise<number> {
  const { client, bucket, publicUrl } = getR2();
  if (!url.startsWith(publicUrl)) return 0;

  const key = url.slice(publicUrl.length + 1); // +1 buang leading slash

  try {
    const res = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return res.ContentLength ?? 0;
  } catch {
    return 0;
  }
}