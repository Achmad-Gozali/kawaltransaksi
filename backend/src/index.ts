import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './features/auth/auth.route';
import reportsRoutes from './features/reports/reports.route';
import adminRoutes from './features/admin/admin.route';
import searchRoutes from './features/search/search.route';
import articlesRoutes, { generateWeeklyArticle } from './features/articles/articles.route';
import uploadRoutes from './features/upload/upload.route';
import feedbackRoutes from './features/feedback/feedback.route';
import apiPublicRoutes from './features/api-public/api-public.route';
import developerRoutes from './features/developer/developer.route';
import { logSuspiciousIp, autoBlacklistIfAbuse } from './core/abuse';
import type { Env } from './types';

// Re-export untuk dipakai route lain
export { logSuspiciousIp, autoBlacklistIfAbuse };

const app = new Hono<{ Bindings: Env }>();

// ── CORS ──────────────────────────────────────────────────────────────────────

app.use('*', cors({
  origin: (origin, c) => {
    const allowed = ['http://localhost:3000', 'http://localhost:3001', 'https://kawaltransaksi.com', c.env.FRONTEND_URL].filter(Boolean);
    if (!origin) return '*';
    return allowed.includes(origin) ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Internal-Key', 'X-API-Key', 'Idempotency-Key'],
  credentials: true,
}));

// ── Origin validator ──────────────────────────────────────────────────────────

const originValidator = async (c: { req: { method: string; header: (k: string) => string | undefined }; env: Env; json: (d: unknown, s?: number) => Response }, next: () => Promise<void>) => {
  if (c.req.method === 'OPTIONS') return next();
  const internalKey = c.req.header('X-Internal-Key');
  if (internalKey && internalKey === c.env.INTERNAL_API_KEY) return next();
  const origin = c.req.header('Origin') || c.req.header('Referer') || '';
  if (!origin.trim()) return next();
  const allowed = ['http://localhost:3000', 'http://localhost:3001', 'https://kawaltransaksi.com', c.env.FRONTEND_URL].filter(Boolean);
  if (!allowed.some((a: string) => origin.startsWith(a))) {
    return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  }
  return next();
};

app.use('/api/auth/*', originValidator);
app.use('/api/search/*', originValidator);

// ── Request size limits ───────────────────────────────────────────────────────

const SIZE_LIMITS: Record<string, number> = {
  '/api/auth':     10 * 1024,
  '/api/reports':  512 * 1024,
  '/api/admin':    50 * 1024,
  '/api/search':   5 * 1024,
  '/api/upload':   6 * 1024 * 1024,
  '/api/feedback': 10 * 1024,
  '/api/v1':       5 * 1024,
};
const DEFAULT_SIZE = 1 * 1024 * 1024;

app.use('/api/*', async (c, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) return next();
  const cl = c.req.header('Content-Length');
  if (cl) {
    const size  = parseInt(cl, 10);
    const path  = new URL(c.req.url).pathname;
    const limit = Object.entries(SIZE_LIMITS).find(([prefix]) => path.startsWith(prefix))?.[1] ?? DEFAULT_SIZE;
    if (size > limit) return c.json({ success: false, message: 'Ukuran request terlalu besar.' }, 413);
  }
  return next();
});

// ── IP Blacklist check ────────────────────────────────────────────────────────

app.use('/api/*', async (c, next) => {
  if (!c.env.LIMITER) return next();
  const ip   = c.req.header('CF-Connecting-IP') || 'anonymous';
  const path = new URL(c.req.url).pathname;
  if (ip === 'anonymous' || ip === '127.0.0.1') return next();
  if (path.startsWith('/api/admin/blacklist') || path.startsWith('/api/admin/iplogs')) return next();
  try {
    if (await c.env.LIMITER.get(`blacklist_${ip}`)) {
      return c.json({ success: false, message: 'Akses Anda telah diblokir sementara.' }, 403);
    }
  } catch (err) {
    console.error('[BLACKLIST] Error cek KV:', err);
  }
  return next();
});

// ── Auth rate limiter (Cloudflare built-in) ───────────────────────────────────

