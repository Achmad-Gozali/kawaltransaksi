import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import reportsRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import searchRoutes from './routes/search';
import articlesRoutes, { generateWeeklyArticle } from './routes/articles';
import uploadRoutes from './routes/upload';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

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
  allowHeaders: ['Content-Type', 'Authorization', 'X-Internal-Key'],
  credentials: true,
}));

const originValidator = async (c: any, next: any) => {
  if (c.req.method === 'OPTIONS') return next();

  // Skip untuk internal server-to-server request
  const internalKey = c.req.header('X-Internal-Key');
  if (internalKey && internalKey === c.env.INTERNAL_API_KEY) return next();

  const origin = c.req.header('Origin') || c.req.header('Referer') || '';
  if (origin.trim() === '') return next();

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://kawaltransaksi.com',
    c.env.FRONTEND_URL,
  ].filter(Boolean);

  const isAllowed = allowedOrigins.some((allowed: string) => origin.startsWith(allowed));

  if (!isAllowed) {
    console.warn(`[CSRF BLOCK] Origin tidak diizinkan: ${origin}`);
    return c.json({ success: false, message: 'Akses ditolak.' }, 403);
  }
  return next();
};

app.use('/api/auth/*', originValidator);
app.use('/api/search/*', originValidator);

const SIZE_LIMITS: Record<string, number> = {
  '/api/auth':    10 * 1024,
  '/api/reports': 512 * 1024,
  '/api/admin':   50 * 1024,
  '/api/search':  5 * 1024,
  '/api/upload':  6 * 1024 * 1024,
};
const DEFAULT_SIZE_LIMIT = 1 * 1024 * 1024;

app.use('/api/*', async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'OPTIONS') {
    return next();
  }
  const contentLength = c.req.header('Content-Length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const path = new URL(c.req.url).pathname;
    let limit = DEFAULT_SIZE_LIMIT;
    for (const [prefix, maxSize] of Object.entries(SIZE_LIMITS)) {
      if (path.startsWith(prefix)) { limit = maxSize; break; }
    }
    if (size > limit) {
      return c.json({ success: false, message: 'Ukuran request terlalu besar.' }, 413);
    }
  }
  return next();
});

app.use('/api/*', async (c, next) => {
  if (!c.env.LIMITER) return next();
  const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
  if (ip === 'anonymous' || ip === '127.0.0.1') return next();
  const path = new URL(c.req.url).pathname;
  if (path.startsWith('/api/admin/blacklist') || path.startsWith('/api/admin/iplogs')) return next();
  try {
    const blacklistKey = `blacklist_${ip}`;
    const isBlacklisted = await c.env.LIMITER.get(blacklistKey);
    if (isBlacklisted) {
      return c.json({ success: false, message: 'Akses Anda telah diblokir sementara.' }, 403);
    }
  } catch (err) {
    console.error('[BLACKLIST] Error cek KV:', err);
  }
  return next();
});

app.use('/api/auth/*', async (c, next) => {
  if (c.env.AUTH_RATE_LIMITER) {
    const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
    const { success } = await c.env.AUTH_RATE_LIMITER.limit({ key: ip });
    if (!success) {
      return c.json({ success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.', retry_after: 60 }, 429);
    }
  }
  return next();
});

app.use('/api/*', async (c, next) => {
  if (!c.env.LIMITER) return next();
  const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
  const key = `rl_global_${ip}`;
  const path = new URL(c.req.url).pathname;
  try {
    const current = await c.env.LIMITER.get(key);
    const count = current ? parseInt(current) : 0;
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

app.use('/api/auth/*', async (c, next) => {
  if (!c.env.LIMITER) return next();
  const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
  const key = `rl_auth_ip_${ip}`;
  const path = new URL(c.req.url).pathname;
  try {
    const current = await c.env.LIMITER.get(key);
    const count = current ? parseInt(current) : 0;
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

app.use('/api/search/*', async (c, next) => {
  if (!c.env.LIMITER) return next();
  const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
  const key = `rl_search_${ip}`;
  const path = new URL(c.req.url).pathname;
  try {
    const current = await c.env.LIMITER.get(key);
    const count = current ? parseInt(current) : 0;
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

export async function logSuspiciousIp(limiter: KVNamespace, ip: string, reason: string, endpoint: string): Promise<void> {
  try {
    const logKey = `iplog_${ip}_${Date.now()}`;
    await limiter.put(logKey, JSON.stringify({ ip, reason, endpoint, created_at: new Date().toISOString() }), { expirationTtl: 604800 });
  } catch (err) {
    console.error('[IP LOG] Error:', err);
  }
}

export async function autoBlacklistIfAbuse(limiter: KVNamespace, ip: string, reason: string): Promise<void> {
  try {
    const abuseKey = `abuse_count_${ip}`;
    const current = await limiter.get(abuseKey);
    const count = current ? parseInt(current) : 0;
    const newCount = count + 1;
    if (newCount >= 5) {
      const blacklistKey = `blacklist_${ip}`;
      const existing = await limiter.get(blacklistKey);
      if (!existing) {
        await limiter.put(blacklistKey, JSON.stringify({ ip, reason, auto: true, created_at: new Date().toISOString() }), { expirationTtl: 86400 });
        await limiter.delete(abuseKey);
      }
    } else {
      await limiter.put(abuseKey, newCount.toString(), { expirationTtl: 3600 });
    }
  } catch (err) {
    console.error('[AUTO BLACKLIST] Error:', err);
  }
}

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api/auth', authRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/articles', articlesRoutes);
app.route('/api/upload', uploadRoutes);

app.notFound((c) => c.json({ success: false, message: 'Endpoint tidak ditemukan.' }, 404));
app.onError((err, c) => {
  console.error('[ERROR]:', err.message);
  return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('[CRON] Mulai generate artikel mingguan...');
    ctx.waitUntil(generateWeeklyArticle(env));
  },
};