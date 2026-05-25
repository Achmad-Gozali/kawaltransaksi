'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/core/supabase/browser';
import { Loader2, AlertCircle, CheckCircle2, Send, ArrowLeft, ArrowRight } from 'lucide-react';
import * as motion from 'motion/react-client';
import { uploadToStorage } from '@/core/storage/upload';

import { STEPS, MAX_TARGET_NUMBERS, MAX_EVIDENCE_FILES } from '@/features/report/constants';
import type { TargetEntry, EvidenceFile, ReportFormData } from '@/features/report/types';
import { Step1DataPenipu } from '@/features/report/steps/Step1DataPenipu';
import { Step2Kronologi } from '@/features/report/steps/Step2Kronologi';
import { Step3BuktiKirim } from '@/features/report/steps/Step3BuktiKirim';

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) throw new Error('NEXT_PUBLIC_BACKEND_URL belum dikonfigurasi.');
  return url;
})();

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

const defaultEntry = (): TargetEntry => ({
  number: '', name: '', type: 'phone', bank_name: '', ewallet_name: '',
});

const defaultFormData = (): ReportFormData => ({
  category: 'Jual Beli Online', chronology: '', loss_amount: '',
  incident_date: '', platform: '', link_url: '',
  social_media_accounts: [''], has_other_victims: '',
  reported_to: [], store_name: '', suspect_city: '',
});

