import { createClient } from "@supabase/supabase-js";
import type { Env } from "../types";
import ws from "ws";

export function getSupabaseAdmin(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetch as any },
    realtime: { transport: ws as any },
  });
}

export function getSupabaseClient(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetch as any },
    realtime: { transport: ws as any },
  });
}
