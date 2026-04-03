'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Loader2, Send, ChevronDown, Plus, Trash2, FilePen,
  AlertCircle, CheckCircle2,
} from 'lucide-react';

interface EditReportModalProps {
  report: {
    id: string;
    target_number: string;
    target_name: string | null;
    target_type: string;
    category: string;
    chronology: string;
    bank_name?: string | null;
    loss_amount?: number | null;
    incident_date?: string | null;
    platform?: string | null;
    link_url?: string | null;
    social_media_accounts?: string[] | null;
    has_other_victims?: string | null;
    reported_to?: string[] | null;
  };
  onClose: () => void;
}

const categoryList = [
  { value: 'Jual Beli Online', label: 'Jual Beli Online' },
  { value: 'Investasi Bodong', label: 'Investasi Bodong' },
  { value: 'Pinjaman Online', label: 'Pinjaman Online' },
  { value: 'Phishing / Soceng', label: 'Phishing / Social Engineering' },
  { value: 'Modus Kurir/APK', label: 'Modus Kurir / File APK' },
  { value: 'Lainnya', label: 'Lainnya' },
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

const reportedToOptions = [
  { value: 'polisi', label: '🚔 Polisi' },
  { value: 'ojk', label: '🏦 OJK' },
  { value: 'platform', label: '📱 Platform' },
  { value: 'belum', label: '❌ Belum lapor' },
];

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
      {label}
      {optional && <span className="text-slate-400 font-normal text-[11px]">(opsional)</span>}
    </label>
  );
}

function InputField({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder:text-slate-300 ${className}`}
    />
  );
}

function SelectField({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 outline-none transition-all ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

export default function EditReportModal({ report, onClose }: EditReportModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const [formData, setFormData] = useState({
    target_name: report.target_name ?? '',
    category: report.category,
    chronology: report.chronology,
    bank_name: report.bank_name ?? '',
    loss_amount: report.loss_amount
      ? new Intl.NumberFormat('id-ID').format(report.loss_amount)
      : '',
    incident_date: report.incident_date ?? '',
    platform: report.platform ?? '',
    link_url: report.link_url ?? '',
    social_media_accounts: report.social_media_accounts?.length
      ? report.social_media_accounts
      : [''],
    has_other_victims: (report.has_other_victims ?? '') as '' | 'yes' | 'no',
    reported_to: report.reported_to ?? [],
  });

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
      const res = await fetch('/api/reports/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: report.id,
          target_name: formData.target_name || null,
          category: formData.category,
          chronology: formData.chronology,
          bank_name: formData.bank_name || null,
          loss_amount: formData.loss_amount
            ? parseInt(formData.loss_amount.replace(/\D/g, ''), 10)
            : null,
          incident_date: formData.incident_date || null,
          platform: formData.platform || null,
          link_url: formData.link_url || null,
          social_media_accounts: formData.social_media_accounts.filter(Boolean),
          has_other_victims: formData.has_other_victims || null,
          reported_to: formData.reported_to,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
        handleClose();
      } else {
        setError(data.message || 'Gagal menyimpan perubahan.');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Drawer — slide from right */}
      <div
        className={`relative ml-auto h-full w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <FilePen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Edit Laporan</h2>
              <p className="text-[11px] text-slate-400 font-mono">{report.target_number}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Setelah menyimpan, laporan akan otomatis masuk ke antrian review admin kembali.
          </p>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Nomor (readonly) */}
            <div className="space-y-1.5">
              <FieldLabel label="Nomor" />
              <InputField
                value={report.target_number}
                disabled
                className="opacity-40 cursor-not-allowed bg-slate-50"
              />
            </div>

            {/* Nama pemilik */}
            <div className="space-y-1.5">
              <FieldLabel label="Nama Pemilik" optional />
              <InputField
                type="text"
                value={formData.target_name}
                onChange={(e) => setFormData({ ...formData, target_name: e.target.value })}
                placeholder="Budi Santoso"
              />
            </div>

            {/* Kategori */}
            <div className="space-y-1.5">
              <FieldLabel label="Kategori Penipuan" />
              <SelectField
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categoryList.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </SelectField>
            </div>

            {/* Kerugian & Tanggal */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel label="Kerugian" optional />
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold select-none">Rp</span>
                  <input
                    type="text"
                    value={formData.loss_amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({
                        ...formData,
                        loss_amount: val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '',
                      });
                    }}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-100 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel label="Tanggal Kejadian" optional />
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Platform & Link */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel label="Platform" optional />
                <SelectField
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                >
                  <option value="">Pilih...</option>
                  {platformList.map(p => <option key={p.value} value={p.value}>{p.value}</option>)}
                </SelectField>
              </div>
              <div className="space-y-1.5">
                <FieldLabel label="Link / URL" optional />
                <InputField
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Akun sosmed */}
            <div className="space-y-1.5">
              <FieldLabel label="Akun Media Sosial Penipu" optional />
              <div className="space-y-2">
                {formData.social_media_accounts.map((val, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">@</span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateSocialField(i, e.target.value)}
                        placeholder="username atau link profil"
                        className="w-full pl-7 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                    {formData.social_media_accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSocialField(i)}
                        className="w-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {formData.social_media_accounts.length < 4 && (
                  <button
                    type="button"
                    onClick={addSocialField}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors mt-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah akun lain
                  </button>
                )}
              </div>
            </div>

            {/* Ada korban lain */}
            <div className="space-y-1.5">
              <FieldLabel label="Ada korban lain?" optional />
              <div className="flex gap-2">
                {[
                  { val: 'yes', label: '👥 Ya, ada korban lain' },
                  { val: 'no',  label: '🙋 Hanya saya' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() =>
                      setFormData(f => ({
                        ...f,
                        has_other_victims: f.has_other_victims === opt.val ? '' : opt.val as 'yes' | 'no',
                      }))
                    }
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      formData.has_other_victims === opt.val
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sudah lapor ke */}
            <div className="space-y-1.5">
              <FieldLabel label="Sudah lapor ke mana?" optional />
              <div className="grid grid-cols-2 gap-2">
                {reportedToOptions.map(opt => {
                  const active = formData.reported_to.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleReportedTo(opt.value)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kronologi */}
            <div className="space-y-1.5">
              <FieldLabel label="Kronologi" />
              <textarea
                required
                rows={5}
                minLength={20}
                value={formData.chronology}
                onChange={(e) => setFormData({ ...formData, chronology: e.target.value })}
                placeholder="Ceritakan bagaimana penipuan terjadi..."
                className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all outline-none resize-none placeholder:text-slate-300"
              />
            </div>

          </div>

          {/* Footer sticky */}
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 shrink-0">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                : <><Send className="w-4 h-4" /> Simpan & Kirim ke Review</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}