import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? searchParams.get('redirectTo') ?? '/';

  // Selalu pakai SITE_URL di production
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = (isProduction && siteUrl) ? siteUrl : origin;

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { }
        },
      },
    }
  );

  // Handle reset password — redirect ke halaman reset
  if (token_hash && type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    });

    if (!error) {
      return NextResponse.redirect(`${baseUrl}/reset-kata-sandi`);
    }

    return NextResponse.redirect(`${baseUrl}/lupa-kata-sandi?error=link_expired`);
  }

  // Handle magic link / email verification (token_hash)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_banned, role')
          .eq('id', user.id)
          .single();

        if (profile?.is_banned === true) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${baseUrl}/login?error=banned`);
        }

        if (profile?.role === 'admin') {
          return NextResponse.redirect(`${baseUrl}/admin`);
        }
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // Handle OAuth / code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_banned, role')
          .eq('id', user.id)
          .single();

        if (profile?.is_banned === true) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${baseUrl}/login?error=banned`);
        }

        if (profile?.role === 'admin') {
          return NextResponse.redirect(`${baseUrl}/admin`);
        }
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
}