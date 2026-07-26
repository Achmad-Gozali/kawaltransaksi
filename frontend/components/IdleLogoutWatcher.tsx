'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/core/auth/client';

const IDLE_MS = 15 * 60 * 1000;
const WARN_MS = 2 * 60 * 1000;
const THROTTLE_MS = 1000;
const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
const IDLE_CHANNEL_NAME = 'kawaltransaksi-idle-logout';

// Halaman yang tidak butuh cek sesi sama sekali (murni publik, tidak ada
// kemungkinan user login melihat halaman ini terkait auth-nya sendiri).
// Ini hanya optimisasi kecil -- pengecekan authClient.me() tetap aman
// dipanggil di halaman manapun, tapi di-skip di sini agar tidak ada
// panggilan sia-sia di halaman yang jelas tidak butuh (login, register, dst).
const SKIP_PATHS = ['/login', '/register', '/lupa-kata-sandi', '/reset-kata-sandi', '/verifikasi-email', '/auth/callback'];

export default function IdleLogoutWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [showWarning, setShowWarning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetAt = useRef<number>(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const shouldSkip = SKIP_PATHS.some(p => pathname?.startsWith(p));

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
  }, []);

  const doLogout = useCallback(async (broadcast: boolean) => {
    clearTimers();
    if (broadcast) {
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

  const handleStayLoggedIn = useCallback(async () => {
    setShowWarning(false);
    startTimers();
    await authClient.refresh();
  }, [startTimers]);

  // Cek status login sekali saat mount, dan setiap kali pathname berubah
  // (misal user baru saja login dari halaman /login lalu redirect ke /).
  useEffect(() => {
    if (shouldSkip) {
      setIsLoggedIn(false);
      return;
    }
    let cancelled = false;
    authClient.me().then(user => {
      if (!cancelled) setIsLoggedIn(!!user);
    });
    return () => { cancelled = true; };
  }, [pathname, shouldSkip]);

  // Cross-tab sync: kalau tab lain logout (baik karena idle atau manual),
  // tab ini ikut redirect juga.
  useEffect(() => {
    if (!isLoggedIn) return;
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
  }, [isLoggedIn, clearTimers, router]);

  // Timer utama -- hanya aktif kalau user memang sedang login.
  useEffect(() => {
    if (!isLoggedIn) {
      clearTimers();
      setShowWarning(false);
      return;
    }
    startTimers();
    IDLE_EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      IDLE_EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimers();
    };
  }, [isLoggedIn, startTimers, resetTimer, clearTimers]);

  if (!isLoggedIn || !showWarning) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 whitespace-nowrap">
      <span>Sesi akan berakhir dalam 2 menit.</span>
      <button onClick={handleStayLoggedIn} className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors shrink-0">
        Tetap masuk
      </button>
    </div>
  );
}