'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { }
        },
      },
    }
  );
}

// ── Helper: ambil auth token ──────────────────────────────────────────────────
async function getAuthToken(): Promise<string> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Unauthorized');
  return session.access_token;
}

// ── Helper: validasi admin role ───────────────────────────────────────────────
async function validateAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') throw new Error('Forbidden');
  return user;
}

// ── Update Report Status ──────────────────────────────────────────────────────
export async function updateReportStatus(
  reportId: string,
  status: 'verified' | 'rejected' | 'pending' | 'withdrawn'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
    throw new Error('Forbidden');
  }

  const { error } = await supabase.rpc('update_report_status', {
    report_id: reportId,
    new_status: status,
  });

  if (error) throw new Error('Gagal update status');

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/dashboard');
}

// ── Update User Role — lewat backend 3 layer ─────────────────────────────────
export async function updateUserRole(
  userId: string,
  role: 'user' | 'admin' | 'moderator'
) {
  await validateAdmin();
  const token = await getAuthToken();

  const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Gagal update role');

  revalidatePath('/admin');
}

// ── Ban User — lewat backend 3 layer ──────────────────────────────────────────
export async function banUser(userId: string) {
  await validateAdmin();
  const token = await getAuthToken();

  const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/ban`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Gagal memblokir pengguna');

  revalidatePath('/admin');
}

// ── Unban User — lewat backend 3 layer ────────────────────────────────────────
export async function unbanUser(userId: string) {
  await validateAdmin();
  const token = await getAuthToken();

  const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/unban`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Gagal membuka blokir pengguna');

  revalidatePath('/admin');
}