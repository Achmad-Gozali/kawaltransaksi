// ============================================
// 📁 LOKASI: app/login/page.tsx
// ✅ FIX:
//    1. Hapus Math.random() — hydration mismatch
//    2. Ganti dengan data real dari query Supabase
//    3. Branding konsisten: KawalTransaksi
// ============================================

import AuthForm from '@/components/AuthForm';
import { createClient } from '@/lib/supabase-server';
import { ShieldCheck, TrendingUp, Users, Star } from 'lucide-react';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error: oauthError } = await searchParams;

  const supabase = await createClient();

  // ✅ FIX: Query data real, bukan random
  const [
    { count: totalReports },
    { count: verifiedCount },
    { count: todayCount },
  ] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified'),
    // ✅ FIX: Hitung laporan hari ini — ganti Math.random()
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .gte(
        'created_at',
        new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
      ),
  ]);

  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-14 py-16 bg-gradient-to-br from-zinc-50 to-white border-r border-zinc-100 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-60" />

        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tight leading-[1.15] mb-4">
              Lindungi Diri &<br />
              Orang Tersayang dari
              <br />
              <span className="text-red-500">Penipu Online.</span>
            </h2>
            <p className="text-zinc-500 text-base leading-relaxed max-w-sm">
              Bergabung dengan komunitas yang aktif melindungi sesama dari
              penipu online. Gratis, cepat, dan terpercaya.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
              <p className="text-3xl font-extrabold text-zinc-900">
                {totalReports || 0}
              </p>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                Laporan Masuk
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
              <p className="text-3xl font-extrabold text-red-500">
                {verifiedCount || 0}
              </p>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                Terverifikasi
              </p>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed italic mb-3">
              &quot;Berkat KawalTransaksi, saya bisa cek rekening sebelum
              transfer dan ternyata itu penipu. Terima kasih!&quot;
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900">Budi S.</p>
                <p className="text-[10px] text-zinc-400">
                  Pengguna KawalTransaksi
                </p>
              </div>
            </div>
          </div>

          {/* ✅ FIX: Data real, bukan Math.random() */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>{todayCount || 0} laporan baru hari ini</span>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12 bg-white">
        <div className="w-full max-w-md">
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