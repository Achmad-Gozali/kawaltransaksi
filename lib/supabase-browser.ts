// ============================================
// 📁 LOKASI: lib/supabase-browser.ts
// ============================================

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // ✅ Fix PKCE verifier cookie hilang di Vercel edge network
        // SameSite=None + Secure diperlukan untuk cross-site cookie
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 60 * 24, // 24 jam
      },
    }
  );
}