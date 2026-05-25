import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://593fdcc73fcf08439f7c1dbb6f6d7401@o4511220364541953.ingest.us.sentry.io/4511220376272896',

  // ---------------------------------------------
  // Sampling
  // ---------------------------------------------

  // [OK] FIX: Turunkan dari 1.0 (100%) -> 0.1 (10%).
  // Rate 100% artinya semua 20k transaksi/minggu masuk Sentry -- boros quota
  // dan menambah overhead di setiap request. 10% sudah cukup untuk monitoring.
  tracesSampleRate: 0.1,

  // Hanya sample error di production; dev cukup lihat di console
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : { enabled: false }),

  // ---------------------------------------------
  // Features
  // ---------------------------------------------

  // Kirim log (console.error, dll.) ke Sentry
  enableLogs: true,

  // Sertakan data user (IP, email jika login) untuk konteks error
  sendDefaultPii: true,

  // ---------------------------------------------
  // Router transition tracking (Next.js App Router)
  // ---------------------------------------------
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;