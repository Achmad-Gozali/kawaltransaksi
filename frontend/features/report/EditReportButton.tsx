'use client';

import { useRouter } from 'next/navigation';
import { FilePen } from 'lucide-react';

interface EditReportButtonProps {
  report: { id: string };
}

export default function EditReportButton({ report }: EditReportButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/dashboard/laporan/${report.id}/edit`)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
    >
      <FilePen className="w-3 h-3" />
      Edit Laporan
    </button>
  );
}