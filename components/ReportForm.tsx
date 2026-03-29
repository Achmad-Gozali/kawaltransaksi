'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitReport, uploadEvidence, analyzeEvidence, analyzeChronology } from '@/app/actions/reportActions';
import { Loader2, Upload, AlertCircle, CheckCircle2, Brain, FileWarning, Sparkles, X, ImageIcon } from 'lucide-react';

export default function ReportForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    target_number: '',
    target_name: '',
    target_type: 'phone' as 'phone' | 'bank_account',
    category: 'Jual Beli Online',
    chronology: '',
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
    if (!file) { setError('Pilih file bukti terlebih dahulu.'); return; }
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
            'jual beli': 'Jual Beli Online', 'investasi': 'Investasi Bodong',
            'pinjaman': 'Pinjaman Online', 'undian': 'Undian Palsu',
          };
          const lower = result.data.scam_category_suggestion.toLowerCase();
          for (const [key, val] of Object.entries(suggestions)) {
            if (lower.includes(key)) { setFormData((prev) => ({ ...prev, category: val })); break; }
          }
        }
      } else { setError(result.error || 'Gagal menganalisis bukti.'); }
    } catch (err) {
      // ✅ FIX: Log error, jangan biarkan catch kosong
      console.error('AI image analysis error:', err);
      setError('Terjadi kesalahan saat menganalisis bukti.');
    } finally { setIsAnalyzingImage(false); }
  };

  const handleAITextAnalysis = async () => {
    if (!formData.chronology || formData.chronology.trim().length < 20) {
      setError('Kronologi terlalu pendek untuk dianalisis (minimal 20 karakter).'); return;
    }
    setIsAnalyzingText(true);
    setError(null);
    try {
      const result = await analyzeChronology(formData.chronology);
      if (result.success && result.data) { setTextAnalysis(result.data); }
      else { setError(result.error || 'Gagal menganalisis kronologi.'); }
    } catch (err) {
      // ✅ FIX: Log error
      console.error('AI text analysis error:', err);
      setError('Terjadi kesalahan saat menganalisis kronologi.');
    } finally { setIsAnalyzingText(false); }
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
        if (!uploadResult.success) { setError(uploadResult.error || 'Gagal mengupload bukti.'); setIsLoading(false); return; }
        uploadedUrl = uploadResult.url ?? null;
      }
      const result = await submitReport({ ...formData, evidence_url: uploadedUrl });
      if (!result.success) { setError(result.error || 'Gagal mengirim laporan.'); setIsLoading(false); return; }
      setIsSuccess(true);
      setTimeout(() => { router.push(`/check/${result.slug}`); }, 1500);
    } catch (err) {
      // ✅ FIX: Log error
      console.error('Submit report error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally { setIsLoading(false); }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-extrabold text-zinc-900 mb-2">Laporan Berhasil Dikirim</h3>
        <p className="text-zinc-500 text-sm">Terima kasih atas kontribusi Anda. Mengalihkan ke halaman detail...</p>
      </div>
    );
  }

  const riskColors = {
    low: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    medium: 'bg-amber-50 border-amber-200 text-amber-800',
    high: 'bg-red-50 border-red-200 text-red-800',
  };

  const riskLabels = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi' };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button type="button" onClick={() => setError(null)} className="shrink-0 hover:bg-red-100 rounded-lg p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section 1: Informasi Target */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em]">Informasi Target</h3>
        <p className="text-xs text-zinc-400">Data nomor atau rekening yang ingin dilaporkan.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Jenis Target</label>
          <div className="relative">
            <select
              value={formData.target_type}
              onChange={(e) => setFormData({ ...formData, target_type: e.target.value as 'phone' | 'bank_account' })}
              className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 appearance-none cursor-pointer"
              required
            >
              <option value="phone">Nomor Telepon / WhatsApp</option>
              <option value="bank_account">Nomor Rekening Bank</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Kategori</label>
          <div className="relative">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 appearance-none cursor-pointer"
              required
            >
              <option value="Jual Beli Online">Jual Beli Online</option>
              <option value="Investasi Bodong">Investasi Bodong</option>
              <option value="Pinjaman Online">Pinjaman Online</option>
              <option value="Undian Palsu">Undian Palsu</option>
              <option value="Phishing / Soceng">Phishing / Soceng</option>
              <option value="Lainnya">Lainnya</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Nomor Target <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={formData.target_number}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9\-\s+]/g, '');
              setFormData({ ...formData, target_number: val });
            }}
            placeholder="08123456789"
            className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 placeholder:text-zinc-300 placeholder:font-normal"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Nama Pemilik <span className="text-zinc-300 font-normal">(opsional)</span></label>
          <input
            type="text"
            value={formData.target_name}
            onChange={(e) => setFormData({ ...formData, target_name: e.target.value })}
            placeholder="Budi Santoso"
            className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-sm font-semibold text-zinc-900 placeholder:text-zinc-300 placeholder:font-normal"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100" />

      {/* Section 2: Kronologi */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em]">Detail Kejadian</h3>
        <p className="text-xs text-zinc-400">Ceritakan kronologi penipuan selengkap mungkin.</p>
      </div>

      <div className="space-y-3">
        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Kronologi <span className="text-red-400">*</span></label>
        <textarea
          value={formData.chronology}
          onChange={(e) => setFormData({ ...formData, chronology: e.target.value })}
          placeholder="Jelaskan secara detail bagaimana penipuan terjadi, termasuk tanggal, jumlah kerugian, dan modus yang digunakan..."
          rows={5}
          className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all resize-none text-sm text-zinc-900 placeholder:text-zinc-300 leading-relaxed"
          required
          minLength={20}
        />
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-medium ${formData.chronology.trim().length >= 20 ? 'text-emerald-500' : 'text-zinc-300'}`}>
            {formData.chronology.trim().length}/20 karakter minimum
          </span>

          {!textAnalysis ? (
            <button
              type="button"
              onClick={handleAITextAnalysis}
              disabled={isAnalyzingText || formData.chronology.trim().length < 20}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-zinc-900 text-white hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              {isAnalyzingText ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisis...</>
              ) : (
                <><Brain className="w-3.5 h-3.5" /> Analisis AI</>
              )}
            </button>
          ) : null}
        </div>

        {textAnalysis && (
          <div className={`p-4 border rounded-xl ${riskColors[textAnalysis.risk_level]}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Tingkat Risiko: {riskLabels[textAnalysis.risk_level]}
                </span>
              </div>
              <button type="button" onClick={() => setTextAnalysis(null)} className="text-[10px] font-bold opacity-60 hover:opacity-100 transition-opacity">
                Analisis Ulang
              </button>
            </div>
            <p className="text-sm leading-relaxed">{textAnalysis.analysis}</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100" />

      {/* Section 3: Bukti */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-[0.15em]">Lampiran Bukti</h3>
        <p className="text-xs text-zinc-400">Upload screenshot percakapan atau bukti transfer. <span className="text-zinc-300">(opsional)</span></p>
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
            <p className="text-sm font-semibold text-zinc-600">Klik untuk upload bukti</p>
            <p className="text-[11px] text-zinc-400 mt-1">JPG, PNG, WebP — Maks. 5MB</p>
          </label>
        ) : (
          <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-50">
            <div className="relative">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-full h-48 object-cover" />
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
                  <p className="text-sm font-semibold text-zinc-900 truncate">{file.name}</p>
                  <p className="text-[11px] text-zinc-400">{(file.size / 1024).toFixed(0)} KB</p>
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
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Scan AI</>
                  )}
                </button>
              )}
            </div>

            {imageAnalysis && (
              <div className={`mx-5 mb-5 p-4 border rounded-xl space-y-2.5 ${
                imageAnalysis.is_likely_authentic ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
              }`}>
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
                  <button type="button" onClick={() => setImageAnalysis(null)} className="text-[10px] font-bold opacity-60 hover:opacity-100">
                    Ulang
                  </button>
                </div>
                <p className="text-sm leading-relaxed">{imageAnalysis.summary}</p>
                {imageAnalysis.red_flags.length > 0 && (
                  <div className="pt-2 border-t border-current/10 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">Red Flags</p>
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
          <><Loader2 className="w-5 h-5 animate-spin" /> Mengirim Laporan...</>
        ) : (
          <>Kirim Laporan</>
        )}
      </button>
    </form>
  );
}