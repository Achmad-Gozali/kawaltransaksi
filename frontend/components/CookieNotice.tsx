'use client';

import { useEffect, useState } from 'react';

// Lazy load icon supaya tidak masuk bundle utama
import dynamic from 'next/dynamic';
const Cookie = dynamic(() => import('lucide-react').then((m) => ({ default: m.Cookie })), {
  ssr: false,
});

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay lebih panjang supaya LCP selesai dulu sebelum notice muncul
    const timer = setTimeout(() => {
      try {
        const accepted = localStorage.getItem('cookie_notice_accepted');
        if (!accepted) setVisible(true);
      } catch {
        // ignore localStorage error (private mode, dll)
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('cookie_notice_accepted', '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 text-white shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-6 sm:py-5 max-w-screen-2xl mx-auto w-full">
        <div className="flex items-start sm:items-center gap-4 flex-1">
          <Cookie className="w-7 h-7 shrink-0 text-red-400 mt-0.5 sm:mt-0" />
          <p className="text-base text-zinc-200 leading-relaxed">
            Website ini menggunakan cookie untuk menyimpan sesi login dan analitik penggunaan.
            Dengan melanjutkan, kamu menyetujui{' '}
            <a
              href="/kebijakan-privasi"
              className="text-red-400 underline underline-offset-2 hover:text-red-300 font-medium"
            >
              kebijakan privasi
            </a>{' '}
            kami.
          </p>
        </div>
        <button
          onClick={handleAccept}
          className="w-full sm:w-auto shrink-0 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-base font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}