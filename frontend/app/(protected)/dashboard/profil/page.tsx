import { createClient } from '@/core/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Mail, Calendar, Shield, FileText, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import ProfileActions from './ProfileActions';

export const metadata: Metadata = {
  title: 'Profil Saya — KawalTransaksi',
};

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.preferred_username ||
    user.email?.split('@')[0] ||
    'Pengguna';

  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  const joinedAt = new Date(user.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const provider = user.app_metadata?.provider ?? 'email';

  const infoItems = [
    { icon: Mail, label: 'Email', value: user.email ?? '-' },
    { icon: Calendar, label: 'Bergabung', value: joinedAt },
    { icon: Shield, label: 'Login via', value: provider.charAt(0).toUpperCase() + provider.slice(1) },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-10">

        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Akun</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Kelola informasi profil kamu</p>
        </div>

        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 space-y-6 lg:space-y-0">

          {/* ===== Kolom kiri: identitas (sticky di desktop) ===== */}
          <div className="lg:sticky lg:top-8 lg:self-start space-y-6">
            {/* Avatar + nama */}
            <div className="bg-white border border-zinc-200 rounded-2xl px-6 py-5 lg:py-8 flex items-center gap-4 lg:flex-col lg:text-center lg:gap-3">
              <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                <span className="text-white text-lg lg:text-2xl font-bold tracking-tight">{initials}</span>
              </div>
              <div>
                <p className="font-semibold text-zinc-900">{fullName}</p>
                <p className="text-sm text-zinc-400">{user.email}</p>
              </div>
            </div>

            {/* Info */}
            <div className="bg-white border border-zinc-200 rounded-2xl px-6 divide-y divide-zinc-100">
              {infoItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-3">
                  <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-400">{label}</p>
                    <p className="text-sm font-medium text-zinc-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== Kolom kanan: settings + quick links ===== */}
          <div className="space-y-6 min-w-0">
            {/* Actions */}
            <ProfileActions
              currentName={fullName}
              email={user.email ?? ''}
              provider={provider}
            />

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/laporan"
                className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-4 py-4 lg:p-5 hover:border-zinc-300 hover:shadow-sm transition-all group"
              >
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-zinc-900 transition-colors shrink-0">
                  <FileText className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Laporan Saya</p>
                  <p className="text-xs text-zinc-400">Lihat riwayat</p>
                </div>
              </Link>
              <Link
                href="/report"
                className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-4 py-4 lg:p-5 hover:border-zinc-300 hover:shadow-sm transition-all group"
              >
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors shrink-0">
                  <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Buat Laporan</p>
                  <p className="text-xs text-zinc-400">Laporkan penipu</p>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}