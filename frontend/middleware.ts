import { createServerClient } from '@supabase/ssr';
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
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
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
      {
        success:     false,
        message:     'Terlalu banyak permintaan. Coba lagi nanti.',
        retry_after: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status:  429,
        headers: {
          'X-RateLimit-Limit':     limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset':     reset.toString(),
          'Retry-After':           Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  return null;
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

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure:   !isLocalhost,
              sameSite: 'lax',
            })
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // FIX: /admin redirect tanpa redirectTo agar path tidak terekspos di URL
  if (pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // /dashboard tetap pakai redirectTo untuk UX
  if (pathname.startsWith('/dashboard') && !user) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin') && user) {
    const cachedRole = request.cookies.get('user_role')?.value;

    if (cachedRole === 'admin') {
      // Role sudah tervalidasi
    } else {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (profile?.role !== 'admin') {
        supabaseResponse = NextResponse.redirect(new URL('/', request.url));
        supabaseResponse.cookies.delete('user_role');
        return supabaseResponse;
      }

      supabaseResponse.cookies.set('user_role', profile.role, {
        httpOnly: true,
        secure:   !isLocalhost,
        sameSite: 'lax',
        maxAge:   60 * 15,
      });
    }
  }

  supabaseResponse.headers.delete('x-vercel-id');
  supabaseResponse.headers.delete('x-vercel-cache');
  supabaseResponse.headers.delete('x-vercel-ip-country');
  supabaseResponse.headers.delete('x-vercel-ip-country-region');
  supabaseResponse.headers.delete('x-vercel-ip-city');
  supabaseResponse.headers.delete('server');

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};