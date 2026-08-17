-- ============================================================================
-- OPSIONAL -- HANYA untuk tabel yang sudah besar.
-- JANGAN dijalankan oleh drizzle-kit. Ini dijalankan MANUAL lewat psql.
-- ============================================================================
--
-- Kapan file ini dipakai?
--   Hanya kalau tabel `reports` sudah cukup besar sehingga CREATE INDEX biasa
--   (di 0007_oval_clint_barton.sql) akan memblokir write terlalu lama.
--   Cek dulu ukurannya:
--
--     SELECT reltuples::bigint AS estimated_rows,
--            pg_size_pretty(pg_total_relation_size('reports')) AS total_size
--     FROM pg_class WHERE relname = 'reports';
--
--   Pedoman kasar:
--     < ~500k baris  -> tidak perlu file ini. Langsung `npm run db:migrate`.
--                       Index terbangun dalam hitungan detik.
--     > ~500k baris  -> pertimbangkan jalur CONCURRENTLY di bawah, atau
--                       jalankan db:migrate saat jam sepi.
--
-- Kenapa harus manual dan tidak bisa lewat drizzle?
--   CREATE INDEX CONCURRENTLY tidak boleh berada di dalam blok transaksi,
--   sedangkan drizzle-kit migrate selalu membungkus semua statement migrasi
--   dalam satu transaksi (drizzle-orm/pg-core/dialect.js -> session.transaction).
--   Menaruh CONCURRENTLY di file migrasi biasa akan langsung error:
--     "CREATE INDEX CONCURRENTLY cannot run inside a transaction block"
--
-- CARA PAKAI:
--   1. Jalankan file ini lebih dulu lewat psql (BUKAN lewat drizzle):
--        psql "$DATABASE_URL" -f drizzle/0007_concurrent_indexes_manual.sql
--
--      Jalankan tanpa flag -1/--single-transaction. psql secara default
--      autocommit per statement, jadi CONCURRENTLY bisa jalan.
--
--   2. Setelah semua index terbentuk, jalankan migrasi normal:
--        npm run db:migrate
--
--      0007 memakai CREATE INDEX IF NOT EXISTS, jadi statement-nya jadi no-op
--      (index sudah ada) dan drizzle tetap mencatat migrasi sebagai applied.
--      Tidak ada index dobel dan tidak ada error.
--
-- CATATAN:
--   - CONCURRENTLY lebih lambat (dua kali scan tabel) tapi TIDAK memblokir
--     INSERT/UPDATE/DELETE.
--   - Kalau CONCURRENTLY gagal di tengah jalan, Postgres meninggalkan index
--     dalam keadaan INVALID. Cek dengan:
--         SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
--     Lalu DROP INDEX index_yang_invalid; dan ulangi statement-nya.
--   - Tidak ada data yang diubah oleh file ini.
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS "reports_status_created_at_idx"   ON "reports" USING btree ("status","created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "reports_target_type_value_idx"   ON "reports" USING btree ("target_type","target_value");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "reports_target_value_idx"        ON "reports" USING btree ("target_value");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "evidence_report_id_idx"          ON "evidence" USING btree ("report_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sessions_user_id_idx"            ON "sessions" USING btree ("user_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "otp_tokens_user_id_idx"          ON "otp_tokens" USING btree ("user_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "articles_status_published_at_idx" ON "articles" USING btree ("status","published_at");
