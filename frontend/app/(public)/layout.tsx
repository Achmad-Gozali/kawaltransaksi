'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
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
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}