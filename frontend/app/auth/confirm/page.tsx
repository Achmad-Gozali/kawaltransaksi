'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

function ConfirmInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) { router.push('/login'); return; }

    fetch(`${BACKEND_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then((data: { success?: boolean }) => {
        router.push(data.success ? '/login?verified=1' : '/login?error=link_expired');
      })
      .catch(() => router.push('/login?error=link_expired'));
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500 text-sm font-medium">Memverifikasi akun kamu...</p>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-slate-500 text-sm">Memuat...</p></div>}>
      <ConfirmInner />
    </Suspense>
  );
}