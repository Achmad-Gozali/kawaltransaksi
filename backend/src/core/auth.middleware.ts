import { createMiddleware } from 'hono/factory';
import { getSupabaseAdmin } from './supabase';
import type { Env } from '../types';

export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ success: false, message: "Token tidak ditemukan." }, 401);
  }

  const token = authHeader.split(" ")[1];
  const supabase = getSupabaseAdmin(c.env);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return c.json(
      { success: false, message: "Token tidak valid atau sudah kadaluarsa." },
      401,
    );
  }

  // FIX: Cek is_banned — user yang di-ban tidak boleh akses protected route
  // meskipun token masih valid
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    return c.json(
      {
        success: false,
        message: "Akun Anda telah dinonaktifkan. Hubungi admin.",
      },
      403,
    );
  }

  c.set("userId", user.id);
  c.set("userEmail", user.email ?? "");
  await next();
});