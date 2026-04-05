'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import {
  Loader2, Upload, AlertCircle, CheckCircle2, Brain,
  Sparkles, X, Phone, Building2, Wallet, ChevronDown,
  Plus, Trash2, ShieldCheck, ShieldAlert, ShieldX, Info,
  ArrowLeft, ArrowRight, Send,
} from 'lucide-react';
import * as motion from 'motion/react-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const MAX_EVIDENCE_FILES = 10;

// ── LIST DATA ─────────────────────────────────────────────────────────────────
const bankList = [
  { value: 'BCA', label: 'BCA (Bank Central Asia)' },
  { value: 'BRI', label: 'BRI (Bank Rakyat Indonesia)' },
  { value: 'BNI', label: 'BNI (Bank Negara Indonesia)' },
  { value: 'Mandiri', label: 'Bank Mandiri' },
  { value: 'BSI', label: 'BSI (Bank Syariah Indonesia)' },
  { value: 'CIMB Niaga', label: 'CIMB Niaga' },
  { value: 'Danamon', label: 'Bank Danamon' },
  { value: 'Permata', label: 'Bank Permata' },
  { value: 'OCBC NISP', label: 'OCBC NISP' },
  { value: 'Panin', label: 'Bank Panin' },
  { value: 'Mega', label: 'Bank Mega' },
  { value: 'BTN', label: 'BTN (Bank Tabungan Negara)' },
  { value: 'Jago', label: 'Bank Jago' },
  { value: 'SeaBank', label: 'SeaBank' },
  { value: 'Lainnya', label: 'Bank Lainnya' },
];

const ewalletList = [
  { value: 'Dana', label: 'Dana' },
  { value: 'GoPay', label: 'GoPay' },
  { value: 'OVO', label: 'OVO' },
  { value: 'ShopeePay', label: 'ShopeePay' },
  { value: 'LinkAja', label: 'LinkAja' },
  { value: 'Lainnya', label: 'E-Wallet Lainnya' },
];

const platformList = [
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'TikTok Shop', label: 'TikTok Shop' },
  { value: 'Facebook', label: 'Facebook / Marketplace' },
  { value: 'Telegram', label: 'Telegram' },
  { value: 'Twitter/X', label: 'Twitter / X' },
  { value: 'Lainnya', label: 'Platform Lainnya' },
];

const categoryList = [
  { value: 'Jual Beli Online', label: 'Jual Beli Online' },
  { value: 'Investasi Bodong', label: 'Investasi Bodong' },
  { value: 'Pinjaman Online', label: 'Pinjaman Online' },
  { value: 'Phishing / Soceng', label: 'Phishing / Social Engineering' },
  { value: 'Modus Kurir/APK', label: 'Modus Kurir / File APK' },
  { value: 'Lainnya', label: 'Lainnya' },
];

const reportedToOptions = [
  { value: 'polisi', label: 'Polisi' },
  { value: 'ojk', label: 'OJK' },
  { value: 'platform', label: 'Platform terkait' },
  { value: 'belum', label: 'Belum lapor' },
];

const STEPS = [
  { number: 1, label: 'Data Penipu' },
  { number: 2, label: 'Kronologi' },
  { number: 3, label: 'Bukti Foto' },
];

const TIPS: Record<number, { title: string; items: string[] }> = {
  1: {
    title: 'Tips mengisi data penipu',
    items: [
      'Pastikan nomor HP atau rekening yang dilaporkan benar dan valid.',
      'Cantumkan nama pemilik jika kamu mengetahuinya.',
      'Sertakan akun media sosial pelaku jika ada.',
      'Upload foto profil pelaku untuk membantu identifikasi.',
    ],
  },
  2: {
    title: 'Tips menulis kronologi',
    items: [
      'Ceritakan kejadian secara runtut dan detail — minimal 150 karakter.',
      'Cantumkan nominal kerugian, tanggal kejadian, dan platform yang digunakan.',
      'Gunakan tombol Analisis AI untuk cek kualitas kronologimu.',
      'Kronologi yang lengkap mempercepat proses verifikasi tim.',
    ],
  },
  3: {
    title: 'Tips upload bukti',
    items: [
      'Upload screenshot percakapan dengan pelaku sebagai bukti utama.',
      'Sertakan struk transfer atau bukti pembayaran jika ada.',
      'Maksimal 10 foto, masing-masing maks 5MB.',
      'Gunakan tombol Scan AI untuk verifikasi keaslian bukti.',
    ],
  },
};

// ── TYPES ─────────────────────────────────────────────────────────────────────
type TargetType = 'phone' | 'bank_account' | 'ewallet';

interface AnalysisResult {
  authenticity_score: number;
  relevance_score: number;
  has_concrete_evidence: boolean;
  is_likely_authentic: boolean;
  summary: string;
  red_flags: string[];
}

interface EvidenceFile {
  file: File;
  preview: string;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

type PhotoScanPayload = Pick<AnalysisResult, 'authenticity_score' | 'relevance_score' | 'has_concrete_evidence' | 'is_likely_authentic'>;

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <label className="text-[11px] font-bold text-zinc-700 ml-1 flex items-center gap-1.5">
      {label}
      {optional && <span className="text-zinc-300 font-normal">(opsional)</span>}
    </label>
  );
}

function InputBase({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all ${className}`}
    />
  );
}

function ImageAnalysisResult({ analysis }: { analysis: AnalysisResult }) {
  const isValid = analysis.is_likely_authentic && analysis.relevance_score >= 90;
  const isPartial = !isValid && analysis.authenticity_score >= 70;
  const config = isValid
    ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: ShieldCheck, iconColor: 'text-emerald-500', label: 'Bukti Terverifikasi' }
    : isPartial
    ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: ShieldAlert, iconColor: 'text-amber-500', label: 'Bukti Kurang Kuat' }
    : { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: ShieldX, iconColor: 'text-red-500', label: 'Bukti Tidak Valid' };
  const Icon = config.icon;
  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} overflow-hidden`}>
      <div className={`px-4 py-3 flex items-center gap-2.5 border-b ${config.border}`}>
        <Icon className={`w-4 h-4 ${config.iconColor} shrink-0`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>{config.label}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className={`text-[10px] font-semibold ${config.text}`}>Keaslian <span className="font-black">{analysis.authenticity_score}%</span></span>
          <span className={`text-[10px] font-semibold ${config.text}`}>Relevansi <span className="font-black">{analysis.relevance_score}%</span></span>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <p className={`text-xs leading-relaxed ${config.text}`}>{analysis.summary}</p>
        {analysis.red_flags?.length > 0 && (
          <ul className="space-y-1">
            {analysis.red_flags.map((flag, i) => (
              <li key={i} className={`text-[11px] ${config.text} flex items-start gap-1.5`}>
                <span className="mt-0.5 shrink-0">•</span> {flag}
              </li>
            ))}
          </ul>
        )}
        {!isValid && (
          <div className={`flex items-start gap-2 pt-1 border-t ${config.border}`}>
            <Info className={`w-3.5 h-3.5 ${config.iconColor} shrink-0 mt-0.5`} />
            <p className={`text-[11px] ${config.text} leading-relaxed`}>
              {analysis.relevance_score < 90
                ? 'Upload bukti yang lebih relevan seperti screenshot percakapan, struk transfer, atau bukti pembayaran.'
                : 'Foto terdeteksi memiliki indikasi editan. Pastikan bukti yang dilampirkan adalah asli.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TextAnalysisResult({ analysis }: { analysis: { risk_level: string; chronology_score: number; analysis: string; suggested_category: string | null } }) {
  const isHigh = analysis.risk_level === 'high';
  const isMedium = analysis.risk_level === 'medium';
  const config = isHigh
    ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-700 border-red-200', label: 'Risiko Tinggi', score: 'text-red-600' }
    : isMedium
    ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Risiko Sedang', score: 'text-amber-600' }
    : { bg: 'bg-zinc-50', border: 'border-zinc-200', text: 'text-zinc-700', badge: 'bg-zinc-100 text-zinc-600 border-zinc-200', label: 'Risiko Rendah', score: 'text-zinc-500' };
  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} overflow-hidden`}>
      <div className={`px-4 py-3 flex items-center gap-2.5 border-b ${config.border}`}>
        <Brain className={`w-4 h-4 ${config.score} shrink-0`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>Hasil Analisis Kronologi</span>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${config.badge}`}>{config.label}</span>
          <span className={`text-[10px] font-black ${config.score}`}>Skor {analysis.chronology_score}/100</span>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <p className={`text-xs leading-relaxed ${config.text}`}>{analysis.analysis}</p>
        {analysis.suggested_category && (
          <div className={`flex items-center gap-2 pt-1 border-t ${config.border}`}>
            <Info className={`w-3.5 h-3.5 ${config.score} shrink-0`} />
            <p className={`text-[11px] ${config.text}`}>Kategori yang disarankan: <span className="font-bold">{analysis.suggested_category}</span></p>
          </div>
        )}
        {!isHigh && (
          <div className={`flex items-start gap-2 pt-1 border-t ${config.border}`}>
            <Info className={`w-3.5 h-3.5 ${config.score} shrink-0 mt-0.5`} />
            <p className={`text-[11px] ${config.text} leading-relaxed`}>
              Lengkapi kronologi dengan detail seperti nominal kerugian, tanggal kejadian, identitas pelaku, dan platform transaksi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AUTH HELPER ────────────────────────────────────────────────────────────────
async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ReportForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    target_number: '',
    target_name: '',
    target_type: 'phone' as TargetType,
    category: 'Jual Beli Online',
    chronology: '',
    bank_name: '',
    ewallet_name: '',
    loss_amount: '',
    incident_date: '',
    platform: '',
    link_url: '',
    social_media_accounts: [''],
    has_other_victims: '' as '' | 'yes' | 'no',
    reported_to: [] as string[],
  });

  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [textAnalysis, setTextAnalysis] = useState<{ risk_level: string; chronology_score: number; analysis: string; suggested_category: string | null } | null>(null);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [suspectPhoto, setSuspectPhoto] = useState<File | null>(null);
  const [suspectPhotoPreview, setSuspectPhotoPreview] = useState<string | null>(null);

  // ── Upload progress state untuk multi-foto ──────────────────────────────────
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const chronologyProgress = Math.min((formData.chronology.length / 150) * 100, 100);

  // ── STEP NAVIGATION ─────────────────────────────────────────────────────────
  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1 && !formData.target_number.trim()) {
      setError('Nomor HP atau rekening wajib diisi.');
      return;
    }
    if (currentStep === 2 && formData.chronology.trim().length < 20) {
      setError('Kronologi minimal 20 karakter.');
      return;
    }
    setCurrentStep(s => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── EVIDENCE FILES HANDLER ──────────────────────────────────────────────────
  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_EVIDENCE_FILES - evidenceFiles.length;
    const toAdd = files.slice(0, remaining);
    const oversized = toAdd.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) { setError(`${oversized.length} file melebihi batas ukuran 5MB per file.`); return; }
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidenceFiles(prev => [...prev, { file, preview: reader.result as string, analysis: null, isAnalyzing: false }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeEvidenceFile = (index: number) => setEvidenceFiles(prev => prev.filter((_, i) => i !== index));

  // ── AI IMAGE ANALYSIS ───────────────────────────────────────────────────────
  const handleAIImageAnalysis = async (index: number) => {
    const item = evidenceFiles[index];
    if (!item) return;
    setEvidenceFiles(prev => prev.map((f, i) => i === index ? { ...f, isAnalyzing: true } : f));
    try {
      const token = await getAuthToken();
      if (!token) { setError('Sesi habis. Silakan login ulang.'); return; }
      const fd = new FormData();
      fd.append('file', item.file);
      const res = await fetch(`${BACKEND_URL}/api/reports/analyze/image`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd,
      });
      const result = await res.json();
      if (result.success && result.data) {
        setEvidenceFiles(prev => prev.map((f, i) => i === index ? { ...f, analysis: result.data, isAnalyzing: false } : f));
      } else {
        setError(result.message || 'Gagal menganalisis gambar.');
        setEvidenceFiles(prev => prev.map((f, i) => i === index ? { ...f, isAnalyzing: false } : f));
      }
    } catch {
      setError('Gagal menganalisis gambar. Periksa koneksi dan coba lagi.');
      setEvidenceFiles(prev => prev.map((f, i) => i === index ? { ...f, isAnalyzing: false } : f));
    }
  };

  // ── AI TEXT ANALYSIS ────────────────────────────────────────────────────────
  const handleAITextAnalysis = async () => {
    if (formData.chronology.trim().length < 20) return;
    setIsAnalyzingText(true);
    try {
      const token = await getAuthToken();
      if (!token) { setError('Sesi habis. Silakan login ulang.'); return; }
      const res = await fetch(`${BACKEND_URL}/api/reports/analyze/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ chronology: formData.chronology }),
      });
      const result = await res.json();
      if (result.success) setTextAnalysis(result.data);
      else setError(result.message || 'Gagal menganalisis kronologi.');
    } catch { setError('Gagal menganalisis kronologi. Periksa koneksi dan coba lagi.'); }
    finally { setIsAnalyzingText(false); }
  };

  // ── SUSPECT PHOTO ───────────────────────────────────────────────────────────
  const handleSuspectPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > 5 * 1024 * 1024) { setError('Ukuran foto profil melebihi batas 5MB.'); return; }
    setSuspectPhoto(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setSuspectPhotoPreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else setSuspectPhotoPreview(null);
  };

  // ── SOCIAL MEDIA FIELDS ─────────────────────────────────────────────────────
  const addSocialField = () => setFormData(f => ({ ...f, social_media_accounts: [...f.social_media_accounts, ''] }));
  const removeSocialField = (i: number) => setFormData(f => ({ ...f, social_media_accounts: f.social_media_accounts.filter((_, idx) => idx !== i) }));
  const updateSocialField = (i: number, val: string) => setFormData(f => { const arr = [...f.social_media_accounts]; arr[i] = val; return { ...f, social_media_accounts: arr }; });
  const toggleReportedTo = (val: string) => setFormData(f => ({ ...f, reported_to: f.reported_to.includes(val) ? f.reported_to.filter(v => v !== val) : [...f.reported_to, val] }));

  // ── UPLOAD HELPER ───────────────────────────────────────────────────────────
  const uploadFile = async (file: File, token: string): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${BACKEND_URL}/api/reports/upload`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd,
    });
    const data = await res.json();
    return data.success ? data.url : null;
  };

  // ── SUBMIT — FIX: upload SEMUA foto, kirim evidence_urls array ──────────────
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(null);
    try {
      const token = await getAuthToken();
      if (!token) { setError('Sesi habis. Silakan login ulang.'); setIsLoading(false); return; }

      // ── Upload SEMUA foto bukti satu per satu ───────────────────────────────
      const uploadedUrls: string[] = [];
      if (evidenceFiles.length > 0) {
        for (let i = 0; i < evidenceFiles.length; i++) {
          setUploadProgress(`Mengupload foto ${i + 1} dari ${evidenceFiles.length}...`);
          const url = await uploadFile(evidenceFiles[i].file, token);
          if (url) uploadedUrls.push(url);
        }
        setUploadProgress('Mengirim laporan...');
      }

      // ── Upload foto profil penipu ───────────────────────────────────────────
      let suspectPhotoUrl: string | null = null;
      if (suspectPhoto) suspectPhotoUrl = await uploadFile(suspectPhoto, token);

      // ── Ambil hasil scan AI dari foto yang sudah dianalisis ─────────────────
      const scannedFile = evidenceFiles.find(f => f.analysis !== null);
      const aiPhotoResult: PhotoScanPayload | null = scannedFile?.analysis
        ? {
            authenticity_score: scannedFile.analysis.authenticity_score,
            relevance_score: scannedFile.analysis.relevance_score,
            has_concrete_evidence: scannedFile.analysis.has_concrete_evidence,
            is_likely_authentic: scannedFile.analysis.is_likely_authentic,
          }
        : null;

      const providerName =
        formData.target_type === 'bank_account' ? formData.bank_name
        : formData.target_type === 'ewallet' ? formData.ewallet_name
        : null;

      // ── Kirim ke backend — evidence_urls (array) + evidence_url (backward compat) ──
      const res = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          target_number: formData.target_number,
          target_name: formData.target_name || null,
          target_type: formData.target_type,
          category: formData.category,
          chronology: formData.chronology,
          evidence_url: uploadedUrls[0] || null,       // backward compat — foto pertama
          evidence_urls: uploadedUrls,                  // NEW — semua foto
          bank_name: providerName || null,
          loss_amount: formData.loss_amount ? parseInt(formData.loss_amount.replace(/\D/g, ''), 10) : null,
          incident_date: formData.incident_date || null,
          platform: formData.platform || null,
          link_url: formData.link_url || null,
          ai_photo_result: aiPhotoResult,
          social_media_accounts: formData.social_media_accounts.filter(Boolean),
          has_other_victims: formData.has_other_victims || null,
          reported_to: formData.reported_to,
          suspect_photo_url: suspectPhotoUrl,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => router.push(`/check/${result.slug}`), 1500);
      } else setError(result.message || 'Gagal mengirim laporan.');
    } catch { setError('Terjadi kesalahan. Periksa koneksi internet dan coba lagi.'); }
    finally { setIsLoading(false); setUploadProgress(null); }
  };

  // ── SUCCESS STATE ───────────────────────────────────────────────────────────
  if (isSuccess)
    return (
      <div className="text-center py-20">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-zinc-900">Laporan Berhasil Dikirim</h3>
        <p className="text-zinc-400 text-sm mt-1">Sedang mengalihkan ke halaman detail laporan...</p>
      </div>
    );

  const tips = TIPS[currentStep];

  return (
    <div className="space-y-6">

      {/* ── PROGRESS STEPS ── */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isDone = currentStep > step.number;
          const isActive = currentStep === step.number;
          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone ? 'bg-emerald-500 text-white'
                  : isActive ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                  isActive ? 'text-zinc-900' : isDone ? 'text-emerald-500' : 'text-zinc-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${currentStep > step.number ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── LAYOUT: FORM + SIDEBAR ── */}
      <div className="flex gap-6 items-start">

        {/* ── FORM — tidak pakai <form> untuk cegah auto submit ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* ── STEP 1: DATA PENIPU ── */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">

              <div className="space-y-3">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">Jenis Laporan</label>
                <div className="bg-zinc-100 p-1 rounded-2xl flex gap-1">
                  {[
                    { id: 'phone', label: 'HP / WA', icon: Phone },
                    { id: 'bank_account', label: 'Rekening', icon: Building2 },
                    { id: 'ewallet', label: 'E-Wallet', icon: Wallet },
                  ].map((item) => (
                    <button key={item.id} type="button" onClick={() => setFormData({ ...formData, target_type: item.id as TargetType })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${formData.target_type === item.id ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200' : 'text-zinc-500 hover:text-zinc-800'}`}>
                      <item.icon className={`w-3.5 h-3.5 shrink-0 ${formData.target_type === item.id ? 'text-zinc-900' : 'text-zinc-400'}`} />
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.target_type !== 'phone' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <FieldLabel label={`Pilih ${formData.target_type === 'bank_account' ? 'Bank' : 'Layanan'}`} />
                  <div className="relative">
                    <select value={formData.target_type === 'bank_account' ? formData.bank_name : formData.ewallet_name}
                      onChange={(e) => setFormData({ ...formData, [formData.target_type === 'bank_account' ? 'bank_name' : 'ewallet_name']: e.target.value })}
                      className="w-full pl-4 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none appearance-none">
                      <option value="">Pilih...</option>
                      {(formData.target_type === 'bank_account' ? bankList : ewalletList).map(item => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </motion.div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel label={`Nomor ${formData.target_type === 'phone' ? 'HP / WA' : 'Rekening'}`} />
                  <InputBase type="text" value={formData.target_number}
                    onChange={(e) => setFormData({ ...formData, target_number: e.target.value.replace(/[^0-9+]/g, '') })}
                    placeholder={formData.target_type === 'phone' ? '0812...' : '12345678...'} />
                </div>
                <div className="space-y-2">
                  <FieldLabel label="Nama Pemilik" optional />
                  <InputBase type="text" value={formData.target_name}
                    onChange={(e) => setFormData({ ...formData, target_name: e.target.value })}
                    placeholder="Budi Santoso" />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel label="Akun Media Sosial Penipu" optional />
                <p className="text-[10px] text-zinc-400 font-medium ml-1 -mt-1">Instagram, TikTok, Facebook, Telegram, dll.</p>
                <div className="space-y-2">
                  {formData.social_media_accounts.map((val, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold select-none">@</span>
                        <input type="text" value={val} onChange={(e) => updateSocialField(i, e.target.value)} placeholder="username atau link profil"
                          className="w-full pl-7 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all" />
                      </div>
                      {formData.social_media_accounts.length > 1 && (
                        <button type="button" onClick={() => removeSocialField(i)} className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.social_media_accounts.length < 4 && (
                    <button type="button" onClick={addSocialField} className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors mt-1 ml-1">
                      <Plus className="w-3.5 h-3.5" /> Tambah akun lain
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel label="Foto Profil / Identitas Visual Penipu" optional />
                {!suspectPhotoPreview ? (
                  <label className="group border-2 border-dashed border-zinc-200 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-400 hover:bg-zinc-50 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0"><Upload className="w-4 h-4 text-zinc-400" /></div>
                    <div><p className="text-xs font-bold text-zinc-600">Upload foto penipu</p><p className="text-[10px] text-zinc-400 font-medium">JPG, PNG · maks 5MB</p></div>
                    <input type="file" onChange={handleSuspectPhotoChange} className="hidden" accept="image/*" />
                  </label>
                ) : (
                  <div className="relative inline-block">
                    <img src={suspectPhotoPreview} alt="Foto penipu" className="w-24 h-24 object-cover rounded-2xl border border-zinc-200" />
                    <button type="button" onClick={() => { setSuspectPhoto(null); setSuspectPhotoPreview(null); }}
                      className="absolute -top-2 -right-2 p-1 bg-zinc-900 text-white rounded-full hover:bg-red-600 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel label="Kategori Penipuan" />
                <div className="relative">
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full pl-4 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold appearance-none focus:bg-white focus:border-zinc-900 outline-none transition-all">
                    {categoryList.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-zinc-100">
                <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Detail Tambahan</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <FieldLabel label="Kerugian" optional />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold select-none">Rp</span>
                      <input type="text" value={formData.loss_amount}
                        onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setFormData({ ...formData, loss_amount: val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '' }); }}
                        placeholder="0" className="w-full pl-8 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel label="Tanggal" optional />
                    <input type="date" max={new Date().toISOString().split('T')[0]} value={formData.incident_date}
                      onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                      className="w-full px-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel label="Platform" optional />
                    <div className="relative">
                      <select value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        className="w-full px-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold appearance-none focus:bg-white focus:border-zinc-900 outline-none">
                        <option value="">Pilih...</option>
                        {platformList.map(p => <option key={p.value} value={p.value}>{p.value}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel label="Link / URL" optional />
                    <InputBase type="url" value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} placeholder="https://..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel label="Ada korban lain yang kamu tahu?" optional />
                  <div className="flex gap-2">
                    {[{ val: 'yes', label: 'Ya, ada korban lain' }, { val: 'no', label: 'Hanya saya' }].map(opt => (
                      <button key={opt.val} type="button"
                        onClick={() => setFormData(f => ({ ...f, has_other_victims: f.has_other_victims === opt.val ? '' : opt.val as 'yes' | 'no' }))}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${formData.has_other_victims === opt.val ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel label="Sudah lapor ke mana?" optional />
                  <div className="grid grid-cols-2 gap-2">
                    {reportedToOptions.map(opt => {
                      const active = formData.reported_to.includes(opt.value);
                      return (
                        <button key={opt.value} type="button" onClick={() => toggleReportedTo(opt.value)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-left transition-all ${active ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: KRONOLOGI ── */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <FieldLabel label="Ceritakan apa yang terjadi" />
                  <button type="button" onClick={handleAITextAnalysis} disabled={isAnalyzingText || formData.chronology.length < 20}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-full text-[9px] font-bold text-white uppercase tracking-wider hover:bg-black disabled:opacity-30 transition-all active:scale-95">
                    {isAnalyzingText ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Analisis AI
                  </button>
                </div>
                <textarea rows={8} minLength={20} value={formData.chronology}
                  onChange={(e) => setFormData({ ...formData, chronology: e.target.value })}
                  placeholder="Ceritakan bagaimana penipuan terjadi, termasuk nominal kerugian, tanggal kejadian, dan identitas pelaku..."
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:bg-white focus:border-zinc-900 transition-all outline-none resize-none" />

                <div className="space-y-1.5">
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${chronologyProgress >= 100 ? 'bg-emerald-500' : chronologyProgress > 50 ? 'bg-amber-400' : 'bg-zinc-300'}`}
                      style={{ width: `${chronologyProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {formData.chronology.length < 150 ? 'Tambahkan lebih banyak detail' : 'Kronologi sudah cukup lengkap'}
                    </span>
                    <span className={`text-[10px] font-bold ${formData.chronology.length >= 150 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                      {formData.chronology.length} / 150 min
                    </span>
                  </div>
                </div>

                {textAnalysis && <TextAnalysisResult analysis={textAnalysis} />}
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: BUKTI FOTO ── */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <p className="text-[10px] text-zinc-400 font-medium">
                Upload hingga {MAX_EVIDENCE_FILES} foto bukti · Screenshot percakapan, struk transfer, atau bukti pembayaran · JPG, PNG · maks 5MB per file
              </p>

              {evidenceFiles.length > 0 && (
                <div className="space-y-3">
                  {evidenceFiles.map((item, index) => (
                    <div key={index} className="rounded-2xl overflow-hidden border border-zinc-200 bg-white p-2">
                      <div className="relative">
                        <img src={item.preview} alt={`Bukti ${index + 1}`} className="w-full h-40 object-cover rounded-xl" />
                        <button type="button" onClick={() => removeEvidenceFile(index)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded-lg">Foto {index + 1}</div>
                      </div>
                      <div className="mt-2 px-1 pb-1 flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[200px]">{item.file.name}</span>
                        {!item.analysis ? (
                          <button type="button" onClick={() => handleAIImageAnalysis(index)} disabled={item.isAnalyzing}
                            className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                            {item.isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-3 h-3" /> Scan AI</>}
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Sudah dianalisis
                          </span>
                        )}
                      </div>
                      {item.analysis && <div className="mt-2"><ImageAnalysisResult analysis={item.analysis} /></div>}
                    </div>
                  ))}
                </div>
              )}

              {evidenceFiles.length < MAX_EVIDENCE_FILES && (
                <label className="group border-2 border-dashed border-zinc-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-zinc-400 hover:bg-zinc-50/50 transition-all cursor-pointer">
                  <Upload className="w-6 h-6 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  <p className="text-xs font-bold text-zinc-500">
                    {evidenceFiles.length === 0 ? 'Klik untuk upload foto bukti' : `Tambah foto bukti (${evidenceFiles.length}/${MAX_EVIDENCE_FILES})`}
                  </p>
                  <p className="text-[10px] text-zinc-400">JPG, PNG · maks 5MB per file</p>
                  <input type="file" onChange={handleEvidenceFileChange} className="hidden" accept="image/*" multiple />
                </label>
              )}

              {evidenceFiles.length >= MAX_EVIDENCE_FILES && (
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <Info className="w-4 h-4 text-zinc-400 shrink-0" />
                  <p className="text-[11px] text-zinc-500 font-medium">Batas maksimal {MAX_EVIDENCE_FILES} foto bukti telah tercapai.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── NAVIGASI ── */}
          <div className={`flex gap-3 pt-6 border-t border-zinc-100 ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
            {currentStep > 1 && (
              <button type="button" onClick={handlePrevStep}
                className="flex items-center gap-2 px-5 py-3 border border-zinc-200 text-zinc-600 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-all uppercase tracking-widest">
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </button>
            )}
            {currentStep < 3 ? (
              <button type="button" onClick={handleNextStep}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all uppercase tracking-widest">
                Lanjut <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isLoading}
                className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white text-xs font-extrabold rounded-xl hover:bg-black transition-all disabled:opacity-50 uppercase tracking-widest">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {uploadProgress || 'Kirim Laporan'}
              </button>
            )}
          </div>

          {currentStep === 3 && (
            <p className="text-center text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
              Laporan divalidasi tim moderator · Identitas pelapor terlindungi
            </p>
          )}

        </div>

        {/* ── TIPS SIDEBAR ── */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
            <p className="text-[11px] font-extrabold text-zinc-900 uppercase tracking-wider">{tips.title}</p>
            <ul className="space-y-3">
              {tips.items.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t border-zinc-200">
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Identitas pelapor tidak akan ditampilkan ke publik.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}