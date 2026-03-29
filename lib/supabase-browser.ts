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
      auth: {
        // ✅ Pakai implicit flow — fix PKCE code exchange error
        // PKCE butuh cookie yang persist antara /authorize dan /callback
        // di Vercel kadang cookie hilang karena edge network
        flowType: 'implicit',
      },
    }
  );
}