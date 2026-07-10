import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../core/auth.middleware.js";
import { saveFile, validateImageBuffer, type UploadFolder } from "../../core/storage.js";

const ALLOWED_FOLDERS = new Set<UploadFolder>(["reports", "articles"]);

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/", {
  preHandler: requireAuth,
  config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
}, async (req, reply) => {
    const data = await req.file();

    if (!data) return reply.code(400).send({ error: "Tidak ada file yang dikirim." });

    const folderField = data.fields?.folder;
    const folderValue =
      folderField && "value" in folderField ? String(folderField.value) : "";

    if (!ALLOWED_FOLDERS.has(folderValue as UploadFolder))
      return reply.code(400).send({ error: "Kategori upload tidak valid." });

    const folder = folderValue as UploadFolder;

    const chunks: Buffer[] = [];
    let size = 0;
    const MAX_SIZE = 5 * 1024 * 1024;

    for await (const chunk of data.file) {
      size += chunk.length;
      if (size > MAX_SIZE) {
        return reply.code(400).send({ error: "Ukuran file melebihi batas 5MB." });
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const validation = validateImageBuffer(buffer, data.mimetype);

    if (!validation.valid) {
      return reply.code(400).send({ error: validation.error });
    }

    const url = await saveFile(buffer, `upload${validation.ext}`, folder);

    return reply.send({ data: { url } });
  });
}