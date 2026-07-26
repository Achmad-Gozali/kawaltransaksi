'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Idle-logout timer sudah dipindah ke IdleLogoutWatcher di root layout,
// sehingga berjalan di SEMUA halaman (termasuk halaman publik) selama user
// login -- bukan cuma di halaman protected. ProtectedShell di sini murni
// mengurus tampilan (Navbar, Footer, tombol back-to-top), tanpa timer
// duplikat, supaya tidak ada dua instance BroadcastChannel/idle-timer yang
// berjalan bersamaan dan saling tabrakan di halaman protected.

export default function ProtectedShell({ children }: { children: React.ReactNode }) {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-700 transition-all active:scale-95"
          aria-label="Kembali ke atas"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}