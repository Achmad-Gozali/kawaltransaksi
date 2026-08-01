import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BASE = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
}

// cache() dedup per request: layout admin & page admin sama-sama panggil ini,
// tapi cuma benar-benar fetch sekali per request (bukan 2x refresh+me).
export const requireAdminSession = cache(async (): Promise<{ token: string; user: AdminSessionUser }> => {
  const cookieStore  = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  if (!refreshToken) redirect('/');

  const refreshRes = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  const refreshData = await refreshRes.json();
  const token = refreshData?.accessToken;
  if (!token) redirect('/');

  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const user = await meRes.json();
  if (!meRes.ok || user?.role !== 'admin') redirect('/');

  return { token, user };
});
