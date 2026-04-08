import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import reportsRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import searchRoutes from './routes/search'; // FIX: import route baru
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://kawaltransaksi.vercel.app',
      c.env.FRONTEND_URL,
    ].filter(Boolean);
    if (allowedOrigins.includes(origin ?? '')) return origin;
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// FIX: Rate limiter dengan guard
app.use('/api/*', async (c, next) => {
  if (!c.env.LIMITER) {
    console.warn('[RATE LIMIT] KV binding LIMITER tidak tersedia. Rate limiting dinonaktifkan.');
    return next();
  }

  const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
  const key = `rate_limit_${ip}`;

  try {
    const current = await c.env.LIMITER.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= 20) {
      return c.json({ success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.' }, 429);
    }

    await c.env.LIMITER.put(key, (count + 1).toString(), { expirationTtl: 60 });
  } catch (err) {
    console.error('[RATE LIMIT] Error mengakses KV:', err);
  }

  return next();
});

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api/auth', authRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/search', searchRoutes); // FIX: daftarkan route baru

app.notFound((c) => c.json({ success: false, message: 'Endpoint tidak ditemukan.' }, 404));
app.onError((err, c) => {
  console.error('[ERROR]:', err.message);
  return c.json({ success: false, message: 'Terjadi kesalahan server.' }, 500);
});

export default app;