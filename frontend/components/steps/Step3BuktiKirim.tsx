'use client';

import Image from 'next/image';
import {
  Upload, X, Loader2, Sparkles, ShieldCheck, ShieldX, ShieldEllipsis,
} from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Card, SectionTitle } from '../ui/primitives';
import { ImageAnalysisResult } from '../ui/AnalysisResults';
import { MAX_EVIDENCE_FILES } from '../report/constants';
import type { EvidenceFile } from '../report/types';

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

  return (
    <div className="space-y-4">

      <Card>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-5">
            <SectionTitle
              title="Bukti Foto"
              subtitle={`Upload hingga ${MAX_EVIDENCE_FILES} foto · Screenshot percakapan, struk transfer · JPG, PNG · maks 5MB per file`}
            />
            {hasFiles && hasUnanalyzed && (
              <button
                type="button"
                onClick={onAnalyzeAll}
                disabled={isAnalyzingAll}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold disabled:opacity-50 shrink-0 active:scale-95 transition-all"
              >
                {isAnalyzingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isAnalyzingAll ? 'Menganalisis...' : 'Analisis AI'}
              </button>
            )}
          </div>

          {evidenceFiles.length > 0 && (
            <div className="space-y-3 mb-4">
              {evidenceFiles.map((item: EvidenceFile, index: number) => (
                <div
                  key={index}
                  className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50"
                >
                  <div className="relative h-48 w-full">
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
                      className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/80 transition-colors backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 text-white text-xs font-semibold rounded-lg backdrop-blur-sm">
                      Foto {index + 1}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-400 truncate min-w-0">
                      {item.file.name}
                    </span>
                    {item.isAnalyzing && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisis...
                      </span>
                    )}
                    {item.analysis && !item.isAnalyzing && (
                      <span className="text-xs text-emerald-600 font-semibold shrink-0">
                        Teranalisis
                      </span>
                    )}
                  </div>
                  {item.analysis && (
                    <div className="px-4 pb-4">
                      <ImageAnalysisResult analysis={item.analysis} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {evidenceFiles.length < MAX_EVIDENCE_FILES && (
            <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                <Upload className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
                  {evidenceFiles.length === 0
                    ? 'Klik untuk upload foto bukti'
                    : `Tambah foto (${evidenceFiles.length}/${MAX_EVIDENCE_FILES})`}
                </p>
                <p className="text-xs text-slate-300 mt-1">JPG, PNG · maks 5MB per file</p>
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

      {/* Turnstile minimal */}
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