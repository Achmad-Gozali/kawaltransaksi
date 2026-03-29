// ============================================
// 📁 LOKASI: app/auth/callback/route.ts
// 📝 BARU — OAuth callback handler
// Supabase redirect ke sini setelah user approve OAuth
// ============================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // ✅ next = halaman tujuan setelah login (dari redirectTo param)
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore di Server Component
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ✅ Redirect ke halaman tujuan setelah session berhasil dibuat
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('OAuth callback error:', error);
  }

  // ✅ Kalau gagal, redirect ke login dengan pesan error
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}