'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { authClient } from '@/core/auth/client';

const IDLE_MS = 15 * 60 * 1000;
const WARN_MS = 2 * 60 * 1000;
// mousemove/scroll bisa fire puluhan kali per detik; reset timer dibatasi
// supaya tidak clearTimeout+setTimeout berulang-ulang setiap frame.
const THROTTLE_MS = 1000;
const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
// Dipakai untuk sinkronisasi logout antar tab lewat BroadcastChannel.
const IDLE_CHANNEL_NAME = 'kawaltransaksi-idle-logout';

export default function ProtectedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetAt = useRef<number>(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
  }, []);

  const doLogout = useCallback(async (broadcast: boolean) => {
    clearTimers();
    if (broadcast) {
      // Beri tahu tab lain agar mereka logout juga, bukan menunggu idle
      // timer masing-masing tab habis sendiri-sendiri.
      channelRef.current?.postMessage('logout');
    }
    await authClient.logout();
    router.push('/login?reason=idle');
    router.refresh();
  }, [clearTimers, router]);

  const startTimers = useCallback(() => {
    clearTimers();
    warnTimer.current = setTimeout(() => setShowWarning(true), IDLE_MS - WARN_MS);
    idleTimer.current = setTimeout(() => doLogout(true), IDLE_MS);
  }, [clearTimers, doLogout]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    if (now - lastResetAt.current < THROTTLE_MS) return;
    lastResetAt.current = now;
    setShowWarning(false);
    startTimers();
  }, [startTimers]);

  // Tombol "Tetap masuk" di modal warning: selain reset timer lokal, coba
  // refresh access token juga supaya sesi (JWT 15 menit) ikut diperpanjang,
  // tidak hanya idle timer di sisi client yang diperpanjang.
  const handleStayLoggedIn = useCallback(async () => {
    setShowWarning(false);
    startTimers();
    await authClient.refresh();
  }, [startTimers]);

  useEffect(() => {
    const channel = new BroadcastChannel(IDLE_CHANNEL_NAME);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      if (event.data === 'logout') {
        clearTimers();
        router.push('/login?reason=idle');
        router.refresh();
      }
    };
    return () => channel.close();
  }, [clearTimers, router]);

  useEffect(() => {
    startTimers();
    IDLE_EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      IDLE_EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimers();
    };
  }, [startTimers, resetTimer, clearTimers]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />

      {showWarning && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 whitespace-nowrap">
          <span>Sesi akan berakhir dalam 2 menit.</span>
          <button onClick={handleStayLoggedIn} className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors shrink-0">
            Tetap masuk
          </button>
        </div>
      )}

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-700 transition-all active:scale-95"
          aria-label="Kembali ke atas"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}