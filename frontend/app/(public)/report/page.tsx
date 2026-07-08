import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Laporkan Penipuan - KawalTransaksi',
  description: 'Laporkan nomor rekening atau nomor telepon terduga pelaku penipuan. Bantu lindungi masyarakat Indonesia dari ancaman penipuan digital.',
};

const ReportForm    = dynamic(() => import('@/features/report/ReportForm'));
const ReportLanding = dynamic(() => import('@/features/report/ReportLanding'));

export default async function ReportPage() {
  const cookieStore  = await cookies();
  const token        = cookieStore.get('refresh_token')?.value;

  if (token) {
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