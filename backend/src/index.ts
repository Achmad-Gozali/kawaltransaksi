import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import reportsRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import searchRoutes from './routes/search';
import articlesRoutes, { generateWeeklyArticle } from './routes/articles';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://kawaltransaksi.com',
      c.env.FRONTEND_URL,
    ].filter(Boolean);
    if (allowedOrigins.includes(origin ?? '')) return origin;
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Origin validation ─────────────────────────────────────────────────────────
const originValidator = async (c: any, next: any) => {

  if (c.req.method === 'OPTIONS') return next();
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://kawaltransaksi.com',
    c.env.FRONTEND_URL,
  ].filter(Boolean);

  const origin = c.req.header('Origin') || c.req.header('Referer') || '';
  const hasOrigin = origin.trim() !== '';
  const isAllowed = allowedOrigins.some((allowed: string) => origin.startsWith(allowed));

  if (hasOrigin && !isAllowed) {
    console.warn(`[CSRF BLOCK] Origin tidak diizinkan: ${origin}`);
    return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  }
  return next();
};

app.use('/api/auth/*', originValidator);
app.use('/api/search/*', originValidator);

// ── Lapis 1: Cloudflare native rate limit — /api/auth/* ──────────────────────
app.use('/api/auth/*', async (c, next) => {
  if (c.env.AUTH_RATE_LIMITER) {
    const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
    const { success } = await c.env.AUTH_RATE_LIMITER.limit({ key: ip });
    if (!success) {
      console.warn(`[CF RATE LIMIT] Native limit tercapai untuk IP: ${ip}`);
      return c.json({
        success: false,
        message: 'Terlalu banyak permintaan. Coba lagi nanti.',
        retry_after: 60,
      }, 429);
    }
  }
  return next();
});

// ── Lapis 2: KV global rate limit — semua /api/* ─────────────────────────────
app.use('/api/*', async (c, next) => {
  if (!c.env.LIMITER) {
    console.warn('[RATE LIMIT] KV binding LIMITER tidak tersedia.');
    return next();
  }

  const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
  const key = `rl_global_${ip}`;

  try {
    const current = await c.env.LIMITER.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= 20) {
      console.warn(`[RATE LIMIT] Global limit tercapai untuk IP: ${ip}`);
      return c.json({
        success: false,
        message: 'Terlalu banyak permintaan. Coba lagi nanti.',
      }, 429);
    }

    await c.env.LIMITER.put(key, (count + 1).toString(), { expirationTtl: 60 });
  } catch (err) {
    console.error('[RATE LIMIT] Error KV global:', err);
  }

  return next();
});

// ── Lapis 3: KV auth rate limit — khusus /api/auth/* ─────────────────────────
app.use('/api/auth/*', async (c, next) => {
  if (!c.env.LIMITER) return next();

  const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
  const key = `rl_auth_ip_${ip}`;

  try {
    const current = await c.env.LIMITER.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= 5) {
      console.warn(`[AUTH RATE LIMIT] IP diblokir sementara: ${ip}`);
      return c.json({
        success: false,
        message: 'Terlalu banyak percobaan. Tunggu 1 menit sebelum mencoba lagi.',
        retry_after: 60,
      }, 429);
    }

    await c.env.LIMITER.put(key, (count + 1).toString(), { expirationTtl: 60 });
  } catch (err) {
    console.error('[AUTH RATE LIMIT] Error KV auth:', err);
  }

  return next();
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.route('/api/auth', authRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/articles', articlesRoutes);

app.notFound((c) => c.json({ success: false, message: 'Endpoint tidak ditemukan.' }, 404));
app.onError((err, c) => {
  console.error('[ERROR]:', err.message);
  return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
});

// ── Cron Handler ──────────────────────────────────────────────────────────────
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('[CRON] Mulai generate artikel mingguan...');
    ctx.waitUntil(generateWeeklyArticle(env));
  },
};