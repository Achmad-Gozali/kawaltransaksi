'use client';

import { useState } from 'react';
import { Copy, Check, X, AlertTriangle } from 'lucide-react';

export function KeyRevealModal({ apiKey, onClose }: { apiKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-base font-black text-slate-900">Simpan API Key Anda</p>
            <p className="text-sm text-slate-500 mt-1">Key ini hanya ditampilkan sekali. Salin dan simpan sekarang.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 leading-relaxed">
            Setelah menutup modal ini, key tidak bisa dilihat lagi. Kalau hilang, gunakan tombol <strong>Regenerate</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-4 py-3 mb-4">
          <code className="flex-1 text-sm font-mono text-emerald-400 break-all">{apiKey}</code>
          <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors shrink-0 ml-2">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          {copied
            ? <><Check className="w-4 h-4 text-emerald-400" /> Tersalin!</>
            : <><Copy className="w-4 h-4" /> Salin API Key</>}
        </button>

        <button onClick={onClose} className="w-full mt-2 py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          Sudah disimpan, tutup
        </button>
      </div>
    </div>
  );
}
