import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: [
    'http://localhost:3000',
    'https://kawaltransaksi.com',
    'https://www.kawaltransaksi.com',
    process.env.FRONTEND_URL ?? '',
  ].filter(Boolean),
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'user' },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
});

export type Auth = typeof auth;