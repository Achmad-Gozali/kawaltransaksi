import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Calendar, Shield } from 'lucide-react';
import type { Metadata } from 'next';
import * as motion from 'motion/react-client';

export const metadata: Metadata = {
  title: 'Profil Saya - KawalTransaksi',
};

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { }
        },
      },
    }
  );
}

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
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const provider = user.app_metadata?.provider ?? 'email';

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            Kembali
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
            <User className="w-3 h-3" /> Profil Saya
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Akun Saya</h1>
          <p className="text-zinc-400 text-sm mt-1">Informasi akun kamu di KawalTransaksi</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-zinc-200 rounded-2xl p-6 flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-black">{initials}</span>
          </div>
          <div>
            <p className="text-lg font-extrabold text-zinc-900">{fullName}</p>
            <p className="text-sm text-zinc-400">{user.email}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-zinc-200 rounded-2xl divide-y divide-zinc-100"
        >
          {[
            { icon: User,     label: 'Nama Lengkap',   value: fullName },
            { icon: Mail,     label: 'Email',           value: user.email ?? '-' },
            { icon: Calendar, label: 'Bergabung Sejak', value: joinedAt },
            { icon: Shield,   label: 'Login Via',       value: provider.charAt(0).toUpperCase() + provider.slice(1) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-4">
              <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-zinc-900 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 gap-3"
        >
          <Link href="/dashboard/laporan"
            className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl p-4 hover:border-zinc-300 hover:shadow-md transition-all group">
            <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-zinc-900 transition-colors">
              <Shield className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Laporan Saya</p>
              <p className="text-[11px] text-zinc-400">Lihat riwayat</p>
            </div>
          </Link>
          <Link href="/report"
            className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl p-4 hover:border-zinc-300 hover:shadow-md transition-all group">
            <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
              <User className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Buat Laporan</p>
              <p className="text-[11px] text-zinc-400">Laporkan penipu</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}