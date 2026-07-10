import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/app/admin/AdminDashboard';
import type { FeedbackItem } from '@/features/admin/tabs/FeedbackTab';

export const dynamic = 'force-dynamic';

const BASE = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function adminFetch(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  return res.json();
}

export default async function AdminPage() {
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
  const me = await meRes.json();
  if (!meRes.ok || me?.role !== 'admin') redirect('/');

  const [statsRes, reportsRes, usersRes] = await Promise.all([
    adminFetch('/api/admin/stats', token),
    adminFetch('/api/admin/reports?limit=1000', token),
    adminFetch('/api/admin/users', token),
  ]);

  const stats = {
    total:    Number(statsRes.data?.totalReports ?? 0),
    pending:  Number(statsRes.data?.pending      ?? 0),
    verified: Number(statsRes.data?.verified     ?? 0),
    rejected: Number(statsRes.data?.rejected     ?? 0),
    newUsers: Number(statsRes.data?.newUsers     ?? 0),
  };

  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <AdminDashboard
        stats={stats}
        reports={(reportsRes.data ?? []) as any[]}
        users={(usersRes.data ?? []) as any[]}
        feedbacks={[] as FeedbackItem[]}
        token={token}
      />
    </Suspense>
  );
}