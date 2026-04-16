'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function ConfirmPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500 text-sm font-medium">Memverifikasi akun kamu...</p>
    </div>
  );
}