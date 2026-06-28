import type { kv } from "./core/redis";

export type KVNamespace = typeof kv;

export interface Env {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
  RECAPTCHA_SECRET_KEY: string;
  GROQ_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  FRONTEND_URL: string;
  NODE_ENV: string;
  RESEND_API_KEY: string;
  ADMIN_EMAIL: string;
  R2_PUBLIC_URL: string;
  ADMIN_IP_WHITELIST?: string;
  INTERNAL_API_KEY: string;
  FRONTEND_URL_CLONE?: string;
  HEALTH_SECRET: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  ABSTRACT_API_KEY: string;
  LIMITER: typeof kv;
}
