// ============================================
// 📁 LOKASI: app/auth/callback/route.ts
// ============================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kawaltransaksi-kf68.vercel.app';

  if (error) {
    console.error('OAuth error from provider:', error);
    return NextResponse.redirect(`${siteUrl}/login?error=oauth_failed`);
  }

  if (code) {
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

    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data.user) {
      // ✅ Cek role — kalau admin langsung ke /admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single() as any;

      if (profile?.role === 'admin') {
        return NextResponse.redirect(`${siteUrl}/admin`);
      }

      return NextResponse.redirect(`${siteUrl}${next}`);
    }

    console.error('Code exchange failed:', exchangeError?.message);
  }

  return NextResponse.redirect(`${siteUrl}${next}`);
}