import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../core/auth.middleware.js";
import { saveFile, type UploadFolder } from "../../core/storage.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set<UploadFolder>(["reports", "articles"]);

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: requireAuth }, async (req, reply) => {
    const data = await req.file();

    if (!data) return reply.code(400).send({ error: "Tidak ada file yang dikirim." });
    if (!ALLOWED_MIME.has(data.mimetype))
      return reply.code(400).send({ error: "Tipe file tidak didukung. Hanya JPEG dan PNG." });

    const folderField = data.fields?.folder;
    const folderValue =
      folderField && "value" in folderField ? String(folderField.value) : "";

    if (!ALLOWED_FOLDERS.has(folderValue as UploadFolder))
      return reply.code(400).send({ error: "Kategori upload tidak valid." });

    const folder = folderValue as UploadFolder;

    const chunks: Buffer[] = [];
    let size = 0;

    for await (const chunk of data.file) {
      size += chunk.length;
      if (size > MAX_SIZE) {
        return reply.code(400).send({ error: "Ukuran file melebihi batas 5MB." });
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;

    if (!isJpeg && !isPng)
      return reply.code(400).send({ error: "File tidak valid atau telah dimanipulasi." });

    const ext = data.mimetype === "image/png" ? ".png" : ".jpg";
    const url = await saveFile(buffer, `upload${ext}`, folder);

    return reply.send({ data: { url } });
  });
}