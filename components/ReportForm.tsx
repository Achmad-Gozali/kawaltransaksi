// ============================================
// 📁 LOKASI: components/ReportForm.tsx
// ✅ UPDATE: Form laporan lebih lengkap
//    - Jenis target: Nomor HP, Rekening Bank, E-Wallet (3 kategori)
//    - Field baru: Nama Bank/E-Wallet, Jumlah Kerugian, Tanggal Kejadian, Platform
//    - Field baru bersifat OPSIONAL
//    - Dropdown bank & e-wallet lengkap
//    - Form dinamis — field berubah sesuai jenis target
// ============================================

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  submitReport,
  uploadEvidence,
  analyzeEvidence,
  analyzeChronology,
} from '@/app/actions/reportActions';
import {
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Brain,
  FileWarning,
  Sparkles,
  X,
  ImageIcon,
  Phone,
  Building2,
  Wallet,
} from 'lucide-react';

// ============================================
// DATA: Bank & E-Wallet lengkap Indonesia
// ============================================

const bankList = [
  // Bank Umum Besar
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
  { value: 'Bukopin', label: 'Bank Bukopin' },
  { value: 'BTN', label: 'BTN (Bank Tabungan Negara)' },
  { value: 'BTPN', label: 'Bank BTPN' },
  { value: 'Maybank', label: 'Maybank Indonesia' },
  { value: 'HSBC', label: 'HSBC Indonesia' },
  { value: 'UOB', label: 'UOB Indonesia' },
  { value: 'Citibank', label: 'Citibank Indonesia' },
  { value: 'Standard Chartered', label: 'Standard Chartered' },
  // Bank Digital
  { value: 'Jago', label: 'Bank Jago' },
  { value: 'Blu BCA', label: 'Blu by BCA Digital' },
  { value: 'Neobank', label: 'Bank Neo Commerce' },
  { value: 'Allo Bank', label: 'Allo Bank' },
  { value: 'SeaBank', label: 'SeaBank' },
  { value: 'Superbank', label: 'Superbank' },
  { value: 'Line Bank', label: 'LINE Bank' },
  { value: 'Amar Bank', label: 'Amar Bank (Senyumku)' },
  { value: 'Digibank DBS', label: 'Digibank by DBS' },
  { value: 'Motion Banking', label: 'Motion Banking (MNC)' },
  { value: 'Wokee', label: 'Wokee (Bukopin)' },
  { value: 'Nobu Bank', label: 'Nobu Bank' },
  // BPD / Regional
  { value: 'Bank DKI', label: 'Bank DKI' },
  { value: 'Bank Jatim', label: 'Bank Jatim' },
  { value: 'Bank Jateng', label: 'Bank Jateng' },
  { value: 'Bank BJB', label: 'Bank BJB (Jabar Banten)' },
  { value: 'Bank Sumut', label: 'Bank Sumut' },
  { value: 'Bank Nagari', label: 'Bank Nagari' },
  { value: 'Bank Kalbar', label: 'Bank Kalbar' },
  { value: 'Bank Kalsel', label: 'Bank Kalsel' },
  { value: 'Bank Sulteng', label: 'Bank Sulteng' },
  { value: 'Bank Papua', label: 'Bank Papua' },
  { value: 'Bank NTT', label: 'Bank NTT' },
  { value: 'Bank Bali', label: 'BPD Bali' },
  // Lainnya
  { value: 'Lainnya', label: 'Bank Lainnya' },
];

const ewalletList = [
  { value: 'Dana', label: 'Dana' },
  { value: 'GoPay', label: 'GoPay' },
  { value: 'OVO', label: 'OVO' },
  { value: 'ShopeePay', label: 'ShopeePay' },
  { value: 'LinkAja', label: 'LinkAja' },
  { value: 'Jenius', label: 'Jenius (BTPN)' },
  { value: 'Sakuku', label: 'Sakuku (BCA)' },
  { value: 'iSaku', label: 'iSaku (Indomaret)' },
  { value: 'Doku', label: 'DOKU' },
  { value: 'PayPal', label: 'PayPal' },
  { value: 'Flip', label: 'Flip' },
  { value: 'Kredivo', label: 'Kredivo' },
  { value: 'Akulaku', label: 'Akulaku' },
  { value: 'Lainnya', label: 'E-Wallet Lainnya' },
];

const platformList = [
  { value: 'Shopee', label: 'Shopee' },
  { value: 'Tokopedia', label: 'Tokopedia' },
  { value: 'Bukalapak', label: 'Bukalapak' },
  { value: 'Lazada', label: 'Lazada' },
  { value: 'Blibli', label: 'Blibli' },
  { value: 'TikTok Shop', label: 'TikTok Shop' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook / FB Marketplace' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Telegram', label: 'Telegram' },
  { value: 'Twitter/X', label: 'Twitter / X' },
  { value: 'OLX', label: 'OLX' },
  { value: 'Kaskus', label: 'Kaskus' },
  { value: 'Website', label: 'Website / Landing Page' },
  { value: 'Aplikasi', label: 'Aplikasi Lainnya' },
  { value: 'Lainnya', label: 'Platform Lainnya' },
];