export default function ReportForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Turnstile
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Form state
  const [targets, setTargets] = useState<TargetEntry[]>([defaultEntry()]);
  const [formData, setFormData] = useState<ReportFormData>(defaultFormData());
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [suspectPhoto, setSuspectPhoto] = useState<File | null>(null);
  const [suspectPhotoPreview, setSuspectPhotoPreview] = useState<string | null>(null);

  // ── Target handlers ────────────────────────────────────────────────────────
  const updateTarget = (index: number, updated: TargetEntry) =>
    setTargets(prev => prev.map((t, i) => i === index ? updated : t));
  const addTarget = () => {
    if (targets.length < MAX_TARGET_NUMBERS) setTargets(prev => [...prev, defaultEntry()]);
  };
  const removeTarget = (index: number) => setTargets(prev => prev.filter((_, i) => i !== index));

  // ── Social media handlers ──────────────────────────────────────────────────
  const addSocialField = () =>
    setFormData(f => ({ ...f, social_media_accounts: [...f.social_media_accounts, ''] }));
  const removeSocialField = (i: number) =>
    setFormData(f => ({ ...f, social_media_accounts: f.social_media_accounts.filter((_, idx) => idx !== i) }));
  const updateSocialField = (i: number, val: string) =>
    setFormData(f => { const arr = [...f.social_media_accounts]; arr[i] = val; return { ...f, social_media_accounts: arr }; });
  const toggleReportedTo = (val: string) =>
    setFormData(f => ({
      ...f,
      reported_to: f.reported_to.includes(val)
        ? f.reported_to.filter(v => v !== val)
        : [...f.reported_to, val],
    }));

  // ── Suspect photo handlers ─────────────────────────────────────────────────
  const handleSuspectPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > 5 * 1024 * 1024) { setError('Ukuran foto melebihi 5MB.'); return; }
    setSuspectPhoto(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setSuspectPhotoPreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else { setSuspectPhotoPreview(null); }
  };
  const removeSuspectPhoto = () => { setSuspectPhoto(null); setSuspectPhotoPreview(null); };

  // ── Evidence file handlers ─────────────────────────────────────────────────
  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const toAdd = files.slice(0, MAX_EVIDENCE_FILES - evidenceFiles.length);
    const oversized = toAdd.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) { setError(`${oversized.length} file melebihi batas 5MB.`); return; }
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setEvidenceFiles(prev => [...prev, { file, preview: reader.result as string }]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const removeEvidenceFile = (index: number) =>
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!targets[0].number.trim()) { setError('Nomor HP atau rekening utama wajib diisi.'); return; }
      if (targets.slice(1).some(t => !t.number.trim())) {
        setError('Nomor tambahan yang ditambahkan wajib diisi, atau hapus jika tidak perlu.'); return;
      }
    }
    if (currentStep === 2 && formData.chronology.trim().length < 20) {
      setError('Kronologi minimal 20 karakter.'); return;
    }
    setCurrentStep(s => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!turnstileToken) { setError('Selesaikan verifikasi keamanan terlebih dahulu.'); return; }
    setIsLoading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const token = await getAuthToken();
      if (!token) { setError('Sesi habis. Silakan login ulang.'); setIsLoading(false); return; }

      // Upload bukti
      const uploadedUrls: string[] = [];
      for (let i = 0; i < evidenceFiles.length; i++) {
        setUploadProgress(`Mengupload foto ${i + 1} dari ${evidenceFiles.length}...`);
        try { uploadedUrls.push(await uploadToStorage(evidenceFiles[i].file)); }
        catch (err) { setError(err instanceof Error ? err.message : 'Gagal upload foto.'); setIsLoading(false); return; }
      }

      // Upload foto tersangka
      let suspectPhotoUrl: string | null = null;
      if (suspectPhoto) {
        setUploadProgress('Mengupload foto profil penipu...');
        try { suspectPhotoUrl = await uploadToStorage(suspectPhoto); }
        catch (err) { setError(err instanceof Error ? err.message : 'Gagal upload foto profil.'); setIsLoading(false); return; }
      }

      const primary = targets[0];
      const providerName =
        primary.type === 'bank_account' ? primary.bank_name :
        primary.type === 'ewallet' ? primary.ewallet_name : null;

      const allNumbers = targets
        .map(t => ({
          number: t.number.trim(), type: t.type,
          bank: t.type === 'bank_account' ? t.bank_name || null : t.type === 'ewallet' ? t.ewallet_name || null : null,
          name: t.name.trim() || null,
        }))
        .filter(t => t.number.length > 0);

      setUploadProgress('Mengirim laporan...');
      const res = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          target_number: primary.number,
          target_name: primary.name || null,
          target_type: primary.type,
          bank_name: providerName || null,
          target_numbers: allNumbers,
          category: formData.category,
          chronology: formData.chronology,
          evidence_url: uploadedUrls[0] || null,
          evidence_urls: uploadedUrls,
          loss_amount: formData.loss_amount ? parseInt(formData.loss_amount.replace(/\D/g, ''), 10) : null,
          incident_date: formData.incident_date || null,
          platform: formData.platform || null,
          link_url: formData.link_url || null,
          social_media_accounts: formData.social_media_accounts.filter(Boolean),
          has_other_victims: formData.has_other_victims || null,
          reported_to: formData.reported_to,
          suspect_photo_url: suspectPhotoUrl,
          store_name: formData.store_name || null,
          suspect_city: formData.suspect_city || null,
          turnstile_token: turnstileToken,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => router.push(`/check/${result.slug}`), 1500);
      } else {
        setError(result.message || 'Gagal mengirim laporan.');
      }
    } catch {
      setError('Terjadi kesalahan. Periksa koneksi dan coba lagi.');
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Laporan Berhasil Dikirim!</h3>
        <p className="text-slate-400">Mengalihkan ke halaman detail laporan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Step Indicator */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isDone = currentStep > step.number;
          const isActive = currentStep === step.number;
          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDone ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                  : isActive ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-300 border-2 border-slate-100'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors ${
                  isActive ? 'text-slate-900' : isDone ? 'text-emerald-500' : 'text-slate-300'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 transition-all duration-500 ${currentStep > step.number ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Steps */}
      {currentStep === 1 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Step1DataPenipu
            targets={targets} formData={formData} suspectPhotoPreview={suspectPhotoPreview}
            onUpdateTarget={updateTarget} onAddTarget={addTarget} onRemoveTarget={removeTarget}
            onFormDataChange={setFormData} onSuspectPhotoChange={handleSuspectPhotoChange}
            onRemoveSuspectPhoto={removeSuspectPhoto} onAddSocialField={addSocialField}
            onRemoveSocialField={removeSocialField} onUpdateSocialField={updateSocialField}
            onToggleReportedTo={toggleReportedTo}
          />
        </motion.div>
      )}

      {currentStep === 2 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Step2Kronologi
            chronology={formData.chronology}
            onChronologyChange={(val) => setFormData(f => ({ ...f, chronology: val }))}
          />
        </motion.div>
      )}

      {currentStep === 3 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Step3BuktiKirim
            evidenceFiles={evidenceFiles} turnstileStatus={turnstileStatus}
            onEvidenceFileChange={handleEvidenceFileChange} onRemoveEvidenceFile={removeEvidenceFile}
            onTurnstileSuccess={(token) => { setTurnstileToken(token); setTurnstileStatus('success'); setError(null); }}
            onTurnstileExpire={() => { setTurnstileToken(null); setTurnstileStatus('idle'); setError('Verifikasi kedaluwarsa. Silakan ulangi.'); }}
            onTurnstileError={() => { setTurnstileToken(null); setTurnstileStatus('error'); setError('Widget keamanan gagal dimuat. Coba refresh halaman.'); }}
          />
        </motion.div>
      )}

      {/* Navigation */}
      <div className={`flex gap-3 ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
        {currentStep > 1 && (
          <button type="button" onClick={handlePrevStep}
            className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        )}
        {currentStep < 3 ? (
          <button type="button" onClick={handleNextStep}
            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all active:scale-95">
            Lanjut <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={isLoading || !turnstileToken}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-sm shadow-emerald-200">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {uploadProgress ?? 'Kirim Laporan'}
          </button>
        )}
      </div>

      {currentStep === 3 && (
        <p className="text-center text-xs text-slate-300 uppercase tracking-widest font-medium pb-4">
          Laporan divalidasi sistem · Identitas pelapor terlindungi
        </p>
      )}
    </div>
  );
}