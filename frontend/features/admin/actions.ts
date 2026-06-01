'use server';

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';

const VALID_STATUSES = ['verified', 'rejected', 'pending', 'withdrawn'] as const;
const VALID_ROLES    = ['user', 'admin', 'moderator'] as const;
const UUID_REGEX     = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ValidStatus = typeof VALID_STATUSES[number];
type ValidRole   = typeof VALID_ROLES[number];

function createAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function validateAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') throw new Error('Forbidden');
  return user;
}

function validUUID(id: string) {
  if (!UUID_REGEX.test(id)) throw new Error('ID tidak valid.');
}

export async function updateReportStatus(reportId: string, status: ValidStatus) {
  validUUID(reportId);
  if (!VALID_STATUSES.includes(status)) throw new Error(`Status tidak valid.`);
  await validateAdmin();
  const { error } = await createAdminClient().from('reports').update({ status }).eq('id', reportId);
  if (error) throw new Error('Gagal update status: ' + error.message);
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/dashboard');
}

export async function updateUserRole(userId: string, role: ValidRole) {
  validUUID(userId);
  if (!VALID_ROLES.includes(role)) throw new Error('Role tidak valid.');
  const admin = await validateAdmin();
  if (admin.id === userId) throw new Error('Tidak dapat mengubah role diri sendiri.');
  const { error } = await createAdminClient().from('profiles').update({ role }).eq('id', userId);
  if (error) throw new Error('Gagal update role: ' + error.message);
  revalidatePath('/admin');
}

// banUser & unbanUser digabung
export async function setBanStatus(userId: string, is_banned: boolean) {
  validUUID(userId);
  const admin = await validateAdmin();
  if (admin.id === userId) throw new Error('Tidak dapat mengubah status diri sendiri.');
  const { error } = await createAdminClient().from('profiles').update({ is_banned }).eq('id', userId);
  if (error) throw new Error(`Gagal ${is_banned ? 'memblokir' : 'membuka blokir'} pengguna: ` + error.message);
  revalidatePath('/admin');
}