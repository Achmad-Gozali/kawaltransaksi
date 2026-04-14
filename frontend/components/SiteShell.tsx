'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false, trickleSpeed: 200 });

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [waHovered, setWaHovered] = useState(false);
  const prevPathname = useRef(pathname);

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
      {!isAdmin && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!isAdmin && <Footer />}

      {/* Floating WhatsApp Button */}
      {!isAdmin && (
        <a
          href="https://wa.me/6282249244647"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setWaHovered(true)}
          onMouseLeave={() => setWaHovered(false)}
          className="fixed bottom-20 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 overflow-hidden"
          style={{
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '10px',
            paddingRight: waHovered ? '16px' : '10px',
            maxWidth: waHovered ? '200px' : '44px',
            transition: 'max-width 0.3s ease, padding-right 0.3s ease',
          }}
          aria-label="Chat WhatsApp"
        >
          <svg
            className="w-6 h-6 flex-shrink-0"
            viewBox="0 0 448 512"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="white"
              d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"
            />
          </svg>
          <span
            className="text-sm font-bold whitespace-nowrap overflow-hidden"
            style={{
              maxWidth: waHovered ? '140px' : '0px',
              opacity: waHovered ? 1 : 0,
              transition: 'max-width 0.3s ease, opacity 0.2s ease',
            }}
          >
            Chat dengan Kami
          </span>
        </a>
      )}

      {/* Back to Top */}
      {!isAdmin && showBackToTop && (
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