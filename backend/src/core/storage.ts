import { createReadStream } from "fs";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createId } from "@paralleldrive/cuid2";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function saveFile(buffer: Buffer, originalName: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(originalName);
  const filename = `${createId()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  await writeFile(filepath, buffer);
  return `/uploads/${filename}`;
}