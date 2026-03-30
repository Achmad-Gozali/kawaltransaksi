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
  Loader2, Upload, AlertCircle, CheckCircle2, Brain,
  FileWarning, Sparkles, X, ImageIcon, Phone,
  Building2, Wallet, ChevronDown, Calendar, DollarSign, Globe, Send
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

type TargetType = 'phone' | 'bank_account' | 'ewallet';

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
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);
  const [textAnalysis, setTextAnalysis] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > 5 * 1024 * 1024) {
      setError('Ukuran file melebihi 5MB.');
      return;
    }
    setFile(selected);
    setImageAnalysis(null);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const handleAIImageAnalysis = async () => {
    if (!file) return;
    setIsAnalyzingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await analyzeEvidence(fd);
      if (result.success) setImageAnalysis(result.data);
      else setError(result.error || 'Gagal analisis gambar.');
    } catch (err) { setError('Gagal analisis gambar.'); }
    finally { setIsAnalyzingImage(false); }
  };

  const handleAITextAnalysis = async () => {
    if (formData.chronology.trim().length < 20) return;
    setIsAnalyzingText(true);
    try {
      const result = await analyzeChronology(formData.chronology);
      if (result.success) setTextAnalysis(result.data);
      else setError(result.error || 'Gagal analisis teks.');
    } catch (err) { setError('Gagal analisis teks.'); }
    finally { setIsAnalyzingText(false); }
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
        const up = await uploadEvidence(fd);
        if (up.success) uploadedUrl = up.url ?? null;
      }

      const providerName = formData.target_type === 'bank_account' 
        ? formData.bank_name 
        : formData.target_type === 'ewallet' 
          ? formData.ewallet_name 
          : null;

      // ✅ FIX TypeScript & Logic Error
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
      });

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => router.push(`/check/${result.slug}`), 1500);
      } else {
        setError(result.error || 'Gagal mengirim laporan.');
      }
    } catch (err) { 
      setError('Terjadi kesalahan. Periksa koneksi Anda.'); 
    }
    finally { setIsLoading(false); }
  };

  if (isSuccess) return (
    <div className="text-center py-20">
      <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
      <h3 className="text-xl font-bold">Laporan Berhasil Dikirim</h3>
      <p className="text-zinc-400 text-sm">Sedang mengalihkan ke detail...</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* TABS */}
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
                ${formData.target_type === item.id ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              <item.icon className={`w-3.5 h-3.5 ${formData.target_type === item.id ? 'text-zinc-900' : 'text-zinc-400'}`} />
              <span className="hidden xs:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* DATA PENIPU */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <h3 className="text-[11px] font-extrabold text-zinc-900 uppercase tracking-wider">Data Penipu</h3>
        </div>

        <div className="space-y-4">
          {formData.target_type !== 'phone' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-700 ml-1">Pilih {formData.target_type === 'bank_account' ? 'Bank' : 'Layanan'} *</label>
              <div className="relative">
                <select
                  required
                  value={formData.target_type === 'bank_account' ? formData.bank_name : formData.ewallet_name}
                  onChange={(e) => setFormData({ ...formData, [formData.target_type === 'bank_account' ? 'bank_name' : 'ewallet_name']: e.target.value })}
                  className="w-full pl-4 pr-10 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none appearance-none"
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
              <label className="text-[11px] font-bold text-zinc-700 ml-1">Nomor {formData.target_type === 'phone' ? 'HP / WA' : 'Rekening'} *</label>
              <input
                required
                type="text"
                value={formData.target_number}
                onChange={(e) => setFormData({ ...formData, target_number: e.target.value.replace(/[^0-9+]/g, '') })}
                placeholder={formData.target_type === 'phone' ? '0812...' : '12345678...'}
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-700 ml-1">Nama Pemilik <span className="text-zinc-300 font-normal">(opsional)</span></label>
              <input
                type="text"
                value={formData.target_name}
                onChange={(e) => setFormData({ ...formData, target_name: e.target.value })}
                placeholder="Budi Santoso"
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-700 ml-1">Kategori Penipuan *</label>
          <div className="relative">
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full pl-4 pr-10 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-semibold appearance-none focus:bg-white focus:border-zinc-900 outline-none transition-all"
            >
              {categoryList.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* DETAIL TAMBAHAN */}
      <div className="space-y-5 pt-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
          <h3 className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">Detail Tambahan</h3>
        </div>

        <div className="grid xs:grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 ml-1 flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> Kerugian</label>
            <input
              type="text"
              value={formData.loss_amount}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, loss_amount: val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '' });
              }}
              placeholder="Rp 0"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 ml-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Tanggal</label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={formData.incident_date}
              onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold"
            />
          </div>
          <div className="space-y-2 xs:col-span-2 sm:col-span-1">
            <label className="text-[10px] font-bold text-zinc-500 ml-1 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platform</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold"
            >
              <option value="">Pilih Platform...</option>
              {platformList.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[11px] font-bold text-zinc-700">Kronologi Singkat *</label>
            <button 
              type="button" 
              onClick={handleAITextAnalysis}
              disabled={isAnalyzingText || formData.chronology.length < 20}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-full text-[9px] font-bold text-white uppercase tracking-wider hover:bg-black disabled:opacity-30 transition-all active:scale-95"
            >
              {isAnalyzingText ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Analisis AI
            </button>
          </div>
          <textarea
            required
            rows={5}
            minLength={20}
            value={formData.chronology}
            onChange={(e) => setFormData({ ...formData, chronology: e.target.value })}
            placeholder="Ceritakan bagaimana penipuan terjadi..."
            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:bg-white focus:border-zinc-900 transition-all outline-none"
          />
          {textAnalysis && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${textAnalysis.risk_level === 'high' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
              <div className="font-bold uppercase mb-1 flex items-center gap-2"><Brain className="w-3 h-3" /> Hasil Analisis AI</div>
              {textAnalysis.analysis}
            </div>
          )}
        </div>

        {/* BUKTI */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-zinc-700 ml-1">Lampiran Bukti</label>
          {!filePreview ? (
            <label className="group border-2 border-dashed border-zinc-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-2 hover:border-zinc-400 hover:bg-zinc-50/50 transition-all cursor-pointer">
              <Upload className="w-6 h-6 text-zinc-300 group-hover:text-zinc-500" />
              <p className="text-xs font-bold text-zinc-500">Klik untuk upload screenshot</p>
              <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-white p-2">
              <img src={filePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
              <button type="button" onClick={() => { setFile(null); setFilePreview(null); setImageAnalysis(null); }} className="absolute top-4 right-4 p-1.5 bg-black/60 text-white rounded-full hover:bg-black">
                <X className="w-3 h-3" />
              </button>
              <div className="mt-2 px-2 pb-1 flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[150px]">{file?.name}</span>
                <button 
                  type="button" 
                  onClick={handleAIImageAnalysis}
                  disabled={isAnalyzingImage}
                  className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {isAnalyzingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Scan AI'}
                </button>
              </div>
            </div>
          )}
          {imageAnalysis && (
            <div className={`p-4 rounded-xl border text-xs ${imageAnalysis.is_likely_authentic ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
              <div className="font-bold mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Keaslian: {imageAnalysis.authenticity_score}%</div>
              {imageAnalysis.summary}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-zinc-900 text-white py-4.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-3 shadow-xl shadow-zinc-900/10 hover:bg-black hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-widest"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
        Kirim Laporan
      </button>

      <p className="text-center text-[10px] text-zinc-400 font-medium">
        Laporan akan diverifikasi dalam 24 jam. Identitas Anda aman 100%.
      </p>
    </form>
  );
}