'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Upload, X, Loader2, Sparkles, ShieldCheck, ShieldX, ShieldEllipsis, Clock,
} from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Card, SectionTitle } from '@/features/report/ui/primitives';
import { ImageAnalysisResult } from '@/features/report/ui/AnalysisResults';
import { MAX_EVIDENCE_FILES } from '@/features/report/constants';
import type { EvidenceFile } from '@/features/report/types';

interface Step3Props {
  evidenceFiles: EvidenceFile[];
  turnstileStatus: 'idle' | 'success' | 'error';
  isAnalyzingAll: boolean;
  onEvidenceFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveEvidenceFile: (index: number) => void;
  onAnalyzeAll: () => void;
  onTurnstileSuccess: (token: string) => void;
  onTurnstileExpire: () => void;
  onTurnstileError: () => void;
}

const COOLDOWN_MS = 10 * 60 * 1000; // 10 menit

export function Step3BuktiKirim({
  evidenceFiles,
  turnstileStatus,
  isAnalyzingAll,
  onEvidenceFileChange,
  onRemoveEvidenceFile,
  onAnalyzeAll,
  onTurnstileSuccess,
  onTurnstileExpire,
  onTurnstileError,
}: Step3Props) {
  const hasUnanalyzed = evidenceFiles.some((f) => !f.analysis);
  const hasFiles = evidenceFiles.length > 0;
  const allAnalyzed = hasFiles && !hasUnanalyzed;

  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!isCoolingDown) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsCoolingDown(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCoolingDown]);

  const formatRemaining = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const handleAnalyzeAll = () => {
    onAnalyzeAll();
    setIsCoolingDown(true);
    setRemaining(COOLDOWN_MS / 1000);
  };

  const canAnalyze = hasFiles && hasUnanalyzed && !isAnalyzingAll && !isCoolingDown;

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4 sm:p-5">

          <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
            <SectionTitle
              title="Bukti Foto"
              subtitle={`Upload hingga ${MAX_EVIDENCE_FILES} foto ┬À Screenshot, struk transfer ┬À JPG, PNG ┬À maks 5MB`}
            />

            {hasFiles && !allAnalyzed && (
              <button
                type="button"
                onClick={handleAnalyzeAll}
                disabled={!canAnalyze}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95 transition-all hover:bg-slate-700"
              >
                {isAnalyzingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Menganalisis...</span>
                  </>
                ) : isCoolingDown ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatRemaining(remaining)}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analisis AI</span>
                  </>
                )}
              </button>
            )}

            {allAnalyzed && (
              <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold shrink-0 border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                Teranalisis
              </span>
            )}
          </div>

          {hasFiles && hasUnanalyzed && !isAnalyzingAll && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              {isCoolingDown ? (
                <>
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Analisis berikutnya tersedia dalam <span className="font-semibold text-slate-600">{formatRemaining(remaining)}</span>.
                  </p>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Klik <span className="font-semibold text-slate-600">Analisis AI</span> untuk memverifikasi keaslian foto bukti secara otomatis.
                  </p>
                </>
              )}
            </div>
          )}

          {isAnalyzingAll && (
            <div className="mb-4 flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
              <p className="text-xs text-slate-500 font-medium">Sedang menganalisis foto bukti...</p>
            </div>
          )}

          {hasFiles && (
            <div className="space-y-3 mb-4">
              {evidenceFiles.map((item: EvidenceFile, index: number) => (
                <div key={index} className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <div className="relative h-40 sm:h-48 w-full">
                    <Image
                      src={item.preview}
                      alt={`Bukti ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveEvidenceFile(index)}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/80 transition-colors backdrop-blur-sm"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <span className="absolute top-2.5 left-2.5 px-2 py-1 bg-black/50 text-white text-xs font-semibold rounded-lg backdrop-blur-sm">
                      Foto {index + 1}
                    </span>
                  </div>
                  <div className="px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm text-slate-400 truncate min-w-0">{item.file.name}</span>
                    {item.isAnalyzing && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">Menganalisis...</span>
                      </span>
                    )}
                    {item.analysis && !item.isAnalyzing && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Teranalisis
                      </span>
                    )}
                  </div>
                  {item.analysis && (
                    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <ImageAnalysisResult analysis={item.analysis} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {evidenceFiles.length < MAX_EVIDENCE_FILES && (
            <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col items-center gap-3 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
                  {evidenceFiles.length === 0
                    ? 'Klik untuk upload foto bukti'
                    : `Tambah foto (${evidenceFiles.length}/${MAX_EVIDENCE_FILES})`}
                </p>
                <p className="text-xs text-slate-300 mt-1">JPG, PNG ┬À maks 5MB per file</p>
              </div>
              <input
                type="file"
                onChange={onEvidenceFileChange}
                className="hidden"
                accept="image/*"
                multiple
              />
            </label>
          )}
        </div>
      </Card>

      <div className="flex flex-col items-center gap-2">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={(token: string) => onTurnstileSuccess(token)}
          onExpire={onTurnstileExpire}
          onError={onTurnstileError}
        />
        {turnstileStatus === 'success' && (
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Verifikasi berhasil
          </p>
        )}
        {turnstileStatus === 'error' && (
          <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5">
            <ShieldX className="w-3.5 h-3.5" /> Verifikasi gagal, refresh halaman
          </p>
        )}
        {turnstileStatus === 'idle' && (
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldEllipsis className="w-3.5 h-3.5" /> Selesaikan verifikasi untuk kirim laporan
          </p>
        )}
      </div>
    </div>
  );
}
