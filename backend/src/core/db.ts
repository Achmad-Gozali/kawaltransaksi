import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

// Sengaja tidak ada fallback default -- kalau DATABASE_URL kosong (misal .env
// belum ke-load atau env var container belum di-set), lebih baik gagal jelas
// di sini daripada diam-diam nyambung ke DB lokal yang salah.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL wajib diisi -- cek .env (lokal) atau environment variable container (produksi)."
  );
}

const client = postgres(connectionString, { max: 10 });

// Instance postgres.js mentah -- dibutuhkan core/realtime.ts untuk LISTEN/NOTIFY
// (butuh koneksi dedicated yang dikelola driver, di luar pool query biasa).
export { client as pg };

export const db = drizzle(client, { schema });