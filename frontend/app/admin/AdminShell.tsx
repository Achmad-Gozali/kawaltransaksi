'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import {
  LayoutDashboard, FileText, BarChart2, Users,
  Home, LogOut, ChevronLeft, ChevronRight,
  Search, Menu, X, Shield,
} from 'lucide-react';

interface AdminShellProps {
  email: string;
  children: React.ReactNode;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin?tab=dashboard' },
  { id: 'laporan',   label: 'Laporan',   icon: FileText,         href: '/admin?tab=laporan' },
  { id: 'statistik', label: 'Statistik', icon: BarChart2,        href: '/admin?tab=statistik' },
  { id: 'pengguna',  label: 'Pengguna',  icon: Users,            href: '/admin?tab=pengguna' },
];

export default function AdminShell({ email, children }: AdminShellProps) {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  const activeTab    = searchParams.get('tab') || 'dashboard';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      router.push(`/admin?tab=laporan&search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
      setMobileOpen(false);
    }
  };

  const initial = (email || 'A').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50 flex flex-col
        transition-all duration-200 ease-out
        ${collapsed ? 'w-[64px]' : 'w-[240px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-100 shrink-0 px-4 ${collapsed ? 'justify-center px-0' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900 leading-tight">
                Kawal<span className="text-emerald-600">Transaksi</span>
              </p>
              <p className="text-[10px] text-slate-400">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon     = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                  ${collapsed ? 'justify-center px-0 mx-1' : ''}
                  ${isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-slate-100">
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all ${collapsed ? 'justify-center px-0 mx-1' : ''}`}
            >
              <Home className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Kembali ke Site</span>}
            </Link>
          </div>
        </nav>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* User info */}
        <div className={`border-t border-slate-100 p-3 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? '' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
              {initial}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-slate-700 truncate">{email}</p>
                <button
                  onClick={handleLogout}
                  className="text-[11px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${collapsed ? 'lg:ml-[64px]' : 'lg:ml-[240px]'}`}>

        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <form onSubmit={handleGlobalSearch} className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari laporan, pengguna..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
              {initial}
            </div>
            <span className="text-xs text-slate-500 max-w-[160px] truncate">{email}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}