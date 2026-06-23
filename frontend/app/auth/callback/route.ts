import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_OTP_TYPES = ['recovery', 'signup', 'magiclink', 'email'] as const;
type AllowedOtpType = typeof ALLOWED_OTP_TYPES[number];

function getSafeNext(next: string | null): string {
  if (!next) return '/dashboard';
  try {
    // Tolak absolute URL / protocol-relative
    if (next.startsWith('http') || next.startsWith('//')) return '/dashboard';
    // Hanya izinkan path yang dimulai /
    if (!next.startsWith('/')) return '/dashboard';
    return next;
  } catch { return '/dashboard'; }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code       = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type       = searchParams.get('type');
  const next       = getSafeNext(searchParams.get('next')); // hapus state sebagai fallback

  const siteUrl      = process.env.NEXT_PUBLIC_SITE_URL;
  const isProduction = process.env.NODE_ENV === 'production' && !!siteUrl && !origin.includes('localhost');
  const baseUrl      = isProduction && siteUrl ? siteUrl : origin;

  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );

  if (token_hash && type) {
    // Validasi type — tolak nilai arbitrary
    if (!ALLOWED_OTP_TYPES.includes(type as AllowedOtpType))
      return NextResponse.redirect(`${baseUrl}/login?error=invalid_type`);

    if (type === 'recovery') {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'recovery' });
      if (!error) return NextResponse.redirect(`${baseUrl}/reset-kata-sandi`);
      return NextResponse.redirect(`${baseUrl}/lupa-kata-sandi?error=link_expired`);
    }

    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as AllowedOtpType });
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_banned, role').eq('id', user.id).single();
        if (profile?.is_banned) { await supabase.auth.signOut(); return NextResponse.redirect(`${baseUrl}/login?error=banned`); }
        if (profile?.role === 'admin') return NextResponse.redirect(`${baseUrl}/admin`);
      }
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
    return NextResponse.redirect(`${baseUrl}/login?error=link_expired`);
  }

  if (code) {
    const isDirectGoogle = searchParams.get('state') !== null && !searchParams.get('next');

    if (isDirectGoogle) {
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body:    new URLSearchParams({
            code,
            client_id:     process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            redirect_uri:  `${baseUrl}/auth/callback`,
            grant_type:    'authorization_code',
          }),
        });

        const tokenData = await tokenRes.json() as { id_token?: string; access_token?: string; error?: string };
        if (tokenData.error || !tokenData.id_token) {
          console.error('Google token exchange error:', tokenData.error);
          return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider:     'google',
          token:        tokenData.id_token,
          access_token: tokenData.access_token,
        });
        if (error) return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
      } catch (e) {
        console.error('OAuth callback error:', e);
        return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
      }
    } else {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_banned, role').eq('id', user.id).single();
      if (profile?.is_banned) { await supabase.auth.signOut(); return NextResponse.redirect(`${baseUrl}/login?error=banned`); }
      if (profile?.role === 'admin') return NextResponse.redirect(`${baseUrl}/admin`);
    }

    return NextResponse.redirect(`${baseUrl}${next}`);
  }

  return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
}