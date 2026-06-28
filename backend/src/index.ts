import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import cron from 'node-cron';
import type { Context, Next } from 'hono';
import authRoutes      from './features/auth/auth.route';
import reportsRoutes   from './features/reports/reports.route';
import adminRoutes     from './features/admin/admin.route';
import searchRoutes    from './features/search/search.route';
import articlesRoutes, { generateWeeklyArticle } from './features/articles/articles.route';
import uploadRoutes    from './features/upload/upload.route';
import feedbackRoutes  from './features/feedback/feedback.route';
import apiPublicRoutes from './features/api-public/api-public.route';
import developerRoutes from './features/developer/developer.route';
import robotRoutes, { runScheduler } from './features/robot/robot.route';
import appealRoutes    from './features/robot/appeal-system';
import { runConfidenceDecay } from './features/robot/blacklist-engine';
import { detectTrends }       from './features/robot/trend-detector';
import { detectThreats }      from './features/robot/threat-detector';
import { logSuspiciousIp, autoBlacklistIfAbuse } from './core/abuse';
import { getSupabaseAdmin } from './core/supabase';
import { kv } from './core/redis';

export { logSuspiciousIp, autoBlacklistIfAbuse };

const FRONTEND_URL       = process.env.FRONTEND_URL ?? '';
const FRONTEND_URL_CLONE = process.env.FRONTEND_URL_CLONE ?? '';
const INTERNAL_API_KEY   = process.env.INTERNAL_API_KEY ?? '';
const ADMIN_IP_WHITELIST = process.env.ADMIN_IP_WHITELIST ?? '';
const HEALTH_SECRET      = process.env.HEALTH_SECRET ?? '';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://kawaltransaksi.com',
  'https://www.kawaltransaksi.com',
  FRONTEND_URL,
  FRONTEND_URL_CLONE,
].filter(Boolean);

const app = new Hono();

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*';
    return ALLOWED_ORIGINS.includes(origin) ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Internal-Key', 'X-API-Key', 'Idempotency-Key', 'X-Request-Timestamp'],
  credentials: true,
}));

