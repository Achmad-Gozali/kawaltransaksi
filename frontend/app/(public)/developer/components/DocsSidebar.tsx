'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose } from 'lucide-react';

export const DOC_NAV = [
  { slug: 'overview',        label: 'Overview' },
  { slug: 'quick-start',     label: 'Quick Start' },
  { slug: 'autentikasi',     label: 'Autentikasi' },
  { slug: 'environment',     label: 'Environment' },
  { slug: 'endpoint-check',  label: 'Endpoint /check' },
  { slug: 'format-response', label: 'Format Response' },
  { slug: 'idempotency',     label: 'Idempotency' },
  { slug: 'rate-limiting',   label: 'Rate Limiting' },
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