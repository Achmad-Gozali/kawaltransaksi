import type { FastifyInstance } from "fastify";
import { parseQrisPayload } from "../../core/qris.js";
import { createPreviewToken, getPreviewToken } from "../../core/qrisPreviewCache.js";

export async function qrisRoutes(app: FastifyInstance) {
  // Dipanggil dari /cek-qris setelah client selesai decode foto QRIS, SEBELUM
  // tahu apakah user akan lanjut lapor atau cuma mau lihat hasil cek. Payload
  // mentah divalidasi ulang di sini (sama seperti saat submit laporan) --
  // token hanya terbit untuk payload yang lolos CRC + struktur EMV-QRIS.
  app.post("/preview", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const { payload } = req.body as { payload?: unknown };
    const parsed = parseQrisPayload(payload);
    if (!parsed.valid) {
      return reply.status(400).send({ error: parsed.error ?? "Payload QRIS tidak valid." });
    }
    const token = createPreviewToken({
      nmid: parsed.nmid!,
      merchantName: parsed.merchantName!,
      merchantCity: parsed.merchantCity!,
    });
    return { data: { token, nmid: parsed.nmid, merchantName: parsed.merchantName, merchantCity: parsed.merchantCity } };
  });

  // Dipanggil server-side oleh check/[slug]/page.tsx, bukan langsung dari
  // browser -- 404 diperlakukan sebagai "tidak ada data preview" oleh
  // pemanggil, bukan error keras (token boleh sudah kadaluarsa/tidak ada).
  app.get("/preview/:token", async (req, reply) => {
    const { token } = req.params as { token: string };
    const entry = getPreviewToken(token);
    if (!entry) return reply.status(404).send({ error: "Data preview tidak ditemukan atau sudah kedaluwarsa." });
    return { data: entry };
  });
}
