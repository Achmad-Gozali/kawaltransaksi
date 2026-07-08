import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres({
  host: "127.0.0.1",
  port: 5433,
  user: "postgres",
  password: "postgres",
  database: "kawaltransaksi",
  max: 10,
});

export const db = drizzle(client, { schema });