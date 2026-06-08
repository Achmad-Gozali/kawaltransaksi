import { createClient } from '@/core/supabase/server';
import dynamic from 'next/dynamic';

export const metadata = {
  title:       'Developer API - KawalTransaksi',
  description: 'REST API untuk verifikasi nomor HP, rekening bank, dan e-wallet. Gratis 300 request/hari.',
};

/*
 * Dynamic import: DeveloperClient sangat besar (pricing + docs + API key manager).
 * Tidak ada konten above-the-fold yang butuh JS langsung → aman di-lazy.
 * loading fallback: skeleton sederhana agar tidak blank saat hydrate.
 */
const DeveloperClient = dynamic(() => import('@/features/developer/DeveloperClient'), {
  loading: () => (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="bg-slate-100 h-64 w-full" />
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 bg-slate-100 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  ),
});

export default async function DeveloperPage() {
  const supabase           = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <DeveloperClient
      token={session?.access_token ?? ''}
      userEmail={session?.user?.email ?? ''}
      isLoggedIn={!!session}
    />
  );
}