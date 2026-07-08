import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types.js";

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return reply.status(401).send({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (req.user?.role !== "admin") {
    return reply.status(403).send({ error: "Forbidden" });
  }
}