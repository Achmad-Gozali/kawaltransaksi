'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeedbackButton from '@/components/FeedbackButton';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { createBrowserClient } from '@supabase/ssr';

NProgress.configure({ showSpinner: false, trickleSpeed: 200 });

const IDLE_MS = 30 * 60 * 1000; // 30 menit
const WARN_MS = 2 * 60 * 1000;  // warning 2 menit sebelum logout
const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

export default function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const prevPathname = useRef(pathname);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login?reason=idle');
  }, [supabase, router]);

  const resetTimer = useCallback(() => {
    setShowWarning(false);

    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);

    warnTimer.current = setTimeout(() => setShowWarning(true), IDLE_MS - WARN_MS);
    idleTimer.current = setTimeout(() => logout(), IDLE_MS);
  }, [logout]);

  useEffect(() => {
    resetTimer();
    IDLE_EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      IDLE_EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warnTimer.current) clearTimeout(warnTimer.current);
    };
  }, [resetTimer]);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      NProgress.done();
      prevPathname.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
      if (href !== pathname) NProgress.start();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <style>{`
        #nprogress .bar {
          background: #10b981 !important;
          height: 3px !important;
        }
        #nprogress .peg {
          box-shadow: 0 0 10px #10b981, 0 0 5px #10b981 !important;
        }
      `}</style>

      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <FeedbackButton />

      {/* Idle warning */}
      {showWarning && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <span>Sesi akan berakhir dalam 2 menit.</span>
          <button
            onClick={resetTimer}
            className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors shrink-0"
          >
            Tetap masuk
          </button>
        </div>
      )}

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-700 transition-all active:scale-95"
          aria-label="Kembali ke atas"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}