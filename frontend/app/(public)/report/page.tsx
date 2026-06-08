import { createClient } from '@/core/supabase/server';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title:       'Laporkan Penipuan - KawalTransaksi',
  description: 'Laporkan nomor rekening atau nomor telepon terduga pelaku penipuan. Bantu lindungi masyarakat Indonesia dari ancaman penipuan digital.',
};

/*
 * Dynamic import: ReportForm & ReportLanding tidak pernah dirender bersamaan.
 * User login  → ReportForm   (~besar, ada multi-step form + upload)
 * User belum  → ReportLanding (~ringan, hanya static content)
 * Hasilnya: bundle awal lebih kecil, hanya load yang dibutuhkan.
 */
const ReportForm    = dynamic(() => import('@/features/report/ReportForm'));
const ReportLanding = dynamic(() => import('@/features/report/ReportLanding'));

export default async function ReportPage() {
  const supabase       = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <ReportForm />
        </div>
      </div>
    );
  }

  return <ReportLanding />;
}