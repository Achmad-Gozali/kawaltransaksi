'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, X } from 'lucide-react';

export const DOC_NAV = [
  { slug: 'overview',        label: 'Overview' },
  { slug: 'quick-start',     label: 'Quick Start' },
  { slug: 'autentikasi',     label: 'Autentikasi' },
  { slug: 'environment',     label: 'Environment' },
  { slug: 'endpoint-check',  label: 'Endpoint /check' },
  { slug: 'format-response', label: 'Format Response' },
  { slug: 'playground',      label: 'Playground' },
  { slug: 'idempotency',     label: 'Idempotency' },
  { slug: 'rate-limiting',   label: 'Rate Limiting' },
  { slug: 'error-handling',  label: 'Error Handling' },
  { slug: 'limits',          label: 'Limits & Quota' },
  { slug: 'keamanan',        label: 'Keamanan API Key' },
  { slug: 'best-practices',  label: 'Best Practices' },
  { slug: 'changelog',       label: 'Changelog' },
];

export function DocsSidebar({ onCollapse }: { onCollapse?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
        <div className="flex items-center justify-between px-1 mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dokumentasi</p>
          {onCollapse && (
            <button
              onClick={onCollapse}
              title="Tutup navigasi"
              className="text-slate-300 hover:text-slate-500 transition-colors"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <nav className="space-y-0.5">
          {DOC_NAV.map((item) => {
            const isActive = pathname === `/developer/docs/${item.slug}`;
            return (
              <Link
                key={item.slug}
                href={`/developer/docs/${item.slug}`}
                aria-current={isActive ? 'page' : undefined}
                className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-500 hover:bg-white hover:text-slate-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function DocsMobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[75vh] overflow-y-auto p-4 pb-6">
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-white pb-2 -mt-1 pt-1">
          <p className="text-sm font-bold text-slate-900">Dokumentasi</p>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
        <nav className="space-y-1">
          {DOC_NAV.map((item) => {
            const isActive = pathname === `/developer/docs/${item.slug}`;
            return (
              <Link
                key={item.slug}
                href={`/developer/docs/${item.slug}`}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={`block w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}