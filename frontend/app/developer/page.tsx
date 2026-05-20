import { createClient } from '@/core/supabase/server';
import DeveloperClient from '@/features/developer/DeveloperClient';

export const metadata = {
  title: 'Developer API - KawalTransaksi',
  description: 'REST API untuk verifikasi nomor HP, rekening bank, dan e-wallet. Gratis 300 request/hari.',
};

export default async function DeveloperPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <DeveloperClient
      token={session?.access_token ?? ''}
      userEmail={session?.user?.email ?? ''}
      isLoggedIn={!!session}
    />
  );
}