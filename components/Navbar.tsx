'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import {
  ShieldAlert, LogOut, User as UserIcon, PlusCircle,
  Menu, X, BookOpen, LayoutDashboard, Phone, Building2,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ✅ Bungkus createClient() dalam useRef — tidak buat instance baru tiap render
  // createClient() tanpa ref = instance baru setiap Navbar re-render
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    // ✅ Ambil user sekali saat mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // ✅ Listen perubahan auth state (login/logout dari tab lain, session expired)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // ✅ Set loading false juga di sini untuk kasus auth change sebelum getUser selesai
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  // ✅ supabase stabil (ref), jadi deps array kosong aman
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  // ✅ Tutup menu mobile saat navigasi — satu handler reusable
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="border-b border-zinc-200 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-zinc-900 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-zinc-200">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-zinc-900">
              CEKNO<span className="text-red-600">SCAM</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
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
              // ✅ Skeleton dengan lebar tetap — cegah layout shift
              <div className="w-32 h-8 bg-zinc-100 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />Dashboard
                </Link>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-full">
                  <div className="w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="max-w-[140px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-bold text-zinc-600 hover:text-zinc-900">Masuk</Link>
                <Link href="/register" className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 transition-all active:scale-95">
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-zinc-600">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 px-4 py-6 space-y-4">
          <Link href="/cek-nomor" className="block text-lg font-bold text-zinc-900" onClick={closeMenu}>Cek Nomor</Link>
          <Link href="/cek-rekening" className="block text-lg font-bold text-zinc-900" onClick={closeMenu}>Cek Rekening</Link>
          <Link href="/report" className="block text-lg font-bold text-zinc-900" onClick={closeMenu}>Laporkan</Link>
          <Link href="/edukasi" className="block text-lg font-bold text-zinc-900" onClick={closeMenu}>Edukasi</Link>

          <div className="pt-4 border-t border-zinc-100">
            {user ? (
              <div className="space-y-4">
                <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold text-zinc-900" onClick={closeMenu}>
                  <LayoutDashboard className="w-5 h-5" />Dashboard
                </Link>
                <p className="text-sm text-zinc-400 truncate">{user.email}</p>
                <button onClick={handleSignOut} className="text-red-600 font-bold flex items-center gap-2">
                  <LogOut className="w-4 h-4" />Keluar
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Link href="/login" className="font-bold text-zinc-600" onClick={closeMenu}>Masuk</Link>
                <Link href="/register" className="bg-zinc-900 text-white text-center py-3 rounded-xl font-bold" onClick={closeMenu}>
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}