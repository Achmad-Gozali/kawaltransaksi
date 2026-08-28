'use client';

import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { Card, SectionTitle } from '@/features/report/ui/primitives';
import { MAX_EVIDENCE_FILES } from '@/features/report/constants';
import type { EvidenceFile } from '@/features/report/types';

interface Props {
  evidenceFiles: EvidenceFile[];
  onEvidenceFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveEvidenceFile: (index: number) => void;
}

export function Step3BuktiKirim({ evidenceFiles, onEvidenceFileChange, onRemoveEvidenceFile }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4 sm:p-5">
          <SectionTitle
            title="Bukti Foto"
            subtitle={`Unggah maksimal ${MAX_EVIDENCE_FILES} foto. Screenshot atau struk transfer, format JPG atau PNG, maksimal 5 MB`}
          />

          {evidenceFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              {evidenceFiles.map((item, index) => (
                <div key={index} className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <div className="relative h-40 sm:h-48 w-full">
                    <Image src={item.preview} alt={`Bukti ${index + 1}`} fill className="object-cover" unoptimized />
                    <button type="button"
                      onClick={() => {
                        // Foto QRIS = bukti wajib; konfirmasi dulu supaya tidak
                        // terhapus tak sengaja (hapusnya juga me-reset Step 1).
                        if (item.isQrisSource && !window.confirm('Hapus foto QRIS ini? Anda perlu scan ulang di Data Penipu.')) return;
                        onRemoveEvidenceFile(index);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/80 transition-colors backdrop-blur-sm">
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <span className="absolute top-2.5 left-2.5 px-2 py-1 bg-black/50 text-white text-xs font-semibold rounded-lg backdrop-blur-sm">
                      {item.isQrisSource ? 'Foto QRIS (wajib)' : `Foto ${index + 1}`}
                    </span>
                  </div>
                  <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <span className="text-xs sm:text-sm text-slate-400 truncate">{item.file.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {evidenceFiles.length < MAX_EVIDENCE_FILES && (
            <label className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col items-center gap-3 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
                  {evidenceFiles.length === 0 ? 'Pilih untuk mengunggah foto bukti' : `Tambah foto (${evidenceFiles.length}/${MAX_EVIDENCE_FILES})`}
                </p>
                <p className="text-xs text-slate-300 mt-1">JPG, PNG - maks 5MB per file</p>
              </div>
              <input type="file" onChange={onEvidenceFileChange} className="hidden" accept="image/*" multiple />
            </label>
          )}
        </div>
      </Card>

      <p className="text-center text-xs text-slate-300 uppercase tracking-widest font-medium">
        Laporan divalidasi sistem - Identitas pelapor terlindungi
      </p>
    </div>
  );
}