app.use('*', async (c, next) => {
  await next();
  const h = c.res.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('X-XSS-Protection', '1; mode=block');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  h.set('Cache-Control', 'no-store');
  if (c.req.url.startsWith('https://'))
    h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

const getIp = (c: Context): string =>
  c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'anonymous';

const originValidator = async (c: Context, next: Next) => {
  if (c.req.method === 'OPTIONS') return next();
  const internalKey = c.req.header('X-Internal-Key');
  if (internalKey && internalKey === INTERNAL_API_KEY) return next();
  const origin = c.req.header('Origin') || c.req.header('Referer') || '';
  if (!origin.trim()) return next();
  if (!ALLOWED_ORIGINS.some((a) => origin.startsWith(a)))
    return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  return next();
};

app.use('/api/auth/*',   originValidator);
app.use('/api/search/*', originValidator);

const SIZE_LIMITS: Record<string, number> = {
  '/api/auth':           10 * 1024,
  '/api/reports':        512 * 1024,
  '/api/admin/articles': 5 * 1024 * 1024,
  '/api/admin':          50 * 1024,
  '/api/search':         5 * 1024,
  '/api/upload':         6 * 1024 * 1024,
  '/api/feedback':       10 * 1024,
  '/api/v1':             5 * 1024,
  '/api/robot':          5 * 1024,
  '/api/appeals':        10 * 1024,
};

app.use('/api/*', async (c, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) return next();
  const cl = c.req.header('Content-Length');
  if (cl) {
    const size  = parseInt(cl, 10);
    const path  = new URL(c.req.url).pathname;
    const limit = Object.entries(SIZE_LIMITS).find(([prefix]) => path.startsWith(prefix))?.[1] ?? 1024 * 1024;
    if (size > limit) return c.json({ success: false, message: 'Ukuran request terlalu besar.' }, 413);
  }
  return next();
});

// User-Agent check
app.use('/api/*', async (c, next) => {
  const ua   = c.req.header('User-Agent') ?? '';
  const ip   = getIp(c);
  const path = new URL(c.req.url).pathname;
  if (!ua.trim() && ip !== 'anonymous') {
    await logSuspiciousIp(ip, 'Request tanpa User-Agent', path);
    await autoBlacklistIfAbuse(ip, 'Request tanpa User-Agent');
    return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  }
  return next();
});

// Blacklist check
app.use('/api/*', async (c, next) => {
  const ip   = getIp(c);
  const path = new URL(c.req.url).pathname;
  if (ip === 'anonymous' || ip === '127.0.0.1') return next();
  if (path.startsWith('/api/admin/blacklist') || path.startsWith('/api/admin/iplogs')) return next();
  try {
    if (await kv.get(`blacklist_${ip}`))
      return c.json({ success: false, message: 'Akses Anda telah diblokir sementara.' }, 403);
  } catch (err) { console.error('[BLACKLIST] Error:', err); }
  return next();
});

// Admin IP whitelist
app.use('/api/admin/*', async (c, next) => {
  const internalKey = c.req.header('X-Internal-Key');
  if (internalKey && internalKey === INTERNAL_API_KEY) return next();
  const ip        = getIp(c);
  const whitelist = ADMIN_IP_WHITELIST.split(',').map(s => s.trim()).filter(Boolean);
  if (whitelist.length && !whitelist.includes(ip))
    return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  return next();
});

// Replay attack prevention
app.use('/api/reports/*', async (c, next) => {
  const ts = c.req.header('X-Request-Timestamp');
  if (ts && Math.abs(Date.now() - parseInt(ts)) > 5 * 60 * 1000)
    return c.json({ success: false, message: 'Request kedaluwarsa.' }, 400);
  return next();
});

// Auth rate limiter (redis-based)
app.use('/api/auth/*', async (c, next) => {
  const ip  = getIp(c);
  const key = `rl_cf_auth_${ip}`;
  try {
    const count = parseInt(await kv.get(key) ?? '0');
    if (count >= 100)
      return c.json({ success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.', retry_after: 60 }, 429);
    await kv.put(key, (count + 1).toString(), { expirationTtl: 60 });
  } catch (err) { console.error('[AUTH RL] Error:', err); }
  return next();
});

const kvRateLimit = async (
  c: Context,
  next: Next,
  { key, max, ttl, label, logReason, blacklist }: {
    key: string; max: number; ttl: number;
    label: string; logReason: string; blacklist?: boolean;
  }
) => {
  const ip   = getIp(c);
  const path = new URL(c.req.url).pathname;
  try {
    const kvKey = `${key}${ip}`;
    const count = parseInt(await kv.get(kvKey) ?? '0');
    if (count >= max) {
      await logSuspiciousIp(ip, logReason, path);
      if (blacklist) await autoBlacklistIfAbuse(ip, logReason);
      return c.json({ success: false, message: 'Terlalu banyak permintaan. Tunggu 1 menit.', retry_after: 60 }, 429);
    }
    await kv.put(kvKey, (count + 1).toString(), { expirationTtl: ttl });
  } catch (err) { console.error(`[${label}] Error:`, err); }
  return next();
};

app.use('/api/*', (c, next) => {
  const path = new URL(c.req.url).pathname;
  if (path.startsWith('/api/robot')) return next();
  return kvRateLimit(c, next, {
    key: 'rl_global_', max: 20, ttl: 60,
    label: 'GLOBAL RL', logReason: 'Melewati global rate limit', blacklist: true,
  });
});

app.use('/api/robot/*', (c, next) => kvRateLimit(c, next, {
  key: 'rl_robot_', max: 10, ttl: 60,
  label: 'ROBOT RL', logReason: 'Melewati robot rate limit', blacklist: true,
}));

app.use('/api/auth/*',   (c, next) => kvRateLimit(c, next, { key: 'rl_auth_ip_',  max: 5,  ttl: 60, label: 'AUTH RL',   logReason: 'Melewati auth rate limit',   blacklist: true }));
app.use('/api/search/*', (c, next) => kvRateLimit(c, next, { key: 'rl_search_',   max: 30, ttl: 60, label: 'SEARCH RL', logReason: 'Melewati search rate limit' }));

async function honeypotHandler(c: Context) {
  const ip   = getIp(c);
  const path = new URL(c.req.url).pathname;
  if (ip !== 'anonymous') {
    const key = `blacklist_${ip}`;
    if (!await kv.get(key)) {
      await kv.put(key, JSON.stringify({
        ip, reason: `Honeypot hit: ${path}`, auto: true, label: 'scanner',
        created_at: new Date().toISOString(),
      }), { expirationTtl: 86400 });
    }
    await logSuspiciousIp(ip, 'Honeypot hit: scanner detected', path);
  }
  return c.json({ success: false, message: 'Endpoint tidak ditemukan.' }, 404);
}

app.get('/health', async (c) => {
  const token = c.req.header('X-Health-Token');
  if (!token || token !== HEALTH_SECRET)
    return c.json({ success: false, message: 'Endpoint tidak ditemukan.' }, 404);
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/robots.txt', (c) => c.text('User-agent: *\nAllow: /\n'));

['/api/v1/accounts', '/api/v1/reports', '/api/v1/keys', '/api/v1/token',
 '/api/v1/users',    '/api/v1/admin',   '/api/internal'].forEach(p => app.all(p, honeypotHandler));

app.route('/api/auth',      authRoutes);
app.route('/api/reports',   reportsRoutes);
app.route('/api/admin',     adminRoutes);
app.route('/api/search',    searchRoutes);
app.route('/api/articles',  articlesRoutes);
app.route('/api/upload',    uploadRoutes);
app.route('/api/feedback',  feedbackRoutes);
app.route('/api/v1',        apiPublicRoutes);
app.route('/api/developer', developerRoutes);
app.route('/api/robot',     robotRoutes);
app.route('/api/appeals',   appealRoutes);

app.notFound((c) => c.json({ success: false, message: 'Endpoint tidak ditemukan.' }, 404));
app.onError((err, c) => {
  console.error('[ERROR]:', err.message);
  return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
});

// Cron jobs
const supabase = getSupabaseAdmin();

cron.schedule('0 23 * * 0', () => {
  generateWeeklyArticle().catch(err => console.error('[CRON] Artikel error:', err));
});

cron.schedule('*/30 * * * *', () => {
  runScheduler(supabase).catch(err => console.error('[CRON] Robot scheduler error:', err));
});

cron.schedule('*/15 * * * *', () => {
  const now            = new Date();
  const isFirstOfMonth = now.getDate() === 1 && now.getHours() === 0;
  Promise.all([
    detectTrends(supabase).catch(err => console.error('[CRON] Trend error:', err)),
    detectThreats(supabase).catch(err => console.error('[CRON] Threat error:', err)),
    isFirstOfMonth
      ? runConfidenceDecay(supabase).catch(err => console.error('[CRON] Decay error:', err))
      : Promise.resolve(),
  ]);
});

cron.schedule('0 19 * * *', () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const oneDayAgo     = new Date(Date.now() - 86400000).toISOString();
  Promise.all([
    (async () => {
      const { error } = await supabase.from('robot_logs').delete().lt('created_at', thirtyDaysAgo);
      if (error) console.error('[CRON] Robot logs cleanup error:', error);
      else console.log('[CRON] Robot logs cleanup selesai');
    })(),
    (async () => {
      const { error } = await supabase.from('reports').delete().eq('status', 'rejected').lt('created_at', oneDayAgo);
      if (error) console.error('[CRON] Rejected reports cleanup error:', error);
      else console.log('[CRON] Rejected reports cleanup selesai');
    })(),
  ]);
}); // ← ini yang hilang

const PORT = parseInt(process.env.PORT ?? '8787');
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});

export default app;