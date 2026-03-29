// ============================================
// 📁 LOKASI: components/Navbar.tsx
// ✅ FIX: Logo pakai logo.png, bukan icon ShieldAlert
// ============================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import {
  LogOut, User as UserIcon, PlusCircle,
  Menu, X, BookOpen, LayoutDashboard, Phone, Building2,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="border-b border-zinc-200 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" onClick={closeMenu}>
            <Image src="/logo.png" alt="KawalTransaksi" width={36} height={36} className="rounded-xl group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-black tracking-tighter text-zinc-900">
              KAWAL<span className="text-red-600">TRANSAKSI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/cek-nomor" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 transition-colors">
              <Phone className="w-4 h-4" />Cek Nomor
            </Link>
            <Link href="/cek-rekening" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 transition-colors">
              <Building2 className="w-4 h-4" />Cek Rekening
            </Link>
            <Link href="/report" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 transition-colors">
              <PlusCircle className="w-4 h-4" />Laporkan
            </Link>
            <Link href="/edukasi" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 transition-colors">
              <BookOpen className="w-4 h-4" />Edukasi
            </Link>
            <div className="h-4 w-px bg-zinc-200" />
            {isLoading ? (
              <div className="w-32 h-8 bg-zinc-100 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />Dashboard
                </Link>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-full">
                  <div className="w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>
                <button onClick={handleSignOut} className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1.5">
                  <LogOut className="w-4 h-4" />Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-bold text-zinc-600 hover:text-zinc-900">Masuk</Link>
                <Link href="/register" className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 transition-all active:scale-95">Daftar</Link>
              </div>
            )}
          </div>

          {/* Mobile */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-zinc-100 px-4 py-5 space-y-1">
          <Link href="/cek-nomor" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50"><Phone className="w-4 h-4 text-zinc-400" />Cek Nomor</Link>
          <Link href="/cek-rekening" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50"><Building2 className="w-4 h-4 text-zinc-400" />Cek Rekening</Link>
          <Link href="/report" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50"><PlusCircle className="w-4 h-4 text-zinc-400" />Laporkan</Link>
          <Link href="/edukasi" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50"><BookOpen className="w-4 h-4 text-zinc-400" />Edukasi</Link>
          <div className="pt-3 mt-3 border-t border-zinc-100">
            {isLoading ? <div className="h-10 bg-zinc-100 rounded-xl animate-pulse" /> : user ? (
              <div className="space-y-1">
                <Link href="/dashboard" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50"><LayoutDashboard className="w-4 h-4 text-zinc-400" />Dashboard</Link>
                <div className="px-3 py-2"><p className="text-xs text-zinc-400 truncate">{user.email}</p></div>
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" />Keluar</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link href="/login" onClick={closeMenu} className="flex items-center justify-center py-2.5 rounded-xl text-sm font-bold text-zinc-700 border border-zinc-200 hover:bg-zinc-50">Masuk</Link>
                <Link href="/register" onClick={closeMenu} className="flex items-center justify-center py-2.5 rounded-xl text-sm font-bold text-white bg-zinc-900 hover:bg-black">Daftar</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}