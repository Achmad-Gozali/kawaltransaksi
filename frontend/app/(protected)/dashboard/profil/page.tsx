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
    { icon: Mail,     label: 'Email',      value: user.email ?? '-' },
    { icon: Calendar, label: 'Bergabung',  value: joinedAt },
    { icon: Shield,   label: 'Login via',  value: provider.charAt(0).toUpperCase() + provider.slice(1) },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Akun</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Kelola informasi profil kamu</p>
        </div>

        {/* Avatar + nama — full width di mobile, row di sm+ */}
        <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-5 flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-bold tracking-tight">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 truncate">{fullName}</p>
            <p className="text-sm text-zinc-400 truncate">{user.email}</p>
          </div>
        </div>

        {/* Grid: info + actions — stack di mobile, side-by-side di lg */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 mb-4">

          {/* Info */}
          <div className="bg-white border border-zinc-200 rounded-2xl px-5 divide-y divide-zinc-100">
            {infoItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3.5">
                <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400">{label}</p>
                  <p className="text-sm font-medium text-zinc-900 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Edit fields */}
          <ProfileActions
            currentName={fullName}
            email={user.email ?? ''}
            provider={provider}
          />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/laporan"
            className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-4 py-4 hover:border-zinc-300 transition-colors group"
          >
            <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-zinc-900 transition-colors shrink-0">
              <FileText className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Laporan Saya</p>
              <p className="text-xs text-zinc-400">Lihat riwayat</p>
            </div>
          </Link>
          <Link
            href="/report"
            className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-4 py-4 hover:border-zinc-300 transition-colors group"
          >
            <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors shrink-0">
              <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Buat Laporan</p>
              <p className="text-xs text-zinc-400">Laporkan penipu</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}