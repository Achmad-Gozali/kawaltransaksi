import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── MAINTENANCE MODE ──────────────────────────────────────────────────────
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  const isMaintenancePage = pathname.startsWith('/maintenance');
  const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/api');

  if (isMaintenance && !isMaintenancePage && !isStaticAsset) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  if (!isMaintenance && isMaintenancePage) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  // ─────────────────────────────────────────────────────────────────────────

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
            })
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (['/dashboard', '/admin'].some(path => pathname.startsWith(path)) && !user) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin') && user) {
    const cachedRole = request.cookies.get('user_role')?.value;

    if (cachedRole && cachedRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (!cachedRole) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      supabaseResponse.cookies.set('user_role', profile.role, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60,
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