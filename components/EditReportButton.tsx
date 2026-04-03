'use client';

import { useState } from 'react';
import { FilePen } from 'lucide-react';
import EditReportModal from './EditReportModal';

interface EditReportButtonProps {
  report: any;
}

export default function EditReportButton({ report }: EditReportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
      >
        <FilePen className="w-3 h-3" />
        Edit Laporan
      </button>
      {open && <EditReportModal report={report} onClose={() => setOpen(false)} />}
    </>
  );
}