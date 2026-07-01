import { NextResponse, type NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

const RATE_LIMITS = {
  report: { requests: 5,   window: '1 h'  },
  check:  { requests: 30,  window: '1 m'  },
  auth:   { requests: 10,  window: '15 m' },
  page:   { requests: 120, window: '1 m'  },
  global: { requests: 60,  window: '1 m'  },
} as const;

type LimitKey = keyof typeof RATE_LIMITS;

let _limiters: Map<LimitKey, Ratelimit> | null = null;

function getLimiters(redis: Redis): Map<LimitKey, Ratelimit> {
  if (_limiters) return _limiters;
  _limiters = new Map(
    (Object.keys(RATE_LIMITS) as LimitKey[]).map(key => [
      key,
      new Ratelimit({
        redis,
        limiter:   Ratelimit.slidingWindow(RATE_LIMITS[key].requests, RATE_LIMITS[key].window),
        prefix:    `rl_fe_${key}`,
        analytics: false,
      }),
    ])
  );
  return _limiters;
}

function getIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'anonymous'
  );
}

function getLimitKey(pathname: string): LimitKey | null {
  if (
    (pathname.startsWith('/dashboard/laporan') && pathname.endsWith('/baru')) ||
    pathname.startsWith('/report')
  ) return 'report';
  if (pathname.startsWith('/api/auth')) return 'auth';
  if (
    pathname.startsWith('/cek-nomor') ||
    pathname.startsWith('/check') ||
    pathname.startsWith('/cek-rekening')
  ) return 'check';
  if (
    pathname === '/' ||
    pathname.startsWith('/artikel') ||
    pathname.startsWith('/laporan-publik') ||
    pathname.startsWith('/edukasi') ||
    pathname.startsWith('/faq') ||
    pathname.startsWith('/kontak') ||
    pathname.startsWith('/developer') ||
    pathname.startsWith('/syarat-ketentuan') ||
    pathname.startsWith('/kebijakan-privasi')
  ) return 'page';
  return null;
}

async function applyRateLimit(
  request: NextRequest,
  redis: Redis,
  key: LimitKey
): Promise<NextResponse | null> {
  const ip      = getIp(request);
  const limiter = getLimiters(redis).get(key)!;
  const { success, limit, remaining, reset } = await limiter.limit(ip);
  if (!success) {
    return NextResponse.json(
      { success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.', retry_after: Math.ceil((reset - Date.now()) / 1000) },
      { status: 429, headers: {
        'X-RateLimit-Limit':     limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset':     reset.toString(),
        'Retry-After':           Math.ceil((reset - Date.now()) / 1000).toString(),
      }}
    );
  }
  return null;
}

const SAFE_REDIRECT_PREFIXES = ['/dashboard', '/profil'];

function getSafeRedirect(pathname: string): string {
  if (SAFE_REDIRECT_PREFIXES.some(p => pathname.startsWith(p))) return pathname;
  return '/dashboard';
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function getSessionFromBackend(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { success?: boolean; userId?: string; role?: string };
    if (!data.success || !data.userId) return null;
    return { userId: data.userId, role: data.role ?? 'user' };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname    = request.nextUrl.pathname;
  const isLocalhost = request.nextUrl.hostname === 'localhost';

  const isMaintenance     = process.env.MAINTENANCE_MODE === 'true';
  const isMaintenancePage = pathname.startsWith('/maintenance');
  const isStaticAsset     = pathname.startsWith('/_next') || pathname.startsWith('/api');

  if (isMaintenance && !isMaintenancePage && !isStaticAsset)
    return NextResponse.redirect(new URL('/maintenance', request.url));
  if (!isMaintenance && isMaintenancePage)
    return NextResponse.redirect(new URL('/', request.url));

  const redis    = getRedis();
  const limitKey = getLimitKey(pathname);

  if (redis && limitKey && !isLocalhost) {
    try {
      const rateLimitResponse = await applyRateLimit(request, redis, limitKey);
      if (rateLimitResponse) return rateLimitResponse;
    } catch (err) {
      console.error('[RATE LIMIT] Error:', err);
    }
  }

  const needsAuth = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  if (!needsAuth) {
    const response = NextResponse.next();
    response.headers.delete('x-vercel-id');
    response.headers.delete('x-vercel-cache');
    response.headers.delete('server');
    return response;
  }

  const sessionToken = request.cookies.get('better-auth.session_token')?.value;

  if (!sessionToken) {
    if (pathname.startsWith('/dashboard')) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirectTo', getSafeRedirect(pathname));
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const session = await getSessionFromBackend(sessionToken);

  if (!session) {
    const url = new URL('/login', request.url);
    if (pathname.startsWith('/dashboard'))
      url.searchParams.set('redirectTo', getSafeRedirect(pathname));
    const res = NextResponse.redirect(url);
    res.cookies.delete('better-auth.session_token');
    return res;
  }

  if (pathname.startsWith('/admin') && session.role !== 'admin')
    return NextResponse.redirect(new URL('/', request.url));

  const response = NextResponse.next();
  response.headers.set('x-user-id', session.userId);
  response.headers.set('x-user-role', session.role);
  response.headers.delete('x-vercel-id');
  response.headers.delete('x-vercel-cache');
  response.headers.delete('server');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};