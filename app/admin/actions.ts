// ============================================
// 📁 LOKASI: app/admin/actions.ts
// ✅ UPDATE: Tambah 'withdrawn' ke type updateReportStatus
// ============================================

'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function updateReportStatus(
  reportId: string,
  status: 'verified' | 'rejected' | 'pending' | 'withdrawn' // ✅ tambah withdrawn
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') throw new Error('Forbidden');

  const { error } = await supabase.rpc('update_report_status', {
    report_id: reportId,
    new_status: status,
  });

  if (error) {
    console.error('update_report_status error:', error);
    throw new Error('Gagal update status');
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/dashboard');
}

export async function updateUserRole(
  userId: string,
  role: 'user' | 'admin' | 'moderator'
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') throw new Error('Forbidden');

  const { error } = await supabase.rpc('update_user_role', {
    target_user_id: userId,
    new_role: role,
  });

  if (error) {
    console.error('update_user_role error:', error);
    throw new Error('Gagal update role');
  }

  revalidatePath('/admin');
}