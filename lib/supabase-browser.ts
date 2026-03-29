// ============================================
// 📁 LOKASI: lib/supabase-browser.ts
// ✅ FIX: Ganti flowType dari 'implicit' ke 'pkce'
//    Sebelumnya konflik — browser pakai implicit tapi callback pakai
//    exchangeCodeForSession() yang butuh PKCE flow.
//    Ini penyebab OAuth login bisa intermittent fail.
// ============================================

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // ✅ FIX: PKCE flow — sesuai dengan auth/callback/route.ts
        // yang pakai exchangeCodeForSession()
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
      },
    }
  );
}