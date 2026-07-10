import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { createId } from "@paralleldrive/cuid2";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
export type UploadFolder = "reports" | "articles";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);
const MAX_SIZE = 5 * 1024 * 1024;

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

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  folder: UploadFolder
): Promise<string> {
  const dir = path.join(UPLOAD_DIR, folder);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(originalName);
  const filename = `${createId()}${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

export async function deleteFile(url: string | null | undefined): Promise<void> {
  if (!url) return;
  if (!url.startsWith("/uploads/")) return;

  const relative = url.slice("/uploads/".length);
  const filepath = path.join(UPLOAD_DIR, relative);

  try {
    await unlink(filepath);
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err;
  }
}