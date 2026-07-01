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
  R2_ENDPOINT: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_ACCOUNT_ID: string;
  ADMIN_IP_WHITELIST?: string;
  FRONTEND_URL_CLONE?: string;
  INTERNAL_API_KEY: string;
  HEALTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

export function getEnv(): Env {
  const required = [
    'DATABASE_URL',
    'INTERNAL_API_KEY',
    'HEALTH_SECRET',
  ];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing env: ${key}`);
  }
  return process.env as unknown as Env;
}