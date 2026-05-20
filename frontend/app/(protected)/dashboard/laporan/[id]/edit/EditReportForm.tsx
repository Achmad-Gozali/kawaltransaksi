'use client';

// ============================================
// 📁 LOKASI: frontend/components/EditReportForm.tsx
// ✅ FIX — standardize BACKEND_URL: throw jika tidak ada
// ============================================

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ArrowLeft, Upload, X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) throw new Error('NEXT_PUBLIC_BACKEND_URL is not defined');
  return url;
})();

const VALID_CATEGORIES = [
  'Jual Beli Online', 'Investasi Bodong', 'Pinjaman Online',
  'Phishing / Soceng', 'Modus Kurir/APK', 'Lainnya',
] as const;

interface Report {
  id: string;
  target_number: string;
  target_name: string | null;
  target_type: string;
  category: string;
  chronology: string;
  bank_name: string | null;
  loss_amount: number | string | null;
  incident_date: string | null;
  platform: string | null;
  link_url: string | null;
  social_media_accounts: string[] | null;
  has_other_victims: string | null;
  reported_to: string[] | null;
  evidence_urls: string[] | null;
  evidence_url: string | null;
}

interface EditReportFormProps {
  report: Report;
}

export default function EditReportForm({ report }: EditReportFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [category, setCategory]             = useState(report.category);
  const [chronology, setChronology]         = useState(report.chronology);
  const [targetName, setTargetName]         = useState(report.target_name ?? '');
  const [bankName, setBankName]             = useState(report.bank_name ?? '');
  const [lossAmount, setLossAmount]         = useState(report.loss_amount ? String(report.loss_amount) : '');
  const [incidentDate, setIncidentDate]     = useState(report.incident_date ?? '');
  const [platform, setPlatform]             = useState(report.platform ?? '');
  const [linkUrl, setLinkUrl]               = useState(report.link_url ?? '');
  const [hasOtherVictims, setHasOtherVictims] = useState(report.has_other_victims ?? '');
  const [reportedTo, setReportedTo]         = useState<string[]>(report.reported_to ?? []);
  const [socialMediaAccounts, setSocialMediaAccounts] = useState<string[]>(
    report.social_media_accounts?.filter(Boolean) ?? []
  );
  const [socialInput, setSocialInput]       = useState('');
  const [evidenceUrls, setEvidenceUrls]     = useState<string[]>(
    report.evidence_urls?.filter(Boolean) ?? (report.evidence_url ? [report.evidence_url] : [])
  );
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleReportedToToggle = (val: string) => {
    setReportedTo(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const addSocialAccount = () => {
    const trimmed = socialInput.replace(/^@/, '').trim();
    if (trimmed && !socialMediaAccounts.includes(trimmed)) {
      setSocialMediaAccounts(prev => [...prev, trimmed]);
    }
    setSocialInput('');
  };

  const removeSocialAccount = (acc: string) => {
    setSocialMediaAccounts(prev => prev.filter(a => a !== acc));
  };

  const handleEvidenceUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;
    if (evidenceUrls.length >= 5) {
      setError('Maksimal 5 file bukti.');
      return;
    }
    setUploadingEvidence(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Sesi habis. Silakan login ulang.'); return; }

      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 5 - evidenceUrls.length)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `evidence/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { data, error: uploadError } = await supabase.storage
          .from('reports')
          .upload(path, file, { contentType: file.type });

        if (uploadError || !data) continue;

        const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(data.path);
        urls.push(publicUrl);
      }
      setEvidenceUrls(prev => [...prev, ...urls]);
    } catch {
      setError('Gagal upload bukti. Coba lagi.');
    } finally {
      setUploadingEvidence(false);
    }
  }, [evidenceUrls.length, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!chronology.trim() || chronology.trim().length < 50) {
      setError('Kronologi minimal 50 karakter.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Sesi habis. Silakan login ulang.'); return; }

      const res = await fetch(`${BACKEND_URL}/api/reports/${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          category,
          chronology,
          target_name: targetName || null,
          bank_name: bankName || null,
          loss_amount: lossAmount ? Number(lossAmount.replace(/\D/g, '')) : null,
          incident_date: incidentDate || null,
          platform: platform || null,
          link_url: linkUrl || null,
          social_media_accounts: socialMediaAccounts,
          has_other_victims: hasOtherVictims || null,
          reported_to: reportedTo,
          evidence_urls: evidenceUrls,
        }),
      });

      const data = await res.json() as { success: boolean; message?: string };
      if (!data.success) { setError(data.message ?? 'Gagal menyimpan perubahan.'); return; }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard/laporan'), 1500);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div>
          <Link href="/dashboard/laporan" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Laporan
          </Link>
          <h1 className="text-2xl font-extrabold text-zinc-900">Edit Laporan</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Nomor: <span className="font-mono font-bold text-zinc-700">{report.target_number}</span>
          </p>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 font-medium">
            ✅ Laporan berhasil diperbarui! Mengalihkan...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Kategori */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
            <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">Kategori *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white">
              {VALID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Kronologi */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
            <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
              Kronologi * <span className="text-zinc-400 font-normal">(min. 50 karakter)</span>
            </label>
            <textarea
              value={chronology}
              onChange={(e) => setChronology(e.target.value)}
              rows={6} required minLength={50}
              placeholder="Ceritakan kronologi penipuan secara detail..."
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
            />
            <p className="text-[11px] text-zinc-400">{chronology.length} karakter</p>
          </div>

          {/* Info Tambahan */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Info Tambahan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Nama Pelaku</label>
                <input type="text" value={targetName} onChange={(e) => setTargetName(e.target.value)} placeholder="A.N. ..." maxLength={100}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Bank/E-Wallet</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Contoh: BCA, GoPay" maxLength={50}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Total Kerugian (Rp)</label>
                <input type="text" inputMode="numeric" value={lossAmount} onChange={(e) => setLossAmount(e.target.value.replace(/\D/g, ''))} placeholder="Contoh: 500000" maxLength={15}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Tanggal Kejadian</label>
                <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} max={new Date().toLocaleDateString('en-CA')}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Platform</label>
                <input type="text" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Contoh: Tokopedia, WhatsApp" maxLength={50}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Link URL (Opsional)</label>
                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." maxLength={500}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all" />
              </div>
            </div>

            {/* Akun Sosmed */}
            <div>
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Akun Media Sosial Pelaku</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={socialInput} onChange={(e) => setSocialInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSocialAccount(); } }}
                  placeholder="@username atau link profil" maxLength={200}
                  className="flex-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all" />
                <button type="button" onClick={addSocialAccount} className="px-3 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-sm hover:bg-zinc-200 transition-colors font-medium">Tambah</button>
              </div>
              {socialMediaAccounts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {socialMediaAccounts.map(acc => (
                    <span key={acc} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 rounded-lg text-xs font-mono text-zinc-700">
                      @{acc}
                      <button type="button" onClick={() => removeSocialAccount(acc)} className="text-zinc-400 hover:text-zinc-700 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Korban lain */}
            <div>
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Ada korban lain?</label>
              <div className="flex gap-3">
                {[{ val: 'yes', label: 'Ya' }, { val: 'no', label: 'Tidak' }, { val: 'unknown', label: 'Tidak tahu' }].map(opt => (
                  <label key={opt.val} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${hasOtherVictims === opt.val ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}>
                    <input type="radio" name="hasOtherVictims" value={opt.val} checked={hasOtherVictims === opt.val} onChange={() => setHasOtherVictims(opt.val)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Sudah lapor ke */}
            <div>
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Sudah lapor ke</label>
              <div className="flex flex-wrap gap-2">
                {[{ val: 'polisi', label: '🚔 Polisi' }, { val: 'ojk', label: '🏦 OJK' }, { val: 'platform', label: '📱 Platform' }, { val: 'belum', label: '❌ Belum' }].map(opt => (
                  <label key={opt.val} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${reportedTo.includes(opt.val) ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}>
                    <input type="checkbox" checked={reportedTo.includes(opt.val)} onChange={() => handleReportedToToggle(opt.val)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Bukti */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Bukti Transfer / Chat</h3>
            <div
              className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleEvidenceUpload(e.dataTransfer.files); }}
              onClick={() => document.getElementById('evidence-input')?.click()}
            >
              <Upload className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">{uploadingEvidence ? 'Mengupload...' : 'Drag & drop atau klik untuk pilih file'}</p>
              <p className="text-[11px] text-zinc-400 mt-1">JPG, PNG, WebP — maks. 5MB per file, maks. 5 file</p>
              <input id="evidence-input" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only"
                onChange={(e) => { if (e.target.files) handleEvidenceUpload(e.target.files); }} />
            </div>
            {evidenceUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {evidenceUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Bukti ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border border-zinc-200" />
                    <button type="button" onClick={() => setEvidenceUrls(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading || success}
            className="w-full py-3.5 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan & Kirim Ulang untuk Review</>}
          </button>
        </form>
      </div>
    </div>
  );
}