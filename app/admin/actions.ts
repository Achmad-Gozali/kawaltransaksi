'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function updateReportStatus(
  reportId: string,
  status: 'verified' | 'rejected' | 'pending'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as any;
  if (!profile || profile.role !== 'admin') throw new Error('Forbidden');

  const { error } = await (supabase as any).rpc('update_report_status', {
    report_id: reportId,
    new_status: status,
  });
  if (error) throw new Error('Gagal update status');

  revalidatePath('/admin');
  revalidatePath('/');
}

export async function updateUserRole(
  userId: string,
  role: 'user' | 'admin' | 'moderator'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as any;
  if (!profile || profile.role !== 'admin') throw new Error('Forbidden');

  const { error } = await (supabase as any)
    .from('profiles').update({ role }).eq('id', userId);
  if (error) throw new Error('Gagal update role');

  revalidatePath('/admin');
}