const categoryList = [
  { value: 'Jual Beli Online', label: 'Jual Beli Online' },
  { value: 'Investasi Bodong', label: 'Investasi Bodong' },
  { value: 'Pinjaman Online', label: 'Pinjaman Online' },
  { value: 'Undian Palsu', label: 'Undian Palsu' },
  { value: 'Phishing / Soceng', label: 'Phishing / Social Engineering' },
  { value: 'Love Scam', label: 'Love Scam / Romance Scam' },
  { value: 'Modus Kurir/APK', label: 'Modus Kurir / File APK' },
  { value: 'Penipuan Telepon', label: 'Penipuan via Telepon' },
  { value: 'Arisan Online', label: 'Arisan Online' },
  { value: 'Lowongan Kerja Palsu', label: 'Lowongan Kerja Palsu' },
  { value: 'Lainnya', label: 'Lainnya' },
];

// ============================================
// TARGET TYPE CONFIG
// ============================================

type TargetType = 'phone' | 'bank_account' | 'ewallet';

const targetTypeConfig: Record<
  TargetType,
  { label: string; icon: React.ElementType; placeholder: string; color: string }
> = {
  phone: {
    label: 'Nomor HP / WhatsApp',
    icon: Phone,
    placeholder: '08123456789',
    color: 'border-blue-500 bg-blue-50 text-blue-700',
  },
  bank_account: {
    label: 'Rekening Bank',
    icon: Building2,
    placeholder: '1234567890',
    color: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  },
  ewallet: {
    label: 'E-Wallet',
    icon: Wallet,
    placeholder: '08123456789',
    color: 'border-purple-500 bg-purple-50 text-purple-700',
  },
};

// ============================================
// COMPONENT
// ============================================

