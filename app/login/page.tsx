import AuthForm from '@/components/AuthForm';
import { createClient } from '@/lib/supabase-server';
import { Shield, FileText, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error: oauthError } = await searchParams;

  const supabase = await createClient();
  const { count: totalReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });
  const { count: verifiedCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'verified');

  return (
    <div className="min-h-screen flex">

      {/* LEFT */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between px-14 py-16 bg-white border-r border-zinc-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-zinc-900">
            CEK<span className="text-red-500">NO</span>SCAM
          </span>
        </Link>

        <div className="space-y-10">
          <div>
            <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tight leading-[1.1] mb-4">
              Bersama Kita<br />
              <span className="text-red-500">Lawan Penipuan.</span>
            </h2>
            <p className="text-zinc-500 text-base leading-relaxed max-w-sm">
              Bergabung dengan komunitas yang aktif melindungi sesama dari penipu online. Setiap laporan berarti.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
              <p className="text-3xl font-extrabold text-zinc-900">{totalReports || 0}</p>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-semibold">Total Laporan</p>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
              <p className="text-3xl font-extrabold text-red-500">{verifiedCount || 0}</p>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-semibold">Terverifikasi</p>
            </div>
          </div>

          <div className="space-y-5">
            {[
              { icon: FileText, text: 'Lapor nomor penipu langsung dari akunmu' },
              { icon: CheckCircle2, text: 'Pantau status laporan yang kamu kirim' },
              { icon: Users, text: 'Berkontribusi untuk komunitas anti-penipuan' },
              { icon: TrendingUp, text: 'Lihat statistik dan tren penipuan terkini' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-600 font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-400 font-medium italic">
          &quot;Satu laporan bisa menyelamatkan banyak orang.&quot;
        </p>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16 bg-zinc-50">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center justify-center gap-2 mb-10">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight text-zinc-900">
              CEK<span className="text-red-500">NO</span>SCAM
            </span>
          </div>

          {/* ✅ Tampilkan error kalau OAuth gagal */}
          {oauthError === 'oauth_failed' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold text-center">
              Login dengan akun sosial gagal. Silakan coba lagi.
            </div>
          )}

          <AuthForm type="login" />
        </div>
      </div>

    </div>
  );
}