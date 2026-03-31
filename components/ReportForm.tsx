'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  submitReport,
  uploadEvidence,
  analyzeEvidence,
  analyzeChronology,
} from '@/app/actions/reportActions';
import type { AnalysisResult } from '@/lib/groq';
import {
  Loader2, Upload, AlertCircle, CheckCircle2, Brain,
  Sparkles, X, Phone, Building2, Wallet, ChevronDown,
  Calendar, DollarSign, Globe, Send, AtSign, Users,
  ShieldCheck, Plus, Trash2
} from 'lucide-react';
import * as motion from 'motion/react-client';

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

type TargetType = 'phone' | 'bank_account' | 'ewallet';

type PhotoScanPayload = Pick<
  AnalysisResult,
  'authenticity_score' | 'relevance_score' | 'has_concrete_evidence' | 'is_likely_authentic'
>;

// ─── KOMPONEN KECIL ────────────────────────────────────────────────────────

function SectionHeader({ dot, label, muted }: { dot: string; label: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <h3 className={`text-[11px] font-extrabold uppercase tracking-wider ${muted ? 'text-zinc-400' : 'text-zinc-900'}`}>
        {label}
      </h3>
    </div>
  );
}

function FieldLabel({ icon: Icon, label, optional }: { icon?: any; label: string; optional?: boolean }) {
  return (
    <label className="text-[11px] font-bold text-zinc-700 ml-1 flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3 text-zinc-400" />}
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

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

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
    link_url: '',
    // ── FIELD BARU ──
    social_media_accounts: [''],   // username sosmed penipu (bisa multi)
    has_other_victims: '' as '' | 'yes' | 'no',
    reported_to: [] as string[],
  });

  // bukti transaksi (existing)
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<AnalysisResult | null>(null);
  const [textAnalysis, setTextAnalysis] = useState<any>(null);
  const [aiPhotoResult, setAiPhotoResult] = useState<PhotoScanPayload | null>(null);

  // foto profil penipu (baru)
  const [suspectPhoto, setSuspectPhoto] = useState<File | null>(null);
  const [suspectPhotoPreview, setSuspectPhotoPreview] = useState<string | null>(null);

  // ── handlers ──

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > 5 * 1024 * 1024) { setError('Ukuran file melebihi 5MB.'); return; }
    setFile(selected);
    setImageAnalysis(null);
    setAiPhotoResult(null);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else setFilePreview(null);
  };

  const handleSuspectPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > 5 * 1024 * 1024) { setError('Ukuran foto profil melebihi 5MB.'); return; }
    setSuspectPhoto(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setSuspectPhotoPreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else setSuspectPhotoPreview(null);
  };

  const handleAIImageAnalysis = async () => {
    if (!file) return;
    setIsAnalyzingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await analyzeEvidence(fd);
      if (result.success && result.data) {
        setImageAnalysis(result.data);
        setAiPhotoResult({
          authenticity_score: result.data.authenticity_score,
          relevance_score: result.data.relevance_score,
          has_concrete_evidence: result.data.has_concrete_evidence,
          is_likely_authentic: result.data.is_likely_authentic,
        });
      } else setError(result.error || 'Gagal analisis gambar.');
    } catch { setError('Gagal analisis gambar.'); }
    finally { setIsAnalyzingImage(false); }
  };

  const handleAITextAnalysis = async () => {
    if (formData.chronology.trim().length < 20) return;
    setIsAnalyzingText(true);
    try {
      const result = await analyzeChronology(formData.chronology);
      if (result.success) setTextAnalysis(result.data);
      else setError(result.error || 'Gagal analisis teks.');
    } catch { setError('Gagal analisis teks.'); }
    finally { setIsAnalyzingText(false); }
  };

  // sosmed multi-field helpers
  const addSocialField = () =>
    setFormData(f => ({ ...f, social_media_accounts: [...f.social_media_accounts, ''] }));

  const removeSocialField = (i: number) =>
    setFormData(f => ({ ...f, social_media_accounts: f.social_media_accounts.filter((_, idx) => idx !== i) }));

  const updateSocialField = (i: number, val: string) =>
    setFormData(f => {
      const arr = [...f.social_media_accounts];
      arr[i] = val;
      return { ...f, social_media_accounts: arr };
    });

  const toggleReportedTo = (val: string) =>
    setFormData(f => ({
      ...f,
      reported_to: f.reported_to.includes(val)
        ? f.reported_to.filter(v => v !== val)
        : [...f.reported_to, val],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let uploadedUrl: string | null = null;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const up = await uploadEvidence(fd);
        if (up.success) uploadedUrl = up.url ?? null;
      }

      // upload foto profil penipu (opsional, pakai endpoint yang sama)
      let suspectPhotoUrl: string | null = null;
      if (suspectPhoto) {
        const fd = new FormData();
        fd.append('file', suspectPhoto);
        const up = await uploadEvidence(fd);
        if (up.success) suspectPhotoUrl = up.url ?? null;
      }

      const providerName =
        formData.target_type === 'bank_account' ? formData.bank_name
        : formData.target_type === 'ewallet' ? formData.ewallet_name
        : null;

      const result = await submitReport({
        target_number: formData.target_number,
        target_name: formData.target_name || '',
        target_type: formData.target_type,
        category: formData.category,
        chronology: formData.chronology,
        evidence_url: uploadedUrl || null,
        bank_name: providerName || null,
        loss_amount: formData.loss_amount ? parseInt(formData.loss_amount.replace(/\D/g, ''), 10) : null,
        incident_date: formData.incident_date || null,
        platform: formData.platform || null,
        link_url: formData.link_url || null,
        ai_photo_result: aiPhotoResult,
        // field baru — terima atau ignore di server tergantung schema
        social_media_accounts: formData.social_media_accounts.filter(Boolean),
        has_other_victims: formData.has_other_victims || null,
        reported_to: formData.reported_to,
        suspect_photo_url: suspectPhotoUrl,
      } as any);

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => router.push(`/check/${result.slug}`), 1500);
      } else setError(result.error || 'Gagal mengirim laporan.');
    } catch { setError('Terjadi kesalahan. Periksa koneksi kamu.'); }
    finally { setIsLoading(false); }
  };

  // ── SUCCESS STATE ──
  if (isSuccess)
    return (
      <div className="text-center py-20">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-zinc-900">Laporan Berhasil Dikirim</h3>
        <p className="text-zinc-400 text-sm mt-1">Sedang mengalihkan ke detail...</p>
      </div>
    );

  // ── FORM ──
  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* ── 1. JENIS LAPORAN ── */}
      <div className="space-y-3">
        <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">Jenis Laporan</label>
        <div className="bg-zinc-100 p-1 rounded-2xl flex gap-1">
          {[
            { id: 'phone', label: 'HP / WA', icon: Phone },
            { id: 'bank_account', label: 'Rekening', icon: Building2 },
            { id: 'ewallet', label: 'E-Wallet', icon: Wallet },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFormData({ ...formData, target_type: item.id as TargetType })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all
                ${formData.target_type === item.id
                  ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              <item.icon className={`w-3.5 h-3.5 shrink-0 ${formData.target_type === item.id ? 'text-zinc-900' : 'text-zinc-400'}`} />
              <span className="text-[11px]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. DATA PENIPU ── */}
      <div className="space-y-5">
        <SectionHeader dot="bg-red-500" label="Data Penipu" />

        {formData.target_type !== 'phone' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <FieldLabel label={`Pilih ${formData.target_type === 'bank_account' ? 'Bank' : 'Layanan'}`} />
            <div className="relative">
              <select
                required
                value={formData.target_type === 'bank_account' ? formData.bank_name : formData.ewallet_name}
                onChange={(e) =>
                  setFormData({ ...formData, [formData.target_type === 'bank_account' ? 'bank_name' : 'ewallet_name']: e.target.value })
                }
                className="w-full pl-4 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none appearance-none"
              >
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
            <InputBase
              required
              type="text"
              value={formData.target_number}
              onChange={(e) => setFormData({ ...formData, target_number: e.target.value.replace(/[^0-9+]/g, '') })}
              placeholder={formData.target_type === 'phone' ? '0812...' : '12345678...'}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel label="Nama Pemilik" optional />
            <InputBase
              type="text"
              value={formData.target_name}
              onChange={(e) => setFormData({ ...formData, target_name: e.target.value })}
              placeholder="Budi Santoso"
            />
          </div>
        </div>

        {/* Username Sosmed */}
        <div className="space-y-2">
          <FieldLabel icon={AtSign} label="Akun Media Sosial Penipu" optional />
          <p className="text-[10px] text-zinc-400 font-medium ml-1 -mt-1">
            Instagram, TikTok, Facebook, Telegram, dll. Penipu sering ganti nomor tapi akun sosmed-nya tetap.
          </p>
          <div className="space-y-2">
            {formData.social_media_accounts.map((val, i) => (
              <div key={i} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold select-none">@</span>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => updateSocialField(i, e.target.value)}
                    placeholder="username atau link profil"
                    className="w-full pl-7 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all"
                  />
                </div>
                {formData.social_media_accounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSocialField(i)}
                    className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {formData.social_media_accounts.length < 4 && (
              <button
                type="button"
                onClick={addSocialField}
                className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors mt-1 ml-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah akun lain
              </button>
            )}
          </div>
        </div>

        {/* Foto Profil Penipu */}
        <div className="space-y-2">
          <FieldLabel icon={Users} label="Foto Profil / Identitas Visual Penipu" optional />
          <p className="text-[10px] text-zinc-400 font-medium ml-1 -mt-1">
            Screenshot foto profil WA, IG, atau foto KTP yang dikirim penipu.
          </p>
          {!suspectPhotoPreview ? (
            <label className="group border-2 border-dashed border-zinc-200 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-400 hover:bg-zinc-50 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 transition-colors">
                <Upload className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-600">Upload foto penipu</p>
                <p className="text-[10px] text-zinc-400 font-medium">JPG, PNG · maks 5MB</p>
              </div>
              <input type="file" onChange={handleSuspectPhotoChange} className="hidden" accept="image/*" />
            </label>
          ) : (
            <div className="relative inline-block">
              <img src={suspectPhotoPreview} alt="Foto penipu" className="w-24 h-24 object-cover rounded-2xl border border-zinc-200" />
              <button
                type="button"
                onClick={() => { setSuspectPhoto(null); setSuspectPhotoPreview(null); }}
                className="absolute -top-2 -right-2 p-1 bg-zinc-900 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <FieldLabel label="Kategori Penipuan" />
          <div className="relative">
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full pl-4 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold appearance-none focus:bg-white focus:border-zinc-900 outline-none transition-all"
            >
              {categoryList.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── 3. DETAIL TAMBAHAN ── */}
      <div className="space-y-5 pt-2">
        <SectionHeader dot="bg-zinc-300" label="Detail Tambahan" muted />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-2">
            <FieldLabel icon={DollarSign} label="Kerugian" optional />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold select-none">Rp</span>
              <input
                type="text"
                value={formData.loss_amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, loss_amount: val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '' });
                }}
                placeholder="0"
                className="w-full pl-8 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel icon={Calendar} label="Tanggal" optional />
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={formData.incident_date}
              onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
              className="w-full px-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel icon={Globe} label="Platform" optional />
            <div className="relative">
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold appearance-none focus:bg-white focus:border-zinc-900 outline-none"
              >
                <option value="">Pilih...</option>
                {platformList.map(p => <option key={p.value} value={p.value}>{p.value}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel icon={Globe} label="Link / URL" optional />
            <InputBase
              type="url"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Ada korban lain? */}
        <div className="space-y-2">
          <FieldLabel icon={Users} label="Ada korban lain yang kamu tahu?" optional />
          <div className="flex gap-2">
            {[
              { val: 'yes', label: 'Ya, ada korban lain' },
              { val: 'no', label: 'Hanya saya' },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setFormData(f => ({
                  ...f,
                  has_other_victims: f.has_other_victims === opt.val ? '' : opt.val as 'yes' | 'no'
                }))}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all
                  ${formData.has_other_victims === opt.val
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sudah lapor ke mana */}
        <div className="space-y-2">
          <FieldLabel icon={ShieldCheck} label="Sudah lapor ke mana?" optional />
          <div className="grid grid-cols-2 gap-2">
            {reportedToOptions.map(opt => {
              const active = formData.reported_to.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleReportedTo(opt.value)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-left transition-all
                    ${active
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 4. KRONOLOGI ── */}
      <div className="space-y-3 pt-2">
        <SectionHeader dot="bg-red-500" label="Kronologi" />
        <div className="flex justify-between items-center">
          <FieldLabel label="Ceritakan apa yang terjadi" />
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold ${formData.chronology.length < 20 ? 'text-zinc-300' : 'text-emerald-500'}`}>
              {formData.chronology.length}/20 min
            </span>
            <button
              type="button"
              onClick={handleAITextAnalysis}
              disabled={isAnalyzingText || formData.chronology.length < 20}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-full text-[9px] font-bold text-white uppercase tracking-wider hover:bg-black disabled:opacity-30 transition-all active:scale-95"
            >
              {isAnalyzingText ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Analisis AI
            </button>
          </div>
        </div>
        <textarea
          required
          rows={5}
          minLength={20}
          value={formData.chronology}
          onChange={(e) => setFormData({ ...formData, chronology: e.target.value })}
          placeholder="Ceritakan bagaimana penipuan terjadi, apa yang dijanjikan, dan bagaimana kamu menyadarinya..."
          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:bg-white focus:border-zinc-900 transition-all outline-none resize-none"
        />
        {textAnalysis && (
          <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
            textAnalysis.risk_level === 'high' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}>
            <div className="font-bold uppercase mb-1 flex items-center gap-2">
              <Brain className="w-3 h-3" /> Hasil Analisis AI
            </div>
            {textAnalysis.analysis}
          </div>
        )}
      </div>

      {/* ── 5. BUKTI FOTO ── */}
      <div className="space-y-3">
        <SectionHeader dot="bg-zinc-300" label="Lampiran Bukti Transaksi" muted />
        <p className="text-[10px] text-zinc-400 font-medium -mt-1">
          Screenshot chat, struk transfer, atau bukti transaksi lainnya. JPG/PNG · maks 5MB.
        </p>

        {!filePreview ? (
          <label className="group border-2 border-dashed border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 hover:border-zinc-400 hover:bg-zinc-50/50 transition-all cursor-pointer">
            <Upload className="w-6 h-6 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
            <p className="text-xs font-bold text-zinc-500">Klik untuk upload screenshot</p>
            <p className="text-[10px] text-zinc-400">JPG, PNG · maks 5MB</p>
            <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
          </label>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-white p-2">
            <img src={filePreview} alt="Preview bukti" className="w-full h-48 object-cover rounded-xl" />
            <button
              type="button"
              onClick={() => { setFile(null); setFilePreview(null); setImageAnalysis(null); setAiPhotoResult(null); }}
              className="absolute top-4 right-4 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="mt-2 px-2 pb-1 flex justify-between items-center">
              <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[180px]">{file?.name}</span>
              <button
                type="button"
                onClick={handleAIImageAnalysis}
                disabled={isAnalyzingImage}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
              >
                {isAnalyzingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-3 h-3" /> Scan AI</>}
              </button>
            </div>
          </div>
        )}

        {imageAnalysis && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            imageAnalysis.is_likely_authentic && imageAnalysis.relevance_score >= 65
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
              : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}>
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Keaslian: {imageAnalysis.authenticity_score}% · Relevansi: {imageAnalysis.relevance_score}%
            </div>
            <p className="leading-relaxed">{imageAnalysis.summary}</p>
            {imageAnalysis.red_flags?.length > 0 && (
              <ul className="list-disc list-inside space-y-0.5 opacity-80">
                {imageAnalysis.red_flags.map((flag: string, i: number) => <li key={i}>{flag}</li>)}
              </ul>
            )}
            {imageAnalysis.relevance_score < 65 && (
              <p className="font-semibold text-amber-800 mt-1">
                Foto kurang relevan. Upload struk transfer atau screenshot chat transaksi untuk memperkuat laporan.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── SUBMIT ── */}
      <div className="pt-2 space-y-3">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-3 shadow-xl shadow-zinc-900/10 hover:bg-black hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-widest"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
          Kirim Laporan
        </button>
        <p className="text-center text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
          Laporan divalidasi 24 jam · Identitas aman 100%
        </p>
      </div>

    </form>
  );
}