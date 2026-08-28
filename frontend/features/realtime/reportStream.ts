"use client";

// Satu koneksi SSE per tab, dibagi semua komponen realtime (LiveStats +
// RecentReports). EventSource menangani reconnect otomatis; saat reconnect
// kita lanjut dari angka terkini, tanpa replay.

export interface LiveReport {
  id: string;
  targetValue: string;
  targetType: string;
  targetName: string | null;
  bankName: string | null;
  walletName: string | null;
  amount: number | null;
  createdAt: string;
  status: string;
}

export type ReportStreamEvent =
  | { type: "submitted"; targetType: string }
  | { type: "verified"; report: LiveReport };

type Listener = (event: ReportStreamEvent) => void;

const STREAM_URL = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/reports/stream`;

const listeners = new Set<Listener>();
let source: EventSource | null = null;
let refCount = 0;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function handleMessage(ev: MessageEvent<string>) {
  let parsed: ReportStreamEvent;
  try {
    parsed = JSON.parse(ev.data);
  } catch {
    return;
  }
  if (!parsed || (parsed.type !== "submitted" && parsed.type !== "verified")) return;
  listeners.forEach((cb) => {
    try {
      cb(parsed);
    } catch {
      /* isolasi error tiap listener */
    }
  });
}

function open() {
  if (source || typeof window === "undefined") return;
  source = new EventSource(STREAM_URL);
  source.onmessage = handleMessage;
  // onerror: EventSource otomatis reconnect (server kirim `retry: 3000`).
  // Tidak perlu aksi apa pun di sini.
}

function close() {
  source?.close();
  source = null;
}

export function subscribeReportStream(listener: Listener): () => void {
  listeners.add(listener);
  refCount += 1;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  open();

  return () => {
    listeners.delete(listener);
    refCount -= 1;
    if (refCount <= 0) {
      refCount = 0;
      // Tunda close sebentar supaya navigasi antar halaman (unmount lalu
      // remount) tidak memutus-sambung koneksi berkali-kali.
      closeTimer = setTimeout(() => {
        if (refCount === 0) close();
      }, 2000);
    }
  };
}
