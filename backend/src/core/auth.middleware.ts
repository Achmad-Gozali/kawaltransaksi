import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types.js";

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    reply.status(401).send({ error: "Unauthorized" });
    return false;
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    return true;
  } catch {
    reply.status(401).send({ error: "Invalid token" });
    return false;
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const authenticated = await requireAuth(req, reply);
  if (!authenticated) return;

  if (req.user?.role !== "admin") {
    reply.status(403).send({ error: "Forbidden" });
  }
}