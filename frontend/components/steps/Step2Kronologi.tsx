'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Clock } from 'lucide-react';
import { Card, SectionTitle } from '../ui/primitives';
import { TextAnalysisResult } from '../ui/AnalysisResults';
import type { TextAnalysis } from '../report/types';

interface Step2Props {
  chronology: string;
  textAnalysis: TextAnalysis | null;
  isAnalyzingText: boolean;
  onChronologyChange: (value: string) => void;
  onAnalyzeText: () => void;
}

const COOLDOWN_MS = 10 * 60 * 1000; // 10 menit
const MIN_CHARS = 100;

export function Step2Kronologi({
  chronology,
  textAnalysis,
  isAnalyzingText,
  onChronologyChange,
  onAnalyzeText,
}: Step2Props) {
  const chronologyProgress = Math.min((chronology.length / 150) * 100, 100);

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

  const handleAnalyze = () => {
    onAnalyzeText();
    setIsCoolingDown(true);
    setRemaining(COOLDOWN_MS / 1000);
  };

  const canAnalyze = chronology.length >= MIN_CHARS && !isAnalyzingText && !isCoolingDown && !textAnalysis;

  return (
    <Card>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-4 sm:mb-5 gap-3">
          <SectionTitle
            title="Kronologi Kejadian"
            subtitle="Ceritakan dengan detail agar laporan cepat diverifikasi"
          />

          {!textAnalysis && (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 rounded-xl text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-95"
            >
              {isAnalyzingText ? (
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
        </div>

        <textarea
          rows={10}
          value={chronology}
          onChange={(e) => onChronologyChange(e.target.value)}
          placeholder="Ceritakan bagaimana penipuan terjadi. Sertakan nominal kerugian, tanggal kejadian, cara komunikasi, dan detail identitas pelaku yang kamu ketahui..."
          className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 placeholder:text-slate-300 leading-relaxed focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all resize-none"
        />

        <div className="mt-3 sm:mt-4 space-y-2">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                chronologyProgress >= 100
                  ? 'bg-emerald-500'
                  : chronologyProgress > 50
                  ? 'bg-amber-400'
                  : 'bg-slate-300'
              }`}
              style={{ width: `${chronologyProgress}%` }}
            />
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-xs text-slate-400 leading-relaxed">
              {chronology.length < 150
                ? 'Tambahkan lebih banyak detail untuk memperkuat laporan'
                : '✓ Kronologi sudah cukup lengkap'}
            </span>
            <span className={`text-xs font-semibold shrink-0 ${chronology.length >= 150 ? 'text-emerald-500' : 'text-slate-400'}`}>
              {chronology.length} / 150
            </span>
          </div>
        </div>

        {!textAnalysis && !isAnalyzingText && (
          <div className="mt-4 flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
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
                  {chronology.length < MIN_CHARS
                    ? `Tulis minimal ${MIN_CHARS} karakter untuk mengaktifkan Analisis AI.`
                    : 'Klik Analisis AI untuk mengevaluasi kelengkapan kronologi sebelum mengirim laporan.'}
                </p>
              </>
            )}
          </div>
        )}

        {isAnalyzingText && (
          <div className="mt-4 flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
            <p className="text-xs text-slate-500 font-medium">Sedang menganalisis kronologi...</p>
          </div>
        )}

        {textAnalysis && <TextAnalysisResult analysis={textAnalysis} />}
      </div>
    </Card>
  );
}