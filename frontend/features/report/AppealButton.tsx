'use client';

export default function AppealButton({ reportId }: { reportId: string }) {
  return (
    <button
      disabled
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-xl cursor-not-allowed"
    >
      Ajukan Banding (Segera Hadir)
    </button>
  );
}