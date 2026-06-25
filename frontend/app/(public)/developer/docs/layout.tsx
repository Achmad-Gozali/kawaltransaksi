'use client';

import { useState, useEffect } from 'react';
import { List, PanelLeftOpen } from 'lucide-react';
import { DocsSidebar, DocsMobileNav } from '@/app/(public)/developer/components/DocsSidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

  return (
    <section className="bg-slate-50 min-h-screen pt-10 pb-16 sm:pt-14 sm:pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              Dokumentasi API
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Panduan lengkap untuk integrasi KawalTransaksi API ke aplikasi Anda.
            </p>
          </div>
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
          >
            <List className="w-3.5 h-3.5" /> Daftar Isi
          </button>
        </div>

        {/* Grid */}
        <div className={`grid grid-cols-1 gap-8 ${sidebarOpen ? 'lg:grid-cols-[240px_1fr]' : ''}`}>
          {sidebarOpen && (
            <DocsSidebar onCollapse={() => setSidebarOpen(false)} />
          )}

          <div className="min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-4"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" /> Tampilkan navigasi
              </button>
            )}
            {children}
          </div>
        </div>
      </div>

      <DocsMobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </section>
  );
}