import { redirect } from 'next/navigation';
import { createClient } from '@/core/supabase/server';
import ProtectedShell from '@/components/ProtectedShell';

// -- Server Component -- cek auth dulu -----------------------------------------
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <ProtectedShell>{children}</ProtectedShell>;
}