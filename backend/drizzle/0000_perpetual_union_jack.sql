CREATE TYPE "public"."report_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('phone', 'bank_account', 'ewallet');--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"target_type" "target_type" NOT NULL,
	"target_value" text NOT NULL,
	"bank_name" text,
	"wallet_name" text,
	"amount" integer,
	"description" text NOT NULL,
	"chronology" text,
	"category" text,
	"platform" text,
	"incident_date" timestamp,
	"has_other_victims" text DEFAULT 'no',
	"store_name" text,
	"suspect_city" text,
	"suspect_photo_url" text,
	"social_media_accounts" text[],
	"link_url" text,
	"reported_to" text[],
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;