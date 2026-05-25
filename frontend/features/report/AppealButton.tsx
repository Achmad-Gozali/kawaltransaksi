'use client';

// ============================================
//  LOKASI: frontend/features/report/AppealButton.tsx
// ============================================

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Loader2, MessageSquare, X, Send,
  Upload, Trash2, CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/core/supabase/browser';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
const MIN_REASON  = 50;
const MAX_FILES   = 5;

export default function AppealButton({ reportId }: { reportId: string }) {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  const [open,       setOpen]       = useState(false);
  const [reason,     setReason]     = useState('');
  const [lossAmount, setLossAmount] = useState('');
  const [files,      setFiles]      = useState<File[]>([]);
  const [previews,   setPreviews]   = useState<string[]>([]);
  const [uploading,  setUploading]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);

  // Pastikan portal hanya di client side
  useEffect(() => { setMounted(true); }, []);

  // Lock scroll body saat modal buka
  useEffect(() => {
    if (!mounted) return;
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top      = `-${scrollY}px`;
      document.body.style.width    = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top      = '';
      document.body.style.width    = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, [open, mounted]);

  const handleClose = () => {
    if (loading || uploading) return;
    setOpen(false);
    setReason('');
    setLossAmount('');
    setFiles([]);
    setPreviews([]);
    setError(null);
    setSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected  = Array.from(e.target.files ?? []);
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) return;

    const valid = selected
      .filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
      .slice(0, remaining);

    if (valid.length < selected.length) setError('Maks 5MB per file. Hanya gambar yang diterima.');
    else setError(null);

    setFiles(prev => [...prev, ...valid]);
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const removeFile = (i: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (!files.length) return [];
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of files) {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `appeals/${reportId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('evidence').upload(path, file, { upsert: false });
      if (error) throw new Error(`Gagal upload: ${error.message}`);
      const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (reason.trim().length < MIN_REASON) {
      setError(`Alasan minimal ${MIN_REASON} karakter.`);
      return;
    }
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Sesi habis. Silakan login ulang.'); return; }

      let evidenceUrls: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        evidenceUrls = await uploadFiles();
        setUploading(false);
      }

      setLoading(true);

      const res = await fetch(`${BACKEND_URL}/api/appeals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          reportId,
          reason:        reason.trim(),
          evidence_urls: evidenceUrls,
          loss_amount:   lossAmount ? Number(lossAmount.replace(/\D/g, '')) : null,
        }),
      });

      const data = await res.json();
      if (!data.success) { setError(data.message ?? 'Gagal mengajukan banding.'); return; }

      setSuccess(true);
      setTimeout(() => { handleClose(); router.refresh(); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');
      setUploading(false);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num ? Number(num).toLocaleString('id-ID') : '';
  };

  const isSubmitting = loading || uploading;
  const canSubmit    = reason.trim().length >= MIN_REASON && !isSubmitting;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col w-full"
        style={{ maxWidth: '32rem', maxHeight: '90vh' }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ajukan Banding</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Robot akan mengevaluasi ulang laporan kamu</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body -- scrollable */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-slate-900">Banding berhasil diajukan!</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Robot sedang mengevaluasi ulang laporan kamu.<br />Hasilnya akan muncul dalam beberapa saat.
              </p>
            </div>
          ) : (
            <>
              {/* Info box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Tambahkan bukti foto dan nominal kerugian untuk meningkatkan skor laporan kamu. Robot akan mengevaluasi ulang secara otomatis.
                </p>
              </div>

              {/* 1. Alasan banding */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Alasan Banding <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={e => { setReason(e.target.value); setError(null); }}
                  placeholder="Jelaskan mengapa laporan ini seharusnya diverifikasi. Sertakan informasi tambahan yang relevan..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-[11px] text-slate-400">Min. {MIN_REASON} karakter</p>
                  <p className={`text-[11px] font-medium ${reason.length >= MIN_REASON ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {reason.length}/{MIN_REASON}
                  </p>
                </div>
              </div>

              {/* 2. Nominal kerugian */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Nominal Kerugian <span className="text-slate-300">(opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={lossAmount}
                    onChange={e => setLossAmount(formatRupiah(e.target.value))}
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Mengisi nominal kerugian menambah skor evaluasi robot</p>
              </div>

              {/* 3. Upload bukti */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Bukti Tambahan <span className="text-slate-300">(maks. {MAX_FILES} foto)</span>
                </label>

                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={src} alt={`Bukti ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length < MAX_FILES && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    {files.length === 0 ? 'Klik untuk upload foto bukti' : `Tambah foto (${files.length}/${MAX_FILES})`}
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-[11px] text-slate-400 mt-1">Setiap foto bukti menambah skor evaluasi robot</p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-[11px] text-red-600">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-5 py-4 border-t border-slate-100 flex gap-2 shrink-0">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mengupload...</>
              ) : loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
              ) : (
                <><Send className="w-4 h-4" /> Kirim Banding</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Ajukan Banding
      </button>

      {mounted && open && createPortal(modal, document.body)}
    </>
  );
}