import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminShell from '@/features/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore  = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  if (!refreshToken) redirect('/');

  const base = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  const refreshRes = await fetch(`${base}/api/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  const refreshData = await refreshRes.json();
  const token = refreshData?.accessToken;
  if (!token) redirect('/');

  const meRes = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const user = await meRes.json();
  if (!user || user.role !== 'admin') redirect('/');

  return (
    <AdminShell email={user.email ?? ''}>
      {children}
    </AdminShell>
  );
}