'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Send, ArrowLeft, ArrowRight } from 'lucide-react';
import * as motion from 'motion/react-client';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { uploadToStorage } from '@/core/storage/upload';
import { authClient } from '@/core/auth/client';
import { STEPS, MAX_EVIDENCE_FILES } from '@/features/report/constants';
import type { TargetEntry, EvidenceFile, ReportFormData } from '@/features/report/types';
import { Step1DataPenipu } from '@/features/report/steps/Step1DataPenipu';
import { Step2Kronologi } from '@/features/report/steps/Step2Kronologi';
import { Step3BuktiKirim } from '@/features/report/steps/Step3BuktiKirim';

const defaultTarget = (): TargetEntry => ({
  number: '', name: '', type: 'phone', bank_name: '', ewallet_name: '',
  custom_bank_name: '', custom_ewallet_name: '',
});

const defaultFormData = (): ReportFormData => ({
  category: '',
  chronology: '', loss_amount: '',
  incident_date: '', platform: '', link_url: '',
  social_media_accounts: [''], has_other_victims: '',
  reported_to: [], store_name: '', suspect_city: '',
});

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result as string);
    r.onerror   = () => rej(new Error('Gagal membaca file'));
    r.readAsDataURL(file);
  });
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const isDone   = currentStep > step.number;
        const isActive = currentStep === step.number;
        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                isDone   ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                : isActive ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-300 border-2 border-slate-100'
              }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.number}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors ${
                isActive ? 'text-slate-900' : isDone ? 'text-emerald-500' : 'text-slate-300'
              }`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 transition-all duration-500 ${currentStep > step.number ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ReportForm() {
  const router = useRouter();
  const [currentStep,         setCurrentStep]         = useState(1);
  const [isLoading,           setIsLoading]           = useState(false);
  const [isSuccess,           setIsSuccess]           = useState(false);
  const [error,               setError]               = useState<string | null>(null);
  const [uploadProgress,      setUploadProgress]      = useState<string | null>(null);
  const [target,               setTarget]              = useState<TargetEntry>(defaultTarget());
  const [formData,            setFormData]            = useState<ReportFormData>(defaultFormData());
  const [evidenceFiles,       setEvidenceFiles]       = useState<EvidenceFile[]>([]);
  const [suspectPhoto,        setSuspectPhoto]        = useState<File | null>(null);
  const [suspectPhotoPreview, setSuspectPhotoPreview] = useState<string | null>(null);
  const [customCategory,      setCustomCategory]      = useState('');
  const [customPlatform,      setCustomPlatform]      = useState('');
  const [turnstileToken,      setTurnstileToken]      = useState<string | null>(null);

  const turnstileRef = useRef<TurnstileInstance>(null);

  const updateArrayField = useCallback((action: 'add' | 'remove' | 'update', index?: number, val?: string) => {
    setFormData(f => {
      const arr = [...f.social_media_accounts];
      if (action === 'add')    return { ...f, social_media_accounts: [...arr, ''] };
      if (action === 'remove') return { ...f, social_media_accounts: arr.filter((_, i) => i !== index) };
      arr[index!] = val!;
      return { ...f, social_media_accounts: arr };
    });
  }, []);

  const toggleReportedTo = useCallback((val: string) =>
    setFormData(f => ({
      ...f,
      reported_to: f.reported_to.includes(val)
        ? f.reported_to.filter(v => v !== val)
        : [...f.reported_to, val],
    })), []);

  const handlePhotoChange = useCallback(async (
    file: File | null, type: 'suspect' | 'evidence', e?: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran file melebihi 5MB.'); return; }
    if (type === 'suspect') {
      setSuspectPhoto(file);
      setSuspectPhotoPreview(await readFileAsDataUrl(file));
    } else {
      if (evidenceFiles.length >= MAX_EVIDENCE_FILES) return;
      const preview = await readFileAsDataUrl(file);
      setEvidenceFiles(prev => [...prev, { file, preview }]);
      if (e) e.target.value = '';
    }
  }, [evidenceFiles.length]);

  const handleEvidenceFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files     = Array.from(e.target.files || []).slice(0, MAX_EVIDENCE_FILES - evidenceFiles.length);
    const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length) { setError(`${oversized.length} file melebihi batas 5MB.`); return; }
    for (const file of files) await handlePhotoChange(file, 'evidence', e);
  }, [evidenceFiles.length, handlePhotoChange]);

  const navigate = (dir: 'next' | 'prev') => {
    setError(null);
    if (dir === 'next') {
      if (currentStep === 1 && !target.number.trim())
        return setError('Nomor HP, rekening, atau e-wallet wajib diisi.');
      if (currentStep === 1 && !formData.category)
        return setError('Kategori penipuan wajib dipilih.');
      if (currentStep === 2 && formData.chronology.trim().length < 20)
        return setError('Kronologi minimal 20 karakter.');
      setCurrentStep(s => Math.min(s + 1, 3));
    } else {
      setCurrentStep(s => Math.max(s - 1, 1));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!turnstileToken) {
      setError('Selesaikan verifikasi keamanan terlebih dahulu.');
      return;
    }

    setIsLoading(true); setError(null); setUploadProgress(null);
    try {
      const freshToken = await authClient.refresh();
      if (!freshToken) {
        setError('Sesi habis. Silakan login ulang.');
        setIsLoading(false);
        return;
      }

      const uploadedUrls: string[] = [];
      for (let i = 0; i < evidenceFiles.length; i++) {
        setUploadProgress(`Mengupload foto ${i + 1} dari ${evidenceFiles.length}...`);
        uploadedUrls.push(await uploadToStorage(evidenceFiles[i].file, "reports").catch(err => {
          throw new Error(err instanceof Error ? err.message : 'Gagal upload foto.');
        }));
      }

      let suspectPhotoUrl: string | null = null;
      if (suspectPhoto) {
        setUploadProgress('Mengupload foto profil penipu...');
        suspectPhotoUrl = await uploadToStorage(suspectPhoto, "reports").catch(err => {
          throw new Error(err instanceof Error ? err.message : 'Gagal upload foto profil.');
        });
      }

      const resolvedCategory = formData.category === 'Lainnya' ? (customCategory.trim() || 'Lainnya') : formData.category;
      const resolvedPlatform = formData.platform === 'Lainnya' ? (customPlatform.trim() || 'Lainnya') : (formData.platform || null);

      const resolvedBankName = target.type === 'bank_account'
        ? (target.bank_name === 'Lainnya' ? (target.custom_bank_name?.trim() || 'Lainnya') : target.bank_name)
        : null;

      const resolvedWalletName = target.type === 'ewallet'
        ? (target.ewallet_name === 'Lainnya' ? (target.custom_ewallet_name?.trim() || 'Lainnya') : target.ewallet_name)
        : null;

      setUploadProgress('Mengirim laporan...');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${authClient.getToken()}`,
        },
        body: JSON.stringify({
          targetValue:         target.number,
          targetType:          target.type,
          targetName:          target.name?.trim() || null,
          bankName:            resolvedBankName,
          walletName:          resolvedWalletName,
          category:            resolvedCategory,
          chronology:          formData.chronology,
          description:         formData.chronology,
          evidenceUrls:        uploadedUrls,
          amount:              formData.loss_amount ? parseInt(formData.loss_amount.replace(/\D/g, ''), 10) : null,
          incidentDate:        formData.incident_date || null,
          platform:            resolvedPlatform,
          linkUrl:             formData.link_url || null,
          socialMediaAccounts: formData.social_media_accounts.filter(Boolean),
          hasOtherVictims:     formData.has_other_victims || null,
          reportedTo:          formData.reported_to,
          suspectPhotoUrl,
          storeName:           formData.store_name || null,
          suspectCity:         formData.suspect_city || null,
          turnstileToken,
        }),
      });

      const result = await res.json();
      if (result.data?.id) {
        setIsSuccess(true);
        setTimeout(() => router.push(`/check/${encodeURIComponent(target.number)}`), 1500);
      } else {
        setError(result.error || 'Gagal mengirim laporan.');
        turnstileRef.current?.reset();
        setTurnstileToken(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Periksa koneksi dan coba lagi.');
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setIsLoading(false); setUploadProgress(null);
    }
  };

  if (isSuccess) return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Laporan Berhasil Dikirim!</h3>
      <p className="text-slate-400">Mengalihkan ke halaman detail laporan...</p>
    </div>
  );

  const stepComponents = [
    <Step1DataPenipu
      key="step1"
      target={target} formData={formData}
      suspectPhotoPreview={suspectPhotoPreview}
      customCategory={customCategory} customPlatform={customPlatform}
      onUpdateTarget={setTarget}
      onFormDataChange={setFormData}
      onSuspectPhotoChange={(e) => handlePhotoChange(e.target.files?.[0] || null, 'suspect')}
      onRemoveSuspectPhoto={() => { setSuspectPhoto(null); setSuspectPhotoPreview(null); }}
      onAddSocialField={() => updateArrayField('add')}
      onRemoveSocialField={(i) => updateArrayField('remove', i)}
      onUpdateSocialField={(i, v) => updateArrayField('update', i, v)}
      onToggleReportedTo={toggleReportedTo}
      onCustomCategoryChange={(val) => setCustomCategory(val)}
      onCustomPlatformChange={(val) => setCustomPlatform(val)}
    />,
    <Step2Kronologi
      key="step2"
      chronology={formData.chronology}
      onChronologyChange={(val) => setFormData(f => ({ ...f, chronology: val }))}
    />,
    <Step3BuktiKirim
      key="step3"
      evidenceFiles={evidenceFiles}
      onEvidenceFileChange={handleEvidenceFileChange}
      onRemoveEvidenceFile={(i) => setEvidenceFiles(prev => prev.filter((_, idx) => idx !== i))}
    />,
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <StepIndicator currentStep={currentStep} />

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <motion.div key={currentStep} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {stepComponents[currentStep - 1]}
      </motion.div>

      {currentStep === 3 && (
        <div className="flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={setTurnstileToken}
            onExpire={() => {
              setTurnstileToken(null);
              setError('Verifikasi keamanan kedaluwarsa. Silakan selesaikan ulang di bawah.');
            }}
            onError={() => {
              setTurnstileToken(null);
              setError('Verifikasi keamanan gagal dimuat. Coba muat ulang halaman atau periksa koneksi internet kamu.');
            }}
            options={{ theme: 'light' }}
          />
        </div>
      )}

      <div className={`flex gap-3 ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
        {currentStep > 1 && (
          <button type="button" onClick={() => navigate('prev')}
            className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        )}
        {currentStep < 3 ? (
          <button type="button" onClick={() => navigate('next')}
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
    </div>
  );
}