import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { createId } from "@paralleldrive/cuid2";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
export type UploadFolder = "reports" | "articles";

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