export default function ReportForm() {
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
  });

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<{
    authenticity_score: number;
    is_likely_authentic: boolean;
    summary: string;
    red_flags: string[];
    scam_category_suggestion: string | null;
  } | null>(null);
  const [textAnalysis, setTextAnalysis] = useState<{
    risk_level: 'low' | 'medium' | 'high';
    analysis: string;
    suggested_category: string | null;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > 5 * 1024 * 1024) {
      setError('Ukuran file melebihi 5MB.');
      return;
    }
    setFile(selected);
    setImageAnalysis(null);
    setError(null);

    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setImageAnalysis(null);
  };

  const handleAIImageAnalysis = async () => {
    if (!file) {
      setError('Pilih file bukti terlebih dahulu.');
      return;
    }
    setIsAnalyzingImage(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await analyzeEvidence(fd);
      if (result.success && result.data) {
        setImageAnalysis(result.data);
        if (result.data.scam_category_suggestion) {
          const suggestions: Record<string, string> = {
            'jual beli': 'Jual Beli Online',
            investasi: 'Investasi Bodong',
            pinjaman: 'Pinjaman Online',
            undian: 'Undian Palsu',
          };
          const lower = result.data.scam_category_suggestion.toLowerCase();
          for (const [key, val] of Object.entries(suggestions)) {
            if (lower.includes(key)) {
              setFormData((prev) => ({ ...prev, category: val }));
              break;
            }
          }
        }
      } else {
        setError(result.error || 'Gagal menganalisis bukti.');
      }
    } catch (err) {
      console.error('AI image analysis error:', err);
      setError('Terjadi kesalahan saat menganalisis bukti.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleAITextAnalysis = async () => {
    if (!formData.chronology || formData.chronology.trim().length < 20) {
      setError(
        'Kronologi terlalu pendek untuk dianalisis (minimal 20 karakter).'
      );
      return;
    }
    setIsAnalyzingText(true);
    setError(null);
    try {
      const result = await analyzeChronology(formData.chronology);
      if (result.success && result.data) {
        setTextAnalysis(result.data);
      } else {
        setError(result.error || 'Gagal menganalisis kronologi.');
      }
    } catch (err) {
      console.error('AI text analysis error:', err);
      setError('Terjadi kesalahan saat menganalisis kronologi.');
    } finally {
      setIsAnalyzingText(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let uploadedUrl: string | null = null;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const uploadResult = await uploadEvidence(fd);
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Gagal mengupload bukti.');
          setIsLoading(false);
          return;
        }
        uploadedUrl = uploadResult.url ?? null;
      }

      // Determine provider name based on target type
      let providerName = '';
      if (formData.target_type === 'bank_account') {
        providerName = formData.bank_name;
      } else if (formData.target_type === 'ewallet') {
        providerName = formData.ewallet_name;
      }

      const result = await submitReport({
        target_number: formData.target_number,
        target_name: formData.target_name,
        target_type: formData.target_type === 'ewallet' ? 'bank_account' : formData.target_type,
        category: formData.category,
        chronology: formData.chronology,
        evidence_url: uploadedUrl,
        bank_name: providerName || null,
        loss_amount: formData.loss_amount
          ? parseInt(formData.loss_amount.replace(/\D/g, ''), 10)
          : null,
        incident_date: formData.incident_date || null,
        platform: formData.platform || null,
      });
      if (!result.success) {
        setError(result.error || 'Gagal mengirim laporan.');
        setIsLoading(false);
        return;
      }
      setIsSuccess(true);
      setTimeout(() => {
        router.push(`/check/${result.slug}`);
      }, 1500);
    } catch (err) {
      console.error('Submit report error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format angka jadi Rp
  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(num, 10));
  };

  if (isSuccess) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-extrabold text-zinc-900 mb-2">
          Laporan Berhasil Dikirim
        </h3>
        <p className="text-zinc-500 text-sm">
          Terima kasih atas kontribusi Anda. Mengalihkan ke halaman detail...
        </p>
      </div>
    );
  }

  const riskColors = {
    low: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    medium: 'bg-amber-50 border-amber-200 text-amber-800',
    high: 'bg-red-50 border-red-200 text-red-800',
  };

  const riskLabels = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi' };

  const activeTargetConfig = targetTypeConfig[formData.target_type];

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 hover:bg-red-100 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===== Section 1: Jenis Target ===== */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em]">
          Jenis Target
        </h3>
        <p className="text-xs text-zinc-400">
          Pilih jenis nomor yang ingin dilaporkan.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(targetTypeConfig) as [TargetType, typeof activeTargetConfig][]).map(
          ([key, config]) => {
            const Icon = config.icon;
            const isActive = formData.target_type === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    target_type: key,
                    bank_name: '',
                    ewallet_name: '',
                  });
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? config.color
                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-bold text-center leading-tight">
                  {config.label}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* ===== Section 2: Informasi Target ===== */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em]">
          Informasi Target
        </h3>
        <p className="text-xs text-zinc-400">
          Data nomor atau rekening yang ingin dilaporkan.
        </p>
      </div>

      {/* Bank / E-Wallet Picker — hanya muncul kalau bukan phone */}
      {formData.target_type === 'bank_account' && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Nama Bank <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.bank_name}
              onChange={(e) =>
                setFormData({ ...formData, bank_name: e.target.value })
              }
              className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 appearance-none cursor-pointer"
              required
            >
              <option value="">Pilih Bank...</option>
              <optgroup label="Bank Umum">
                {bankList.slice(0, 19).map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Bank Digital">
                {bankList.slice(19, 31).map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="BPD / Regional">
                {bankList.slice(31).map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {formData.target_type === 'ewallet' && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Nama E-Wallet <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.ewallet_name}
              onChange={(e) =>
                setFormData({ ...formData, ewallet_name: e.target.value })
              }
              className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 appearance-none cursor-pointer"
              required
            >
              <option value="">Pilih E-Wallet...</option>
              {ewalletList.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            {formData.target_type === 'phone'
              ? 'Nomor HP / WhatsApp'
              : formData.target_type === 'bank_account'
                ? 'Nomor Rekening'
                : 'Nomor E-Wallet'}{' '}
            <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.target_number}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9\-\s+]/g, '');
              setFormData({ ...formData, target_number: val });
            }}
            placeholder={activeTargetConfig.placeholder}
            className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 placeholder:text-zinc-300 placeholder:font-normal"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Nama Pemilik{' '}
            <span className="text-zinc-300 font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            value={formData.target_name}
            onChange={(e) =>
              setFormData({ ...formData, target_name: e.target.value })
            }
            placeholder="Budi Santoso"
            className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 placeholder:text-zinc-300 placeholder:font-normal"
          />
        </div>
      </div>

      {/* Kategori */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
          Kategori Penipuan <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 appearance-none cursor-pointer"
            required
          >
            {categoryList.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100" />

      {/* ===== Section 3: Detail Tambahan (Opsional) ===== */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em]">
          Detail Tambahan{' '}
          <span className="text-zinc-300 font-normal normal-case tracking-normal">
            — opsional tapi membantu verifikasi
          </span>
        </h3>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {/* Jumlah Kerugian */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Jumlah Kerugian
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
              Rp
            </span>
            <input
              type="text"
              value={formData.loss_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  loss_amount: formatCurrency(e.target.value),
                })
              }
              placeholder="500.000"
              className="w-full pl-10 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 placeholder:text-zinc-300 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Tanggal Kejadian */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Tanggal Kejadian
          </label>
          <input
            type="date"
            value={formData.incident_date}
            onChange={(e) =>
              setFormData({ ...formData, incident_date: e.target.value })
            }
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 appearance-none box-border"
          />
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Platform Transaksi
          </label>
          <div className="relative">
            <select
              value={formData.platform}
              onChange={(e) =>
                setFormData({ ...formData, platform: e.target.value })
              }
              className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 appearance-none cursor-pointer"
            >
              <option value="">Pilih Platform...</option>
              {platformList.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100" />

      {/* ===== Section 4: Kronologi ===== */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em]">
          Detail Kejadian
        </h3>
        <p className="text-xs text-zinc-400">
          Ceritakan kronologi penipuan selengkap mungkin.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
          Kronologi <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.chronology}
          onChange={(e) =>
            setFormData({ ...formData, chronology: e.target.value })
          }
          placeholder="Jelaskan secara detail bagaimana penipuan terjadi, termasuk tanggal, jumlah kerugian, dan modus yang digunakan..."
          rows={5}
          className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all resize-none text-sm text-zinc-900 placeholder:text-zinc-300 leading-relaxed"
          required
          minLength={20}
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-medium ${formData.chronology.trim().length >= 20 ? 'text-emerald-500' : 'text-zinc-300'}`}
          >
            {formData.chronology.trim().length}/20 karakter minimum
          </span>

          {!textAnalysis ? (
            <button
              type="button"
              onClick={handleAITextAnalysis}
              disabled={
                isAnalyzingText || formData.chronology.trim().length < 20
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-zinc-900 text-white hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              {isAnalyzingText ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />{' '}
                  Menganalisis...
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5" /> Analisis AI
                </>
              )}
            </button>
          ) : null}
        </div>

        {textAnalysis && (
          <div
            className={`p-4 border rounded-xl ${riskColors[textAnalysis.risk_level]}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Tingkat Risiko: {riskLabels[textAnalysis.risk_level]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTextAnalysis(null)}
                className="text-[10px] font-bold opacity-60 hover:opacity-100 transition-opacity"
              >
                Analisis Ulang
              </button>
            </div>
            <p className="text-sm leading-relaxed">{textAnalysis.analysis}</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100" />

      {/* ===== Section 5: Bukti ===== */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em]">
          Lampiran Bukti
        </h3>
        <p className="text-xs text-zinc-400">
          Upload screenshot percakapan atau bukti transfer.{' '}
          <span className="text-zinc-300">(opsional)</span>
        </p>
      </div>

      <div className="space-y-4">
        {!file ? (
          <label className="relative flex flex-col items-center justify-center py-10 border-2 border-dashed border-zinc-200 rounded-2xl hover:border-zinc-400 hover:bg-zinc-50/50 transition-all cursor-pointer group">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/jpeg,image/png,image/webp"
            />
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-zinc-200 transition-all">
              <Upload className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-600">
              Klik untuk upload bukti
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              JPG, PNG, WebP — Maks. 5MB
            </p>
          </label>
        ) : (
          <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-50">
            <div className="relative">
              {filePreview ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-zinc-100 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-zinc-300" />
                </div>
              )}
              <button
                type="button"
                onClick={removeFile}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-white border border-zinc-200 rounded-lg flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>

              {!imageAnalysis && (
                <button
                  type="button"
                  onClick={handleAIImageAnalysis}
                  disabled={isAnalyzingImage}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-zinc-900 text-white hover:bg-black transition-all disabled:opacity-50 active:scale-95 shrink-0"
                >
                  {isAnalyzingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />{' '}
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Scan AI
                    </>
                  )}
                </button>
              )}
            </div>

            {imageAnalysis && (
              <div
                className={`mx-5 mb-5 p-4 border rounded-xl space-y-2.5 ${
                  imageAnalysis.is_likely_authentic
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {imageAnalysis.is_likely_authentic ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <FileWarning className="w-4 h-4 text-amber-600" />
                    )}
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">
                      Skor Keaslian: {imageAnalysis.authenticity_score}%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageAnalysis(null)}
                    className="text-[10px] font-bold opacity-60 hover:opacity-100"
                  >
                    Ulang
                  </button>
                </div>
                <p className="text-sm leading-relaxed">
                  {imageAnalysis.summary}
                </p>
                {imageAnalysis.red_flags.length > 0 && (
                  <div className="pt-2 border-t border-current/10 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                      Red Flags
                    </p>
                    {imageAnalysis.red_flags.map((flag, i) => (
                      <p key={i} className="text-xs flex items-start gap-1.5">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0 opacity-40" />
                        {flag}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-zinc-900 text-white font-extrabold text-sm rounded-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-zinc-900/10 uppercase tracking-wider"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Mengirim Laporan...
          </>
        ) : (
          <>Kirim Laporan</>
        )}
      </button>
    </form>
  );
}