-- Menambahkan index untuk query yang sebelumnya full table scan.
-- Migrasi ini HANYA menambah index: tidak ada perubahan skema kolom dan
-- TIDAK ADA data yang diubah/dihapus.
--
-- Kenapa "IF NOT EXISTS":
--   1. Idempotent -- aman dijalankan ulang kalau sebelumnya gagal di tengah
--      jalan (drizzle menjalankan seluruh file dalam SATU transaksi, jadi
--      kegagalan akan rollback, tapi index bisa juga sudah dibuat manual).
--   2. Memungkinkan jalur "buat index CONCURRENTLY manual dulu, baru
--      jalankan db:migrate" untuk tabel besar -- lihat catatan di bawah.
--
-- CATATAN LOCK (penting untuk produksi):
--   CREATE INDEX biasa mengambil lock SHARE pada tabel: SELECT tetap jalan,
--   tapi INSERT/UPDATE/DELETE ke tabel itu DIBLOKIR selama index dibangun.
--   Untuk tabel `reports` yang besar, ini berarti submit laporan baru dan
--   update status oleh admin akan menunggu sampai index selesai.
--
--   CREATE INDEX CONCURRENTLY tidak memblokir write, TAPI tidak bisa
--   dijalankan di dalam transaksi -- sedangkan drizzle-kit migrate selalu
--   membungkus migrasi dalam transaksi. Jadi CONCURRENTLY TIDAK BISA ditaruh
--   di file ini; harus dijalankan manual lewat psql lebih dulu.
--   Lihat: drizzle/0007_concurrent_indexes_manual.sql

CREATE INDEX IF NOT EXISTS "articles_status_published_at_idx" ON "articles" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_report_id_idx" ON "evidence" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_tokens_user_id_idx" ON "otp_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_status_created_at_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_target_type_value_idx" ON "reports" USING btree ("target_type","target_value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_target_value_idx" ON "reports" USING btree ("target_value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" USING btree ("user_id");
