'use client';

import { Card, SectionTitle } from '@/features/report/ui/primitives';

interface Step2Props {
  chronology: string;
  onChronologyChange: (value: string) => void;
}

export function Step2Kronologi({ chronology, onChronologyChange }: Step2Props) {
  const progress = Math.min((chronology.length / 150) * 100, 100);

  return (
    <Card>
      <div className="p-4 sm:p-5">
        <SectionTitle
          title="Kronologi Kejadian"
          subtitle="Ceritakan dengan detail agar laporan cepat diverifikasi"
        />

        <textarea
          rows={10}
          value={chronology}
          onChange={(e) => onChronologyChange(e.target.value)}
          placeholder="Ceritakan bagaimana penipuan terjadi. Sertakan nominal kerugian, tanggal kejadian, cara komunikasi, dan detail identitas pelaku yang kamu ketahui..."
          className="w-full mt-4 px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 placeholder:text-slate-300 leading-relaxed focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all resize-none"
        />

        <div className="mt-3 sm:mt-4 space-y-2">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress >= 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-amber-400' : 'bg-slate-300'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-xs text-slate-400 leading-relaxed">
              {chronology.length < 150
                ? 'Tambahkan lebih banyak detail untuk memperkuat laporan'
                : '✔ Kronologi sudah cukup lengkap'}
            </span>
            <span className={`text-xs font-semibold shrink-0 ${chronology.length >= 150 ? 'text-emerald-500' : 'text-slate-400'}`}>
              {chronology.length} / 150
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}