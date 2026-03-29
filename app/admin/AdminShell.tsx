// ============================================
// 📁 LOKASI: app/admin/AdminShell.tsx
// ✅ FIX: Logo pakai logo.png, sidebar nav uses state not URL
// ============================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import {
  LayoutDashboard, FileText, BarChart2, Users,
  Home, LogOut, ChevronLeft, ChevronRight,
  Search, X, Menu,
} from 'lucide-react';

interface AdminShellProps {
  email: string;
  children: React.ReactNode;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { id: 'laporan', label: 'Laporan', icon: FileText, href: '/admin?tab=laporan' },
  { id: 'statistik', label: 'Statistik', icon: BarChart2, href: '/admin?tab=statistik' },
  { id: 'pengguna', label: 'Pengguna', icon: Users, href: '/admin?tab=pengguna' },
];

export default function AdminShell({ email, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      router.push(`/admin?tab=laporan&search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    router.push(href);
  };

  const initial = (email || 'A').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50/80 flex">
      {mobileOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-zinc-200/80 z-50 flex flex-col transition-all duration-200 ease-out
        ${collapsed ? 'w-[60px]' : 'w-[220px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 h-14 border-b border-zinc-100 shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
          <Image src="/logo.png" alt="KawalTransaksi" width={28} height={28} className="rounded-lg shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-[13px] font-semibold text-zinc-900">Kawal</span>
              <span className="text-[13px] font-semibold text-red-500">Transaksi</span>
              <p className="text-[10px] text-zinc-400 -mt-0.5">Admin panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.href)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors text-left
                  ${collapsed ? 'justify-center px-0 mx-1' : ''}
                  text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-zinc-100">
            <Link href="/" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 ${collapsed ? 'justify-center px-0 mx-1' : ''}`}>
              <Home className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Kembali ke site</span>}
            </Link>
          </div>
        </nav>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-zinc-100 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* User + Logout */}
        <div className="border-t border-zinc-100 p-3 shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-500">{initial}</div>
              <button onClick={handleLogout} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50" title="Logout">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-500 shrink-0">{initial}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-zinc-700 truncate">{email}</p>
                <p className="text-[10px] text-zinc-400">Admin</p>
              </div>
              <button onClick={handleLogout} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 shrink-0" title="Logout">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${collapsed ? 'lg:ml-[60px]' : 'lg:ml-[220px]'}`}>
        <header className="h-14 bg-white border-b border-zinc-200/80 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100">
            <Menu className="w-4 h-4" />
          </button>
          <form onSubmit={handleGlobalSearch} className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Cari laporan, pengguna..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400 focus:bg-white" />
              {globalSearch && (
                <button type="button" onClick={() => setGlobalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
          <span className="hidden sm:block text-xs text-zinc-400">{email}</span>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}