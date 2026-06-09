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
  INTERNAL_API_KEY: string;
  FRONTEND_URL_CLONE?: string;
  HEALTH_SECRET: string;

  // Cloudflare R2
  BUCKET: R2Bucket;

  // Cloudflare KV
  LIMITER: KVNamespace;

  // Cloudflare native rate limiter (binding di wrangler.toml)
  AUTH_RATE_LIMITER: RateLimit;
}