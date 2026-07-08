import postgres from "postgres";
import { config } from "dotenv";
config();
const sql = postgres(process.env.DATABASE_URL);
sql`SELECT current_database()`.then(r => { console.log(r); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });