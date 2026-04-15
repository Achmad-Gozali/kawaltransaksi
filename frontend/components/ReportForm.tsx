'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  Loader2, Upload, AlertCircle, CheckCircle2, Brain,
  Sparkles, X, Phone, Building2, Wallet, ChevronDown,
  Plus, Trash2, ShieldCheck, ShieldAlert, ShieldX, Info,
  ArrowLeft, ArrowRight, Send, ShieldEllipsis,
} from 'lucide-react';
import * as motion from 'motion/react-client';
import { uploadToStorage } from '@/lib/upload-storage';

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) throw new Error('NEXT_PUBLIC_BACKEND_URL belum dikonfigurasi.');
  return url;
})();

const MAX_EVIDENCE_FILES = 10;
const MAX_TARGET_NUMBERS = 5;

const bankList = [
  // Bank BUMN
  { value: 'BCA', label: 'BCA (Bank Central Asia)' },
  { value: 'BRI', label: 'BRI (Bank Rakyat Indonesia)' },
  { value: 'BNI', label: 'BNI (Bank Negara Indonesia)' },
  { value: 'Mandiri', label: 'Bank Mandiri' },
  { value: 'BTN', label: 'BTN (Bank Tabungan Negara)' },
  { value: 'BSI', label: 'BSI (Bank Syariah Indonesia)' },
  // Bank Swasta Besar
  { value: 'CIMB Niaga', label: 'CIMB Niaga' },
  { value: 'Danamon', label: 'Bank Danamon' },
  { value: 'Permata', label: 'Bank Permata' },
  { value: 'OCBC NISP', label: 'OCBC NISP' },
  { value: 'Panin', label: 'Bank Panin' },
  { value: 'Mega', label: 'Bank Mega' },
  { value: 'Maybank', label: 'Maybank Indonesia' },
  { value: 'Sinarmas', label: 'Bank Sinarmas' },
  { value: 'BTPN', label: 'BTPN (Jenius)' },
  { value: 'Bukopin', label: 'Bank Bukopin' },
  { value: 'Commonwealth', label: 'Commonwealth Bank' },
  { value: 'UOB', label: 'UOB Indonesia' },
  { value: 'HSBC', label: 'HSBC Indonesia' },
  // Bank Digital
  { value: 'Jago', label: 'Bank Jago' },
  { value: 'SeaBank', label: 'SeaBank' },
  { value: 'Blu BCA', label: 'Blu by BCA Digital' },
  { value: 'Motion Banking', label: 'Motion Banking (MNC Bank)' },
  { value: 'Neo Commerce', label: 'Bank Neo Commerce' },
  { value: 'Allo Bank', label: 'Allo Bank' },
  { value: 'Superbank', label: 'Superbank' },
  // Bank Daerah
  { value: 'BJB', label: 'BJB (Bank Jabar Banten)' },
  { value: 'Bank DKI', label: 'Bank DKI' },
  { value: 'BPD Jateng', label: 'BPD Jawa Tengah' },
  { value: 'BPD Jatim', label: 'BPD Jawa Timur' },
  { value: 'BPD Bali', label: 'BPD Bali' },
  { value: 'Lainnya', label: 'Bank Lainnya' },
];

const ewalletList = [
  // E-Wallet Utama
  { value: 'GoPay', label: 'GoPay' },
  { value: 'Dana', label: 'DANA' },
  { value: 'OVO', label: 'OVO' },
  { value: 'ShopeePay', label: 'ShopeePay' },
  { value: 'LinkAja', label: 'LinkAja' },
  // E-Wallet Lain
  { value: 'iSaku', label: 'iSaku' },
  { value: 'DOKU', label: 'DOKU Wallet' },
  { value: 'Sakuku', label: 'Sakuku (BCA)' },
  { value: 'TrueMoney', label: 'TrueMoney' },
  { value: 'Flip', label: 'Flip' },
  { value: 'PayLater Shopee', label: 'PayLater Shopee' },
  { value: 'PayLater Tokopedia', label: 'PayLater Tokopedia' },
  { value: 'Akulaku', label: 'Akulaku' },
  { value: 'Kredivo', label: 'Kredivo' },
  { value: 'Lainnya', label: 'E-Wallet Lainnya' },
];

const platformList = [
  // Pesan & Chat
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Telegram', label: 'Telegram' },
  { value: 'SMS', label: 'SMS' },
  { value: 'Telepon', label: 'Telepon langsung' },
  // Media Sosial
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook / Marketplace' },
  { value: 'TikTok', label: 'TikTok / TikTok Shop' },
  { value: 'Twitter/X', label: 'Twitter / X' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  // Marketplace
  { value: 'Tokopedia', label: 'Tokopedia' },
  { value: 'Shopee', label: 'Shopee' },
  { value: 'Lazada', label: 'Lazada' },
  { value: 'Bukalapak', label: 'Bukalapak' },
  { value: 'OLX', label: 'OLX / Jual Beli Online' },
  // Lainnya
  { value: 'Email', label: 'Email' },
  { value: 'Website', label: 'Website / Toko Online' },
  { value: 'Lainnya', label: 'Platform Lainnya' },
];

const categoryList = [
  // Paling umum
  { value: 'Jual Beli Online', label: 'Jual Beli Online — barang tidak dikirim / tidak sesuai' },
  { value: 'Investasi Bodong', label: 'Investasi Bodong — janji untung besar tapi uang raib' },
  { value: 'Pinjaman Online', label: 'Pinjaman Online Ilegal — bunga mencekik / penagihan kasar' },
  { value: 'Phishing / Soceng', label: 'Phishing / Soceng — minta OTP, PIN, atau data pribadi' },
  { value: 'Modus Kurir/APK', label: 'Modus Kurir / File APK — disuruh install aplikasi mencurigakan' },
  // Tambahan
  { value: 'Arisan Online', label: 'Arisan Online Fiktif — uang arisan tidak dibayar' },
  { value: 'Rental / Sewa Fiktif', label: 'Rental / Sewa Fiktif — kendaraan atau properti tidak ada' },
  { value: 'Lowongan Kerja Palsu', label: 'Lowongan Kerja Palsu — minta uang pelatihan / seragam' },
  { value: 'Pinjam Uang Tidak Bayar', label: 'Pinjam Uang Tidak Bayar — kenalan / teman online kabur' },
  { value: 'Hadiah / Undian Palsu', label: 'Hadiah / Undian Palsu — minta bayar pajak hadiah duluan' },
  { value: 'Jasa Tidak Dikerjakan', label: 'Jasa Tidak Dikerjakan — sudah bayar tapi tidak ada hasilnya' },
  { value: 'Penipuan Percintaan', label: 'Penipuan Percintaan — kenalan online lalu minta uang' },
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
  { number: 3, label: 'Bukti & Kirim' },
];

type TargetType = 'phone' | 'bank_account' | 'ewallet';

// Satu entry nomor (primary atau additional)
interface TargetEntry {
  number: string;
  name: string;
  type: TargetType;
  bank_name: string;
  ewallet_name: string;
}

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

// ── UI PRIMITIVES ─────────────────────────────────────────────────────────────
function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p className="text-sm font-semibold text-slate-700 mb-2">
      {children}
      {optional && <span className="ml-1.5 text-slate-300 font-normal text-xs">(opsional)</span>}
    </p>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 placeholder:text-slate-300 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all ${className}`}
    />
  );
}

function Sel({ children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none appearance-none transition-all ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ── TARGET ENTRY CARD ─────────────────────────────────────────────────────────
function TargetEntryCard({
  entry,
  index,
  isPrimary,
  onChange,
  onRemove,
}: {
  entry: TargetEntry;
  index: number;
  isPrimary: boolean;
  onChange: (updated: TargetEntry) => void;
  onRemove?: () => void;
}) {
  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${isPrimary ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isPrimary ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {isPrimary ? 'Nomor Utama' : `Nomor Tambahan ${index}`}
          </span>
        </div>
        {!isPrimary && onRemove && (
          <button type="button" onClick={onRemove}
            className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tipe */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
        {[
          { id: 'phone', label: 'HP / WA', icon: Phone },
          { id: 'bank_account', label: 'Rekening', icon: Building2 },
          { id: 'ewallet', label: 'E-Wallet', icon: Wallet },
        ].map((item) => (
          <button key={item.id} type="button"
            onClick={() => onChange({ ...entry, type: item.id as TargetType })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              entry.type === item.id
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}>
            <item.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Bank/Ewallet selector */}
      {entry.type !== 'phone' && (
        <Sel
          value={entry.type === 'bank_account' ? entry.bank_name : entry.ewallet_name}
          onChange={(e) => onChange({ ...entry, [entry.type === 'bank_account' ? 'bank_name' : 'ewallet_name']: e.target.value })}>
          <option value="">Pilih {entry.type === 'bank_account' ? 'bank' : 'e-wallet'}...</option>
          {(entry.type === 'bank_account' ? bankList : ewalletList).map(item => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </Sel>
      )}

      {/* Nomor + Nama */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Nomor {entry.type === 'phone' ? 'HP / WA' : entry.type === 'bank_account' ? 'Rekening' : 'E-Wallet'}</Label>
          <Input
            type="text"
            value={entry.number}
            onChange={(e) => onChange({ ...entry, number: e.target.value.replace(/[^0-9+]/g, '') })}
            placeholder={entry.type === 'phone' ? '0812xxxxxxxx' : '12345678...'}
          />
        </div>
        <div>
          <Label optional>Nama Pemilik</Label>
          <Input
            type="text"
            value={entry.name}
            onChange={(e) => onChange({ ...entry, name: e.target.value })}
            placeholder="Budi Santoso"
          />
        </div>
      </div>
    </div>
  );
}

// ── ANALYSIS RESULTS ──────────────────────────────────────────────────────────
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
    <div className={`rounded-xl border ${config.bg} ${config.border} mt-3 overflow-hidden`}>
      <div className={`px-4 py-3 flex items-center gap-2 border-b ${config.border}`}>
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
        <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>
        <span className={`ml-auto text-xs ${config.text}`}>
          Keaslian <b>{analysis.authenticity_score}%</b> · Relevansi <b>{analysis.relevance_score}%</b>
        </span>
      </div>
      <div className="px-4 py-3">
        <p className={`text-sm leading-relaxed ${config.text}`}>{analysis.summary}</p>
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
    : { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Risiko Rendah', score: 'text-slate-500' };
  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} mt-4 overflow-hidden`}>
      <div className={`px-4 py-3 flex items-center gap-2 border-b ${config.border}`}>
        <Brain className={`w-4 h-4 ${config.score}`} />
        <span className={`text-sm font-semibold ${config.text}`}>Hasil Analisis AI</span>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${config.badge}`}>{config.label}</span>
          <span className={`text-sm font-bold ${config.score}`}>{analysis.chronology_score}/100</span>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className={`text-sm leading-relaxed ${config.text}`}>{analysis.analysis}</p>
        {analysis.suggested_category && (
          <div className={`flex items-center gap-2 pt-2 border-t ${config.border}`}>
            <Info className={`w-3.5 h-3.5 ${config.score}`} />
            <p className={`text-sm ${config.text}`}>Kategori disarankan: <b>{analysis.suggested_category}</b></p>
          </div>
        )}
      </div>
    </div>
  );
}

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

const defaultEntry = (): TargetEntry => ({
  number: '', name: '', type: 'phone', bank_name: '', ewallet_name: '',
});

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ReportForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();

  // Multiple target numbers — index 0 = primary
  const [targets, setTargets] = useState<TargetEntry[]>([defaultEntry()]);

  const [formData, setFormData] = useState({
    category: 'Jual Beli Online',
    chronology: '',
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
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const chronologyProgress = Math.min((formData.chronology.length / 150) * 100, 100);

  // ── Target handlers ───────────────────────────────────────────────────────
  const updateTarget = (index: number, updated: TargetEntry) => {
    setTargets(prev => prev.map((t, i) => i === index ? updated : t));
  };

  const addTarget = () => {
    if (targets.length >= MAX_TARGET_NUMBERS) return;
    setTargets(prev => [...prev, defaultEntry()]);
  };

  const removeTarget = (index: number) => {
    setTargets(prev => prev.filter((_, i) => i !== index));
  };

  // ── Step navigation ───────────────────────────────────────────────────────
  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!targets[0].number.trim()) {
        setError('Nomor HP atau rekening utama wajib diisi.');
        return;
      }
      // Cek nomor tambahan yang tidak diisi
      const emptyAdditional = targets.slice(1).some(t => !t.number.trim());
      if (emptyAdditional) {
        setError('Nomor tambahan yang ditambahkan wajib diisi, atau hapus jika tidak perlu.');
        return;
      }
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

  // ── Evidence handlers ─────────────────────────────────────────────────────
  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_EVIDENCE_FILES - evidenceFiles.length;
    const toAdd = files.slice(0, remaining);
    const oversized = toAdd.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) { setError(`${oversized.length} file melebihi batas 5MB.`); return; }
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setEvidenceFiles(prev => [...prev, { file, preview: reader.result as string, analysis: null, isAnalyzing: false }]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeEvidenceFile = (index: number) => setEvidenceFiles(prev => prev.filter((_, i) => i !== index));

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
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const result = await res.json();
      if (result.success && result.data) {
        setEvidenceFiles(prev => prev.map((f, i) => i === index ? { ...f, analysis: result.data, isAnalyzing: false } : f));
      } else {
        setError(result.message || 'Gagal menganalisis gambar.');
        setEvidenceFiles(prev => prev.map((f, i) => i === index ? { ...f, isAnalyzing: false } : f));
      }
    } catch {
      setError('Gagal menganalisis gambar.');
      setEvidenceFiles(prev => prev.map((f, i) => i === index ? { ...f, isAnalyzing: false } : f));
    }
  };

  const handleAITextAnalysis = async () => {
    if (formData.chronology.trim().length < 20) return;
    setIsAnalyzingText(true);
    try {
      const token = await getAuthToken();
      if (!token) { setError('Sesi habis.'); return; }
      const res = await fetch(`${BACKEND_URL}/api/reports/analyze/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chronology: formData.chronology }),
      });
      const result = await res.json();
      if (result.success) setTextAnalysis(result.data);
      else setError(result.message || 'Gagal menganalisis.');
    } catch { setError('Gagal menganalisis kronologi.'); }
    finally { setIsAnalyzingText(false); }
  };

  const handleSuspectPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > 5 * 1024 * 1024) { setError('Ukuran foto melebihi 5MB.'); return; }
    setSuspectPhoto(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setSuspectPhotoPreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else setSuspectPhotoPreview(null);
  };

  const addSocialField = () => setFormData(f => ({ ...f, social_media_accounts: [...f.social_media_accounts, ''] }));
  const removeSocialField = (i: number) => setFormData(f => ({ ...f, social_media_accounts: f.social_media_accounts.filter((_, idx) => idx !== i) }));
  const updateSocialField = (i: number, val: string) => setFormData(f => { const arr = [...f.social_media_accounts]; arr[i] = val; return { ...f, social_media_accounts: arr }; });
  const toggleReportedTo = (val: string) => setFormData(f => ({ ...f, reported_to: f.reported_to.includes(val) ? f.reported_to.filter(v => v !== val) : [...f.reported_to, val] }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!turnstileToken) { setError('Selesaikan verifikasi keamanan terlebih dahulu.'); return; }
    setIsLoading(true); setError(null); setUploadProgress(null);
    try {
      const token = await getAuthToken();
      if (!token) { setError('Sesi habis. Silakan login ulang.'); setIsLoading(false); return; }

      const uploadedUrls: string[] = [];
      for (let i = 0; i < evidenceFiles.length; i++) {
        setUploadProgress(`Mengupload foto ${i + 1} dari ${evidenceFiles.length}...`);
        try { uploadedUrls.push(await uploadToStorage(evidenceFiles[i].file)); }
        catch (err) { setError(err instanceof Error ? err.message : 'Gagal upload foto.'); setIsLoading(false); return; }
      }

      let suspectPhotoUrl: string | null = null;
      if (suspectPhoto) {
        setUploadProgress('Mengupload foto profil penipu...');
        try { suspectPhotoUrl = await uploadToStorage(suspectPhoto); }
        catch (err) { setError(err instanceof Error ? err.message : 'Gagal upload foto profil.'); setIsLoading(false); return; }
      }

      const scannedFile = evidenceFiles.find(f => f.analysis !== null);
      const aiPhotoResult: PhotoScanPayload | null = scannedFile?.analysis
        ? { authenticity_score: scannedFile.analysis.authenticity_score, relevance_score: scannedFile.analysis.relevance_score, has_concrete_evidence: scannedFile.analysis.has_concrete_evidence, is_likely_authentic: scannedFile.analysis.is_likely_authentic }
        : null;

      const primary = targets[0];
      const providerName = primary.type === 'bank_account' ? primary.bank_name
        : primary.type === 'ewallet' ? primary.ewallet_name : null;

      // Semua nomor sebagai array (termasuk primary)
      // Kirim sebagai array object { number, type, bank } — sesuai format JSONB baru
      const allNumbers = targets
        .map(t => ({
          number: t.number.trim(),
          type: t.type,
          bank: t.type === 'bank_account' ? t.bank_name || null
              : t.type === 'ewallet' ? t.ewallet_name || null
              : null,
          name: t.name.trim() || null,
        }))
        .filter(t => t.number.length > 0);

      setUploadProgress('Mengirim laporan...');
      const res = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          // Primary (existing fields)
          target_number: primary.number,
          target_name: primary.name || null,
          target_type: primary.type,
          bank_name: providerName || null,
          // Semua nomor terkait (new field)
          target_numbers: allNumbers,
          // Form fields
          category: formData.category,
          chronology: formData.chronology,
          evidence_url: uploadedUrls[0] || null,
          evidence_urls: uploadedUrls,
          loss_amount: formData.loss_amount ? parseInt(formData.loss_amount.replace(/\D/g, ''), 10) : null,
          incident_date: formData.incident_date || null,
          platform: formData.platform || null,
          link_url: formData.link_url || null,
          ai_photo_result: aiPhotoResult,
          social_media_accounts: formData.social_media_accounts.filter(Boolean),
          has_other_victims: formData.has_other_victims || null,
          reported_to: formData.reported_to,
          suspect_photo_url: suspectPhotoUrl,
          turnstile_token: turnstileToken,
        }),
      });

      const result = await res.json();
      if (result.success) { setIsSuccess(true); setTimeout(() => router.push(`/check/${result.slug}`), 1500); }
      else setError(result.message || 'Gagal mengirim laporan.');
    } catch { setError('Terjadi kesalahan. Periksa koneksi dan coba lagi.'); }
    finally { setIsLoading(false); setUploadProgress(null); }
  };

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (isSuccess) return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Laporan Berhasil Dikirim!</h3>
      <p className="text-slate-400">Mengalihkan ke halaman detail laporan...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── STEP INDICATOR ── */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isDone = currentStep > step.number;
          const isActive = currentStep === step.number;
          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDone ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                  : isActive ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-300 border-2 border-slate-100'
                }`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : step.number}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wide whitespace-nowrap transition-colors ${
                  isActive ? 'text-slate-900' : isDone ? 'text-emerald-500' : 'text-slate-300'
                }`}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-0 transition-all duration-500 ${currentStep > step.number ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ══════════════ STEP 1 ══════════════ */}
      {currentStep === 1 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">

          {/* Multiple nomor */}
          <Card>
            <div className="p-6">
              <SectionTitle
                title="Nomor Penipu"
                subtitle={`Tambahkan semua nomor terkait pelaku yang sama — maks ${MAX_TARGET_NUMBERS} nomor`}
              />
              <div className="space-y-3">
                {targets.map((entry, index) => (
                  <TargetEntryCard
                    key={index}
                    entry={entry}
                    index={index}
                    isPrimary={index === 0}
                    onChange={(updated) => updateTarget(index, updated)}
                    onRemove={index > 0 ? () => removeTarget(index) : undefined}
                  />
                ))}
              </div>

              {targets.length < MAX_TARGET_NUMBERS && (
                <button type="button" onClick={addTarget}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all">
                  <Plus className="w-4 h-4" />
                  Tambah Nomor Lain ({targets.length}/{MAX_TARGET_NUMBERS})
                </button>
              )}
            </div>
          </Card>

          {/* Akun sosmed */}
          <Card>
            <div className="p-6">
              <SectionTitle title="Akun Media Sosial Penipu" subtitle="Instagram, TikTok, Facebook, Telegram, dll." />
              <div className="space-y-3">
                {formData.social_media_accounts.map((val, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-base font-medium select-none">@</span>
                      <input type="text" value={val} onChange={(e) => updateSocialField(i, e.target.value)}
                        placeholder="username atau link profil"
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 placeholder:text-slate-300 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all" />
                    </div>
                    {formData.social_media_accounts.length > 1 && (
                      <button type="button" onClick={() => removeSocialField(i)}
                        className="p-3 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-xl border border-slate-200 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {formData.social_media_accounts.length < 4 && (
                  <button type="button" onClick={addSocialField}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-600 transition-colors mt-1">
                    <Plus className="w-4 h-4" /> Tambah akun lain
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Foto penipu */}
          <Card>
            <div className="p-6">
              <SectionTitle title="Foto Profil Penipu" subtitle="Upload foto identitas visual pelaku jika ada" />
              {!suspectPhotoPreview ? (
                <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                    <Upload className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">Klik untuk upload foto penipu</p>
                    <p className="text-xs text-slate-300 mt-1">JPG, PNG · maks 5MB</p>
                  </div>
                  <input type="file" onChange={handleSuspectPhotoChange} className="hidden" accept="image/*" />
                </label>
              ) : (
                <div className="relative inline-block">
                  <div className="relative w-24 h-24">
                    <Image src={suspectPhotoPreview} alt="Foto penipu" fill className="object-cover rounded-2xl border border-slate-200" unoptimized />
                  </div>
                  <button type="button" onClick={() => { setSuspectPhoto(null); setSuspectPhotoPreview(null); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-sm">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Kategori */}
          <Card>
            <div className="p-6">
              <Label>Kategori Penipuan</Label>
              <Sel value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                {categoryList.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </Sel>
            </div>
          </Card>

          {/* Detail tambahan */}
          <Card>
            <div className="p-6">
              <SectionTitle title="Detail Tambahan" subtitle="Opsional — semakin lengkap semakin cepat diverifikasi" />
              <div className="grid grid-cols-2 gap-4 mb-6 items-end">
                <div>
                  <Label optional>Kerugian</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold select-none">Rp</span>
                    <input type="text" value={formData.loss_amount}
                      onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setFormData({ ...formData, loss_amount: val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '' }); }}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 placeholder:text-slate-300 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <Label optional>Tanggal Kejadian</Label>
                    <input
                      type="date"
                        max={new Date().toISOString().split('T')[0]}
                          value={formData.incident_date}
                        onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all [&::-webkit-datetime-edit]:text-slate-800 [&::-webkit-date-and-time-value]:text-slate-800 ${
                    !formData.incident_date ? 'text-slate-300' : 'text-slate-800'
                    }`}
                    />
                </div>
                <div>
                  <Label optional>Platform</Label>
                  <Sel value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value })}>
                    <option value="">Pilih platform...</option>
                    {platformList.map(p => <option key={p.value} value={p.value}>{p.value}</option>)}
                  </Sel>
                </div>
                <div>
                  <Label optional>Link / URL</Label>
                  <Input type="url" value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <Label optional>Ada korban lain yang kamu tahu?</Label>
                  <div className="flex gap-3 mt-1">
                    {[{ val: 'yes', label: 'Ya, ada korban lain' }, { val: 'no', label: 'Hanya saya' }].map(opt => (
                      <button key={opt.val} type="button"
                        onClick={() => setFormData(f => ({ ...f, has_other_victims: f.has_other_victims === opt.val ? '' : opt.val as 'yes' | 'no' }))}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                          formData.has_other_victims === opt.val
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label optional>Sudah lapor ke mana?</Label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {reportedToOptions.map(opt => {
                      const active = formData.reported_to.includes(opt.value);
                      return (
                        <button key={opt.value} type="button" onClick={() => toggleReportedTo(opt.value)}
                          className={`py-3 px-4 rounded-xl text-sm font-semibold border text-left transition-all ${
                            active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ══════════════ STEP 2 ══════════════ */}
      {currentStep === 2 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <SectionTitle title="Kronologi Kejadian" subtitle="Ceritakan dengan detail agar laporan cepat diverifikasi" />
                <button type="button" onClick={handleAITextAnalysis} disabled={isAnalyzingText || formData.chronology.length < 20}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-30 transition-all shrink-0 ml-4">
                  {isAnalyzingText ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Analisis AI
                </button>
              </div>

              <textarea rows={10} value={formData.chronology}
                onChange={(e) => setFormData({ ...formData, chronology: e.target.value })}
                placeholder="Ceritakan bagaimana penipuan terjadi. Sertakan nominal kerugian, tanggal kejadian, cara komunikasi, dan detail identitas pelaku yang kamu ketahui..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 placeholder:text-slate-300 leading-relaxed focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all resize-none" />

              <div className="mt-4 space-y-2">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    chronologyProgress >= 100 ? 'bg-emerald-500' : chronologyProgress > 50 ? 'bg-amber-400' : 'bg-slate-300'
                  }`} style={{ width: `${chronologyProgress}%` }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">
                    {formData.chronology.length < 150 ? 'Tambahkan lebih banyak detail untuk memperkuat laporan' : '✓ Kronologi sudah cukup lengkap'}
                  </span>
                  <span className={`text-sm font-semibold ${formData.chronology.length >= 150 ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {formData.chronology.length} / 150
                  </span>
                </div>
              </div>
              {textAnalysis && <TextAnalysisResult analysis={textAnalysis} />}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ══════════════ STEP 3 ══════════════ */}
      {currentStep === 3 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">

          <Card>
            <div className="p-6">
              <SectionTitle title="Bukti Foto" subtitle={`Upload hingga ${MAX_EVIDENCE_FILES} foto · Screenshot percakapan, struk transfer · JPG, PNG · maks 5MB per file`} />
              {evidenceFiles.length > 0 && (
                <div className="space-y-3 mb-4">
                  {evidenceFiles.map((item, index) => (
                    <div key={index} className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                      <div className="relative h-48 w-full">
                        <Image src={item.preview} alt={`Bukti ${index + 1}`} fill className="object-cover" unoptimized />
                        <button type="button" onClick={() => removeEvidenceFile(index)}
                          className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/80 transition-colors backdrop-blur-sm">
                          <X className="w-4 h-4" />
                        </button>
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 text-white text-xs font-semibold rounded-lg backdrop-blur-sm">Foto {index + 1}</span>
                      </div>
                      <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-sm text-slate-400 truncate max-w-[200px]">{item.file.name}</span>
                        {!item.analysis ? (
                          <button type="button" onClick={() => handleAIImageAnalysis(index)} disabled={item.isAnalyzing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shrink-0">
                            {item.isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5" /> Scan AI</>}
                          </button>
                        ) : (
                          <span className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Teranalisis
                          </span>
                        )}
                      </div>
                      {item.analysis && <div className="px-4 pb-4"><ImageAnalysisResult analysis={item.analysis} /></div>}
                    </div>
                  ))}
                </div>
              )}
              {evidenceFiles.length < MAX_EVIDENCE_FILES && (
                <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                    <Upload className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
                      {evidenceFiles.length === 0 ? 'Klik untuk upload foto bukti' : `Tambah foto (${evidenceFiles.length}/${MAX_EVIDENCE_FILES})`}
                    </p>
                    <p className="text-xs text-slate-300 mt-1">JPG, PNG · maks 5MB per file</p>
                  </div>
                  <input type="file" onChange={handleEvidenceFileChange} className="hidden" accept="image/*" multiple />
                </label>
              )}
            </div>
          </Card>

          {/* Verifikasi */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  turnstileStatus === 'success' ? 'bg-emerald-50 border border-emerald-100'
                  : turnstileStatus === 'error' ? 'bg-red-50 border border-red-100'
                  : 'bg-slate-50 border border-slate-100'
                }`}>
                  {turnstileStatus === 'success' ? <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  : turnstileStatus === 'error' ? <ShieldX className="w-6 h-6 text-red-400" />
                  : <ShieldEllipsis className="w-6 h-6 text-slate-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-slate-800">Verifikasi Keamanan</p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {turnstileStatus === 'success' ? 'Verifikasi berhasil — siap kirim laporan'
                    : turnstileStatus === 'error' ? 'Verifikasi gagal, coba refresh halaman'
                    : 'Selesaikan verifikasi untuk mengirim laporan'}
                  </p>
                </div>
                {turnstileStatus === 'success' && (
                  <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl shrink-0">
                    ✓ Terverifikasi
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center bg-slate-50 rounded-xl py-4 border border-slate-100">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => { setTurnstileToken(token); setTurnstileStatus('success'); setError(null); }}
                  onExpire={() => { setTurnstileToken(null); setTurnstileStatus('idle'); setError('Verifikasi kedaluwarsa. Silakan ulangi.'); }}
                  onError={() => { setTurnstileToken(null); setTurnstileStatus('error'); setError('Widget keamanan gagal dimuat. Coba refresh halaman.'); }}
                />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── NAVIGASI ── */}
      <div className={`flex gap-3 ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
        {currentStep > 1 && (
          <button type="button" onClick={handlePrevStep}
            className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all">
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
        <p className="text-center text-xs text-slate-300 uppercase tracking-widest font-medium">
          Laporan divalidasi tim moderator · Identitas pelapor terlindungi
        </p>
      )}
    </div>
  );
}