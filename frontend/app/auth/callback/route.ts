import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getSafeNext(next: string | null): string {
  if (!next) return '/';
  if (next.startsWith('http') || next.startsWith('//')) return '/';
  if (!next.startsWith('/')) return '/';
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL;
  const isProduction = process.env.NODE_ENV === 'production' && !!siteUrl && !origin.includes('localhost');
  const baseUrl  = isProduction && siteUrl ? siteUrl : origin;
  const redirectTo = getSafeNext(state);

  if (error || !code)
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  try {
    const res = await fetch(`${backendUrl}/api/auth/google/callback`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, redirectUri: `${baseUrl}/auth/callback` }),
    });

    const data = await res.json() as {
      success?: boolean;
      session?: { token: string; expiresAt: string };
      user?: { role?: string };
      message?: string;
    };

    if (!data.success || !data.session)
      return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);

    const response = NextResponse.redirect(
      `${baseUrl}${data.user?.role === 'admin' ? '/admin' : redirectTo}`
    );

    const expires = new Date(data.session.expiresAt || Date.now() + 7 * 86400000);
    response.cookies.set('better-auth.session_token', data.session.token, {
      httpOnly: true,
      secure:   isProduction,
      sameSite: 'lax',
      expires,
      path:     '/',
    });

    return response;
  } catch (err) {
    console.error('[CALLBACK] OAuth error:', err);
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
  }
}