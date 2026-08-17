import { pgTable, text, timestamp, pgEnum, integer, boolean, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const roleEnum         = pgEnum("role",           ["user", "admin"]);
export const reportStatusEnum = pgEnum("report_status",  ["pending", "verified", "rejected"]);
export const targetTypeEnum   = pgEnum("target_type",    ["phone", "bank_account", "ewallet"]);
export const articleStatusEnum = pgEnum("article_status", ["draft", "published"]);

export const users = pgTable("users", {
  id:           text("id").primaryKey().$defaultFn(() => createId()),
  name:         text("name").notNull(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role:         roleEnum("role").notNull().default("user"),
  isVerified:   boolean("is_verified").notNull().default(false),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id:           text("id").primaryKey().$defaultFn(() => createId()),
  userId:       text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshToken: text("refresh_token").notNull().unique(),
  expiresAt:    timestamp("expires_at").notNull(),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  // Dipakai saat reset-password (hapus semua sesi milik user) -- FK tidak
  // otomatis diberi index oleh Postgres.
  index("sessions_user_id_idx").on(table.userId),
]);

export const reports = pgTable("reports", {
  id:                  text("id").primaryKey().$defaultFn(() => createId()),
  userId:              text("user_id").references(() => users.id, { onDelete: "set null" }),
  targetType:          targetTypeEnum("target_type").notNull(),
  targetValue:         text("target_value").notNull(),
  bankName:            text("bank_name"),
  walletName:          text("wallet_name"),
  targetName:          text("target_name"),
  amount:              integer("amount"),
  description:         text("description").notNull(),
  chronology:          text("chronology"),
  category:            text("category"),
  platform:            text("platform"),
  incidentDate:        timestamp("incident_date"),
  hasOtherVictims:     text("has_other_victims").default("no"),
  storeName:           text("store_name"),
  suspectCity:         text("suspect_city"),
  suspectPhotoUrl:     text("suspect_photo_url"),
  socialMediaAccounts: text("social_media_accounts").array(),
  linkUrl:             text("link_url"),
  reportedTo:          text("reported_to").array(),
  status:              reportStatusEnum("status").notNull().default("pending"),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  // Dipakai buat cek trust score (punya laporan verified sebelumnya?) di
  // robot.ts, sekaligus mempercepat query per-user lain di checkSpam()
  // (cek duplikat & rate limit harian) yang sebelumnya full table scan.
  index("reports_user_id_status_idx").on(table.userId, table.status),
  // Dipakai oleh endpoint publik yang filter by status lalu ORDER BY
  // created_at DESC (public/recent, laporan-stats, laporan-publik, dll) --
  // sebelumnya full scan + sort di memori untuk tabel yang terus bertambah.
  index("reports_status_created_at_idx").on(table.status, table.createdAt),
  // Dipakai oleh search.route.ts (lookup nomor/rekening/ewallet persis) dan
  // beberapa endpoint publik lain yang filter by target_type.
  index("reports_target_type_value_idx").on(table.targetType, table.targetValue),
  // Dipakai oleh public/check/:number dan public/blacklist/:number yang
  // lookup langsung by target_value tanpa filter target_type.
  index("reports_target_value_idx").on(table.targetValue),
]);

export const evidence = pgTable("evidence", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  reportId:  text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  url:       text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  // Kolom FK tidak otomatis diberi index oleh Postgres -- dibutuhkan untuk
  // JOIN/IN lookup di admin.route.ts dan reports.route.ts (public/check).
  index("evidence_report_id_idx").on(table.reportId),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token:     text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("password_reset_tokens_user_id_idx").on(table.userId),
]);

export const otpTokens = pgTable("otp_tokens", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  otpHash:   text("otp_hash").notNull(),
  attempts:  integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("otp_tokens_user_id_idx").on(table.userId),
]);

export const articles = pgTable("articles", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  title:       text("title").notNull(),
  slug:        text("slug").notNull().unique(),
  excerpt:     text("excerpt"),
  content:     text("content").notNull().default(""),
  thumbnail:   text("thumbnail"),
  category:    text("category").notNull().default("tips"),
  status:      articleStatusEnum("status").notNull().default("draft"),
  authorId:    text("author_id").references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  // Dipakai oleh /admin/articles/public (listing publik ORDER BY published_at DESC).
  index("articles_status_published_at_idx").on(table.status, table.publishedAt),
]);

/**
 * Kolom laporan yang boleh dilihat publik -- SEMUA kolom KECUALI userId.
 *
 * Sebelumnya endpoint publik memakai db.select() polos (SELECT *), sehingga
 * user_id si pelapor ikut terkirim ke browser siapa pun. Padahal frontend
 * sengaja menyamarkan identitas pelapor (maskName/maskNumber) -- membocorkan
 * user_id membatalkan penyamaran itu: satu ID tetap bisa dipakai untuk
 * mengelompokkan seluruh laporan milik orang yang sama, dan di situs
 * anti-penipuan itu berisiko dipakai pelaku untuk balas dendam ke pelapor.
 *
 * Ditulis eksplisit (bukan spread/omit) supaya kolom sensitif yang ditambahkan
 * ke schema di masa depan TIDAK otomatis ikut bocor -- harus didaftarkan sadar
 * ke sini dulu. Dipakai bareng oleh reports.route.ts dan search.route.ts.
 */
export const publicReportColumns = {
  id:                  reports.id,
  targetType:          reports.targetType,
  targetValue:         reports.targetValue,
  bankName:            reports.bankName,
  walletName:          reports.walletName,
  targetName:          reports.targetName,
  amount:              reports.amount,
  description:         reports.description,
  chronology:          reports.chronology,
  category:            reports.category,
  platform:            reports.platform,
  incidentDate:        reports.incidentDate,
  hasOtherVictims:     reports.hasOtherVictims,
  storeName:           reports.storeName,
  suspectCity:         reports.suspectCity,
  suspectPhotoUrl:     reports.suspectPhotoUrl,
  socialMediaAccounts: reports.socialMediaAccounts,
  linkUrl:             reports.linkUrl,
  reportedTo:          reports.reportedTo,
  status:              reports.status,
  createdAt:           reports.createdAt,
  updatedAt:           reports.updatedAt,
} as const;

export type User                = typeof users.$inferSelect;
export type Session             = typeof sessions.$inferSelect;
export type Report              = typeof reports.$inferSelect;
export type Evidence            = typeof evidence.$inferSelect;
export type PasswordResetToken  = typeof passwordResetTokens.$inferSelect;
export type OtpToken            = typeof otpTokens.$inferSelect;
export type Article             = typeof articles.$inferSelect;