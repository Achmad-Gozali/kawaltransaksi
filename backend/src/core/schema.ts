import { pgTable, text, timestamp, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
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
});

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
});

export const evidence = pgTable("evidence", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  reportId:  text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  url:       text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token:     text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const otpTokens = pgTable("otp_tokens", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  otpHash:   text("otp_hash").notNull(),
  attempts:  integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
});

export type User                = typeof users.$inferSelect;
export type Session             = typeof sessions.$inferSelect;
export type Report              = typeof reports.$inferSelect;
export type Evidence            = typeof evidence.$inferSelect;
export type PasswordResetToken  = typeof passwordResetTokens.$inferSelect;
export type OtpToken            = typeof otpTokens.$inferSelect;
export type Article             = typeof articles.$inferSelect;