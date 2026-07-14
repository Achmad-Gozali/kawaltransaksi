'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShieldCheck, Clock, CheckCircle2, AlertCircle, ShieldAlert, X, ChevronLeft, ChevronRight, Info, FileX2 } from 'lucide-react';

// Sebagian data lama (path relatif "/uploads/...") berdampingan dengan data baru
// (URL R2 lengkap "https://img.kawaltransaksi.com/...") pasca migrasi storage.
// Fungsi ini menangani keduanya supaya gambar tetap tampil benar untuk data manapun.
function resolveImageUrl(p: string | null | undefined): string | null {
  if (!p) return null;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  return `${process.env.NEXT_PUBLIC_API_URL}${p}`;
}

function cleanChronology(text: string) {
  return text.replace(/^["'""]+|["'""]+$/g, '').trim();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function resolveEvidenceUrl(url: string): string | null {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return resolveImageUrl(url);
}

interface ReportItem {
  id: string;
  status: string;
  category?: string | null;
  chronology?: string | null;
  description?: string | null;
  createdAt: string;
  platform?: string | null;
  amount?: number | string | null;
  incidentDate?: string | null;
  hasOtherVictims?: string | null;
  evidenceUrls?: string[] | null;
  socialMediaAccounts?: string[] | null;
}

interface Props {
  reports: ReportItem[];
  hasWithdrawn?: boolean;
  hasLinkedReports?: boolean;
  linkedHasVerified?: boolean;
}

function getAllEvidenceUrls(reports: ReportItem[]) {
  const urlSet = new Set<string>();
  reports.forEach(r => {
    (r.evidenceUrls ?? []).forEach(url => { if (url) urlSet.add(url); });
  });
  return Array.from(urlSet);
}

function EvidenceThumb({ url, alt, className }: { url: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-slate-100 ${className ?? ''}`}>
        <FileX2 className="w-4 h-4 text-slate-300" />
        <span className="text-[8px] text-slate-400 leading-none">Tak tersedia</span>
      </div>
    );
  }
  return (
    <Image
      src={resolveEvidenceUrl(url) ?? ''}
      alt={alt}
      fill
      className={className}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

function Lightbox({ urls, initialIndex, onClose }: { urls: string[]; initialIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrent(p => (p > 0 ? p - 1 : urls.length - 1));
      if (e.key === 'ArrowRight') setCurrent(p => (p < urls.length - 1 ? p + 1 : 0));
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [onClose, urls.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10">
        <X className="w-5 h-5 text-white" />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
        {current + 1} / {urls.length}
      </div>
      {urls.length > 1 && (
        <button onClick={e => { e.stopPropagation(); setCurrent(p => (p > 0 ? p - 1 : urls.length - 1)); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}
      <div className="relative max-w-3xl max-h-[80vh] w-full h-full" onClick={e => e.stopPropagation()}>
        <EvidenceThumb url={urls[current]} alt={`Bukti ${current + 1}`} className="object-contain rounded-lg" />
      </div>
      {urls.length > 1 && (
        <button onClick={e => { e.stopPropagation(); setCurrent(p => (p < urls.length - 1 ? p + 1 : 0)); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10">
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}
      {urls.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4">
          {urls.map((url, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i); }}
              className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-white scale-110' : 'border-white/30 opacity-60'}`}>
              <EvidenceThumb url={url} alt="" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceGallery({ urls }: { urls: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const PREVIEW_COUNT = 4;
  const displayUrls = showAll ? urls : urls.slice(0, PREVIEW_COUNT);
  const remaining = urls.length - PREVIEW_COUNT;

  return (
    <div>
      {lightboxIndex !== null && <Lightbox urls={urls} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {displayUrls.map((url, i) => (
          <button key={i} onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-slate-400 transition-all cursor-pointer">
            <EvidenceThumb url={url} alt={`Bukti ${i + 1}`} className="object-cover group-hover:scale-105 transition-transform duration-200" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">{i + 1}</div>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <p className="text-[10px] text-slate-400">Ketuk foto untuk perbesar - {urls.length} foto</p>
        {!showAll && remaining > 0 && (
          <button onClick={() => setShowAll(true)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors shrink-0 ml-3">
            Lihat semua {urls.length} foto
          </button>
        )}
        {showAll && urls.length > PREVIEW_COUNT && (
          <button onClick={() => setShowAll(false)} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-3">
            Sembunyikan
          </button>
        )}
      </div>
    </div>
  );
}

export default function ReportList({ reports, hasWithdrawn = false, hasLinkedReports = false, linkedHasVerified = false }: Props) {
  const allEvidenceUrls = getAllEvidenceUrls(reports);
  const hasVerified = reports.some(r => r.status === 'verified');
  const allPending  = reports.length > 0 && !hasVerified;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 px-0.5 flex items-center justify-between flex-wrap gap-1">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-medium">Riwayat laporan</p>
          {reports.length > 0 && <p className="text-[10px] text-slate-400">{reports.length} laporan - {reports.length} korban berbeda</p>}
        </div>

        {allPending && (
          <div className="mb-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Laporan ini bersumber dari komunitas dan <span className="font-semibold">belum diverifikasi</span> oleh moderator. Gunakan sebagai kewaspadaan awal, bukan sebagai bukti final.
            </p>
          </div>
        )}

        {reports.length > 0 ? (
          <div className="space-y-2.5">
            {reports.map((report, index) => {
              const isVerified = report.status === 'verified';
              const text = report.chronology || report.description || '';
              return (
                <div key={report.id} className={`bg-white rounded-xl border overflow-hidden ${isVerified ? 'border-emerald-200' : 'border-slate-200'}`}>
                  <div className={`flex items-center justify-between px-4 py-2.5 border-b flex-wrap gap-1 ${isVerified ? 'bg-emerald-50/80 border-emerald-100' : 'bg-slate-50/80 border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      {isVerified ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${isVerified ? 'text-emerald-700' : 'text-amber-600'}`}>
                        Laporan #{index + 1} - {isVerified ? 'Terverifikasi' : 'Menunggu'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {formatDate(report.incidentDate || report.createdAt)}
                    </span>
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm text-slate-600 leading-relaxed break-words" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
                      &ldquo;{cleanChronology(text)}&rdquo;
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : hasWithdrawn ? (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-8 text-center">
            <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2.5" />
            <p className="text-sm font-semibold text-amber-800 mb-1">Laporan sedang diperbarui</p>
            <p className="text-xs text-amber-600 max-w-xs mx-auto leading-relaxed">Pelapor sedang merevisi laporannya. Detail akan kembali muncul setelah disetujui moderator.</p>
          </div>
        ) : hasLinkedReports ? (
          <div className={`bg-white rounded-xl border overflow-hidden ${linkedHasVerified ? 'border-red-200' : 'border-amber-200'}`}>
            <div className="flex items-start gap-3 px-4 py-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${linkedHasVerified ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                <ShieldAlert className={`w-4 h-4 ${linkedHasVerified ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">Belum ada laporan langsung untuk nomor ini</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {linkedHasVerified
                    ? 'Nomor ini disebutkan dalam laporan yang sudah diverifikasi oleh tim moderator. Pelaku yang sama terbukti menggunakan beberapa nomor berbeda.'
                    : 'Nomor ini belum pernah dilaporkan secara langsung. Namun berdasarkan laporan komunitas, nomor ini disebutkan sebagai salah satu nomor yang digunakan oleh pelaku yang sama.'}
                </p>
                <div className={`mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${linkedHasVerified ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                  {linkedHasVerified ? 'Pelaku terbukti, tetap waspada' : '[!] Tetap waspada dengan nomor ini'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <ShieldCheck className="w-7 h-7 text-emerald-500 mx-auto mb-2.5" />
            <p className="text-sm font-semibold text-slate-900 mb-1">Database bersih</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">Tidak ditemukan riwayat laporan terkait nomor ini.</p>
          </div>
        )}
      </div>

      {allEvidenceUrls.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2 font-medium px-0.5">Bukti lampiran</p>
          <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
            <EvidenceGallery urls={allEvidenceUrls} />
          </div>
        </div>
      )}
    </div>
  );
}