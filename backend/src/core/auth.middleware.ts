import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types.js";

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    reply.status(401).send({ error: "Anda belum masuk. Silakan masuk terlebih dahulu." });
    return false;
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    return true;
  } catch {
    reply.status(401).send({ error: "Sesi Anda sudah berakhir. Silakan masuk kembali." });
    return false;
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const authenticated = await requireAuth(req, reply);
  if (!authenticated) return;

  if (req.user?.role !== "admin") {
    reply.status(403).send({ error: "Anda tidak memiliki akses ke halaman ini." });
  }
}