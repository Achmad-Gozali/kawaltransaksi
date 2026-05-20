'use client';

import { useEffect } from 'react';
import { createClient } from '@/core/supabase/browser';
import { useRouter } from 'next/navigation';

export default function ConfirmPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          router.push('/');
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      } else {
        router.push('/login');
      }
    };

    handleHash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500 text-sm font-medium">Memverifikasi akun kamu...</p>
    </div>
  );
}