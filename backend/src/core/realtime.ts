import type { ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import { pg } from "./db.js";
import type { Report } from "./schema.js";

// ── Realtime lewat Postgres LISTEN/NOTIFY + SSE ───────────────────────────
// Alur: penulisan laporan (POST /api/reports, PATCH /api/admin/reports/:id/status)
// memanggil pg.notify() SETELAH commit. Proses backend ini LISTEN dua channel
// dan mem-broadcast payload apa adanya ke semua koneksi SSE aktif
// (GET /api/reports/stream). Frontend memfilter per-kategori di sisi client.
//
// Kenapa NOTIFY, bukan event emitter in-process: tetap benar kalau backend
// di-scale jadi >1 instance, dan menangkap perubahan status dari sumber lain
// (mis. job/migrasi) tanpa kode tambahan.

export type SubmittedEvent = {
  type: "submitted";
  targetType: string;
};

export type LiveReport = {
  id: string;
  targetValue: string;
  targetType: string;
  targetName: string | null;
  bankName: string | null;
  walletName: string | null;
  amount: number | null;
  createdAt: string;
  status: string;
};

export type VerifiedEvent = {
  type: "verified";
  report: LiveReport;
};

const CH_SUBMITTED = "report_submitted";
const CH_VERIFIED = "report_verified";
const KEEPALIVE_MS = 15_000;

// Batas atas koneksi SSE bersamaan yang dilayani satu proses backend. Tiap
// koneksi = 1 socket ditahan + 1 entry di streamClients + ikut loop keepalive
// tiap 15 dtk + ikut loop broadcast tiap ada laporan. Tanpa batas, satu klien
// (atau penyerang) yang membuka ribuan EventSource bisa menghabiskan file
// descriptor / event-loop dan menjatuhkan seluruh API. 800 jauh di atas
// kebutuhan normal tapi tetap aman untuk VPS kecil. Pembatasan per-IP ada di
// nginx (limit_conn); ini jaring pengaman global di level aplikasi.
const MAX_STREAM_CLIENTS = 800;

/** Ambil hanya field yang aman & dibutuhkan frontend dari row laporan penuh. */
export function toLiveReport(report: Report): LiveReport {
  return {
    id: report.id,
    targetValue: report.targetValue,
    targetType: report.targetType,
    targetName: report.targetName ?? null,
    bankName: report.bankName ?? null,
    walletName: report.walletName ?? null,
    amount: report.amount ?? null,
    createdAt:
      report.createdAt instanceof Date
        ? report.createdAt.toISOString()
        : String(report.createdAt),
    status: report.status,
  };
}

// ── Registry koneksi SSE ─────────────────────────────────────────────────
const streamClients = new Set<ServerResponse>();

/** true kalau jumlah koneksi SSE aktif sudah mentok di MAX_STREAM_CLIENTS. */
export function isStreamAtCapacity(): boolean {
  return streamClients.size >= MAX_STREAM_CLIENTS;
}

export function registerStreamClient(res: ServerResponse): void {
  streamClients.add(res);
}

export function unregisterStreamClient(res: ServerResponse): void {
  streamClients.delete(res);
}

function broadcast(payload: SubmittedEvent | VerifiedEvent): void {
  const frame = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of streamClients) {
    try {
      res.write(frame);
    } catch {
      streamClients.delete(res);
    }
  }
}

// ── Emit (dipanggil route handler setelah commit) ────────────────────────
export async function notifyReportSubmitted(targetType: string): Promise<void> {
  const payload: SubmittedEvent = { type: "submitted", targetType };
  await pg.notify(CH_SUBMITTED, JSON.stringify(payload));
}

export async function notifyReportVerified(report: LiveReport): Promise<void> {
  const payload: VerifiedEvent = { type: "verified", report };
  await pg.notify(CH_VERIFIED, JSON.stringify(payload));
}

// ── Lifecycle ────────────────────────────────────────────────────────────
let keepAlive: NodeJS.Timeout | null = null;
const listenHandles: Array<{ unlisten: () => Promise<void> }> = [];
let started = false;

export async function initRealtime(app: FastifyInstance): Promise<void> {
  if (started) return;
  started = true;

  const onNotify = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.type === "submitted" || parsed?.type === "verified") {
        broadcast(parsed);
      }
    } catch (err) {
      app.log.error({ err, raw }, "realtime: payload NOTIFY tidak valid");
    }
  };

  try {
    listenHandles.push(await pg.listen(CH_SUBMITTED, onNotify));
    listenHandles.push(await pg.listen(CH_VERIFIED, onNotify));
    app.log.info("realtime: LISTEN report_submitted & report_verified aktif");
  } catch (err) {
    // Realtime adalah enhancement -- kegagalan LISTEN tidak boleh menjatuhkan
    // server. postgres.js akan mencoba re-listen otomatis saat koneksi pulih.
    app.log.error({ err }, "realtime: gagal memulai LISTEN");
  }

  keepAlive = setInterval(() => {
    for (const res of streamClients) {
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
      } catch {
        streamClients.delete(res);
      }
    }
  }, KEEPALIVE_MS);
  keepAlive.unref?.();
}

export async function closeRealtime(): Promise<void> {
  if (keepAlive) {
    clearInterval(keepAlive);
    keepAlive = null;
  }
  for (const res of streamClients) {
    try {
      res.end();
    } catch {
      /* noop */
    }
  }
  streamClients.clear();
  await Promise.allSettled(listenHandles.map((h) => h.unlisten()));
  listenHandles.length = 0;
  started = false;
}
