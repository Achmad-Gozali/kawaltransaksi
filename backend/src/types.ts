export interface JwtPayload {
  userId: string;
  role: "user" | "admin";
}

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}