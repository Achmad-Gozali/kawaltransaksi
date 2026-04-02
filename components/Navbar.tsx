'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const menuItems = [
  { href: '/',              label: 'Beranda' },
  { href: '/cek-nomor',     label: 'Cek Nomor' },
  { href: '/cek-rekening',  label: 'Cek Rekening' },
  { href: '/report',        label: 'Laporkan' },
  { href: '/edukasi',       label: 'Edukasi' },
];

export default function Navbar() {
  const [user, setUser]             = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-slate-200 font-sans">

      {/* ── MAIN BAR ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-18">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo.png"
              alt="KawalTransaksi"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <span className="text-sm sm:text-base font-black tracking-tighter text-slate-900 uppercase">
              Kawal<span className="text-emerald-600">Transaksi</span>
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center gap-0.5">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* DESKTOP AUTH */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {isLoading ? (
              <div className="w-24 h-9 bg-slate-100 animate-pulse rounded-lg" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg uppercase tracking-widest transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg uppercase tracking-widest transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Masuk Portal
              </Link>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2.5 text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white ${
          isMenuOpen
            ? 'max-h-[600px] border-b border-slate-200 opacity-100'
            : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 py-4 space-y-1">

          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 text-sm font-bold uppercase tracking-wide rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="pt-3 mt-3 border-t border-slate-100">
            {isLoading ? (
              <div className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="space-y-1">
                <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg mb-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Akun</p>
                  <p className="text-xs font-black text-slate-900 truncate mt-0.5">{user.email}</p>
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar Akun
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/register"
                  className="py-3 text-center text-xs font-bold uppercase tracking-widest border border-slate-200 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Daftar
                </Link>
                <Link
                  href="/login"
                  className="py-3 text-center text-xs font-bold uppercase tracking-widest bg-slate-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                  Masuk
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

    </nav>
  );
}