app.use('/api/auth/*', async (c, next) => {
  if (c.env.AUTH_RATE_LIMITER) {
    const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
    const { success } = await c.env.AUTH_RATE_LIMITER.limit({ key: ip });
    if (!success) return c.json({ success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.', retry_after: 60 }, 429);
  }
  return next();
});

// ── Global rate limit ─────────────────────────────────────────────────────────

app.use('/api/*', async (c, next) => {
  if (!c.env.LIMITER) return next();
  const ip   = c.req.header('CF-Connecting-IP') || 'anonymous';
  const path = new URL(c.req.url).pathname;
  if (path.startsWith('/api/v1')) return next();
  try {
    const key   = `rl_global_${ip}`;
    const count = parseInt(await c.env.LIMITER.get(key) ?? '0');
    if (count >= 20) {
      await logSuspiciousIp(c.env.LIMITER, ip, 'Melewati global rate limit', path);
      await autoBlacklistIfAbuse(c.env.LIMITER, ip, 'Terlalu sering melewati global rate limit');
      return c.json({ success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.' }, 429);
    }
    await c.env.LIMITER.put(key, (count + 1).toString(), { expirationTtl: 60 });
  } catch (err) {
    console.error('[RATE LIMIT] Error KV global:', err);
  }
  return next();
});

// ── Auth rate limit (KV) ──────────────────────────────────────────────────────

app.use('/api/auth/*', async (c, next) => {
  if (!c.env.LIMITER) return next();
  const ip   = c.req.header('CF-Connecting-IP') || 'anonymous';
  const path = new URL(c.req.url).pathname;
  try {
    const key   = `rl_auth_ip_${ip}`;
    const count = parseInt(await c.env.LIMITER.get(key) ?? '0');
    if (count >= 5) {
      await logSuspiciousIp(c.env.LIMITER, ip, 'Melewati auth rate limit', path);
      await autoBlacklistIfAbuse(c.env.LIMITER, ip, 'Terlalu sering melewati auth rate limit');
      return c.json({ success: false, message: 'Terlalu banyak percobaan. Tunggu 1 menit.', retry_after: 60 }, 429);
    }
    await c.env.LIMITER.put(key, (count + 1).toString(), { expirationTtl: 60 });
  } catch (err) {
    console.error('[AUTH RATE LIMIT] Error KV auth:', err);
  }
  return next();
});

// ── Search rate limit ─────────────────────────────────────────────────────────

app.use('/api/search/*', async (c, next) => {
  if (!c.env.LIMITER) return next();
  const ip   = c.req.header('CF-Connecting-IP') || 'anonymous';
  const path = new URL(c.req.url).pathname;
  try {
    const key   = `rl_search_${ip}`;
    const count = parseInt(await c.env.LIMITER.get(key) ?? '0');
    if (count >= 30) {
      await logSuspiciousIp(c.env.LIMITER, ip, 'Melewati search rate limit', path);
      return c.json({ success: false, message: 'Terlalu banyak permintaan pencarian. Tunggu 1 menit.', retry_after: 60 }, 429);
    }
    await c.env.LIMITER.put(key, (count + 1).toString(), { expirationTtl: 60 });
  } catch (err) {
    console.error('[SEARCH RATE LIMIT] Error KV search:', err);
  }
  return next();
});

// ── Honeypot ──────────────────────────────────────────────────────────────────

async function honeypotHandler(c: { req: { header: (k: string) => string | undefined; url: string }; env: Env; json: (d: unknown, s?: number) => Response }) {
  const ip   = c.req.header('CF-Connecting-IP') || 'anonymous';
  const path = new URL(c.req.url).pathname;
  if (c.env.LIMITER && ip !== 'anonymous') {
    const key = `blacklist_${ip}`;
    if (!await c.env.LIMITER.get(key)) {
      await c.env.LIMITER.put(key, JSON.stringify({ ip, reason: `Honeypot hit: ${path}`, auto: true, label: 'scanner', created_at: new Date().toISOString() }), { expirationTtl: 86400 });
    }
    await logSuspiciousIp(c.env.LIMITER, ip, `Honeypot hit: scanner detected`, path);
  }
  return c.json({ success: false, message: 'Endpoint tidak ditemukan.' }, 404);
}

// ── Health & Robots ───────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/robots.txt', (c) => c.text(`User-agent: *\nAllow: /\n\nDisallow: /api/v1/accounts\nDisallow: /api/v1/reports\nDisallow: /api/v1/keys\nDisallow: /api/v1/token\nDisallow: /api/v1/users\nDisallow: /api/v1/admin\nDisallow: /api/internal\n`));

// ── Honeypot endpoints ────────────────────────────────────────────────────────

const HONEYPOT_PATHS = ['/api/v1/accounts', '/api/v1/reports', '/api/v1/keys', '/api/v1/token', '/api/v1/users', '/api/v1/admin', '/api/internal'];
HONEYPOT_PATHS.forEach(path => app.all(path, honeypotHandler));

// ── Routes ────────────────────────────────────────────────────────────────────

app.route('/api/auth',      authRoutes);
app.route('/api/reports',   reportsRoutes);
app.route('/api/admin',     adminRoutes);
app.route('/api/search',    searchRoutes);
app.route('/api/articles',  articlesRoutes);
app.route('/api/upload',    uploadRoutes);
app.route('/api/feedback',  feedbackRoutes);
app.route('/api/v1',        apiPublicRoutes);
app.route('/api/developer', developerRoutes);

app.notFound((c) => c.json({ success: false, message: 'Endpoint tidak ditemukan.' }, 404));
app.onError((err, c) => {
  console.error('[ERROR]:', err.message);
  return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('[CRON] Mulai generate artikel mingguan...');
    ctx.waitUntil(generateWeeklyArticle(env));
  },
};