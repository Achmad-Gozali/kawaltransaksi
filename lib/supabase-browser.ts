// ============================================
// 📁 LOKASI: lib/supabase-browser.ts
// 📝 BARU — Supabase client untuk client components
// ⚠️  HAPUS file lama lib/supabase.ts (yang mock)
// ============================================

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}