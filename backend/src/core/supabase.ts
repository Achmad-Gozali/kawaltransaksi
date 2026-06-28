import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws },
    },
  );
}

function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws },
    },
  );
}

export { getSupabaseAdmin, getSupabaseClient };