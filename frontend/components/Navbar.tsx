'use client';

import React, { useState, useEffect, useRef, useMemo, startTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/core/supabase/browser';
import { LogOut, Menu, X, User, FileText, ChevronDown, Home, Phone, Building2, Flag, Database, Newspaper } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const publicMenuItems = [
  { href: '/',             label: 'Beranda',      icon: Home      },
  { href: '/cek-nomor',    label: 'Cek Nomor',    icon: Phone     },
  { href: '/cek-rekening', label: 'Cek Rekening', icon: Building2 },
  { href: '/report',       label: 'Laporkan',     icon: Flag      },
  { href: '/artikel',      label: 'Artikel',      icon: Newspaper },
];

const privateMenuItems = [
  { href: '/',                label: 'Beranda',        icon: Home      },
  { href: '/cek-nomor',       label: 'Cek Nomor',      icon: Phone     },
  { href: '/cek-rekening',    label: 'Cek Rekening',   icon: Building2 },
  { href: '/laporan-publik',  label: 'Laporan Publik', icon: Database  },
  { href: '/report',          label: 'Laporkan',       icon: Flag      },
  { href: '/artikel',         label: 'Artikel',        icon: Newspaper },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Navbar() {
  const [user, setUser]                     = useState<SupabaseUser | null>(null);
  const [isMenuOpen, setIsMenuOpen]         = useState(false);
  const [isProfileOpen, setIsProfileOpen]   = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading]           = useState(true);
  const router      = useRouter();
  const pathname    = usePathname();
  const supabase    = useMemo(() => createClient(), []);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const handler = (e: Event) => { e.preventDefault(); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    startTransition(() => {
      setIsMenuOpen(false);
      setIsProfileOpen(false);
      setIsDropdownOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMenuOpen || isProfileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen, isProfileOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsDropdownOpen(false);
    router.push('/');
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;
  const menuItems = user ? privateMenuItems : publicMenuItems;

  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.preferred_username ||
    user?.email?.split('@')[0] ||
    'Pengguna';

  const firstName = fullName.split(' ')[0];

  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <>
      <nav className="bg-white sticky top-0 z-50 border-b border-slate-200 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16">

            {/* MOBILE: Hamburger kiri */}
            <button
              onClick={() => { setIsMenuOpen(true); setIsProfileOpen(false); }}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors mr-2"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/logo.png" alt="KawalTransaksi" width={36} height={36} className="rounded-lg" priority />
              <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">
                Kawal<span className="text-emerald-700">Transaksi</span>
              </span>
            </Link>

            {/* MENU NAVIGASI — desktop */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-0 h-16">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 h-full text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
                    isActive(item.href)
                      ? 'text-emerald-700 border-emerald-700'
                      : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* AUTH — kanan (desktop) */}
            <div className="hidden lg:flex items-center gap-2 shrink-0 ml-auto">
              {isLoading ? (
                <div className="w-40 h-9 bg-slate-100 animate-pulse rounded-lg" />
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-black">{initials}</span>
                    </div>
                    <span className="text-base text-slate-700">
                      Hi, <span className="font-bold text-slate-900">{firstName}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{fullName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>
                      <Link href="/dashboard/laporan" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <FileText className="w-4 h-4 text-slate-400" />
                        Laporan Saya
                      </Link>
                      <Link href="/dashboard/profil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <User className="w-4 h-4 text-slate-400" />
                        Profil Saya
                      </Link>
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-5 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-800 transition-colors"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>

            {/* MOBILE: Avatar / Masuk kanan */}
            <div className="lg:hidden ml-auto flex items-center gap-2">
              {isLoading ? (
                <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse" />
              ) : user ? (
                <button
                  onClick={() => { setIsProfileOpen(true); setIsMenuOpen(false); }}
                  className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center"
                >
                  <span className="text-white text-xs font-black">{initials}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link href="/login" className="text-xs font-bold text-slate-700 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    Masuk
                  </Link>
                  <Link href="/register" className="text-xs font-bold text-white px-3 py-2 bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors">
                    Daftar
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* MOBILE: LEFT DRAWER */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.png" alt="KawalTransaksi" width={32} height={32} className="rounded-lg" />
                <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">
                  Kawal<span className="text-emerald-700">Transaksi</span>
                </span>
              </Link>
              <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {menuItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive(href)
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-bold">{label}</span>
                </Link>
              ))}
            </div>

            {/* Bottom drawer — kalau belum login */}
            {!user && (
              <div className="px-3 pb-8 pt-1 border-t border-slate-100 space-y-2">
                <Link
                  href="/register"
                  className="w-full flex items-center justify-center px-4 py-3 bg-emerald-700 text-white text-sm font-bold rounded-xl hover:bg-emerald-800 transition-colors"
                >
                  Daftar Sekarang
                </Link>
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center px-4 py-3 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Masuk
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE: RIGHT DRAWER — Profile */}
      {isProfileOpen && user && (
        <div className="lg:hidden fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="text-base font-black text-slate-900">Akun</span>
              <button onClick={() => setIsProfileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-black">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{fullName}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex-1 px-3 py-4 space-y-1">
              <Link href="/dashboard/laporan" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-sm font-bold text-slate-800">Laporan Saya</span>
              </Link>
              <Link href="/dashboard/profil" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-sm font-bold text-slate-800">Profil Saya</span>
              </Link>
            </div>

            <div className="px-3 pb-8 pt-1 border-t border-slate-100">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors"
              >
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-sm font-bold text-red-600">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}