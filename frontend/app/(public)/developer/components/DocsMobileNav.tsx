'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { DOC_NAV } from './DocsSidebar';

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
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto p-4 pb-6">
        <div className="flex items-center justify-between mb-3">
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