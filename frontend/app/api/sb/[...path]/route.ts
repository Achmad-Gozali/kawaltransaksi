import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const ALLOWED_PATHS = [
  'auth/v1',
  'rest/v1',
  'storage/v1/object/public',
  'storage/v1/object/sign',
  'storage/v1/upload',
];

// Rate limit sederhana via Upstash — sama dengan middleware.ts
const PROXY_RATE_LIMIT = 120; // req/menit per IP

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function checkRateLimit(redis: Redis, ip: string): Promise<boolean> {
  const key   = `rl_proxy_${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count <= PROXY_RATE_LIMIT;
}

function getIp(req: NextRequest): string {
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'anonymous';
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const pathStr  = path.join('/');

  const isAllowed = ALLOWED_PATHS.some(p => pathStr.startsWith(p));
  if (!isAllowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip    = getIp(req);
  const redis = getRedis();
  if (redis && ip !== 'anonymous') {
    try {
      const allowed = await checkRateLimit(redis, ip);
      if (!allowed)
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    } catch (err) {
      console.error('[PROXY RL]:', err);
    }
  }

  const targetUrl = `${SUPABASE_URL}/${pathStr}${req.nextUrl.search}`;
  const headers   = new Headers();

  req.headers.forEach((value, key) => {
    if (!['connection', 'host', 'keep-alive', 'transfer-encoding'].includes(key.toLowerCase()))
      headers.set(key, value);
  });
  headers.set('host', new URL(SUPABASE_URL).host);

  try {
    const response = await fetch(targetUrl, {
      method:  req.method,
      headers,
      body:    req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      // @ts-expect-error duplex required for streaming
      duplex: 'half',
    });

    const resHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!['connection', 'transfer-encoding', 'x-supabase-api-version'].includes(key.toLowerCase()))
        resHeaders.set(key, value);
    });

    return new NextResponse(response.body, { status: response.status, headers: resHeaders });
  } catch {
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const PATCH   = handler;
export const DELETE  = handler;
export const HEAD    = handler;
export const OPTIONS = handler;