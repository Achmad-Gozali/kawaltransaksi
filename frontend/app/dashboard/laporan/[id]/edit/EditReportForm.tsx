'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EditReportFormProps {
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
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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
  { value: 'polisi', label: 'Polisi' },
  { value: 'ojk', label: 'OJK' },
  { value: 'platform', label: 'Platform' },
  { value: 'belum', label: 'Belum lapor' },
];

function FieldLabel({ label, optional, badge }: { label: string; optional?: boolean; badge?: string }) {
  return (
    <label className="text-sm font-medium text-neutral-600 flex items-center gap-2 mb-2">
      {label}
      {badge && (
        <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded font-normal">
          {badge}
        </span>
      )}
      {optional && (
        <span className="text-xs text-neutral-400 font-normal">(opsional)</span>
      )}
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 mb-4">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-6">{title}</p>
      {children}
    </div>
  );
}

function InputField({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-base text-neutral-900 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 outline-none transition-all placeholder:text-neutral-300 ${className}`}
    />
  );
}

function SelectField({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-base text-neutral-900 appearance-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 outline-none transition-all ${className}`}
      >
        {children}
      </select>
      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

export default function EditReportForm({ report }: EditReportFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Ambil token dari Supabase
      const { createClient } = await import('@/lib/supabase-browser');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Sesi habis. Silakan login ulang.');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/reports/${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
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
        router.push('/dashboard/laporan');
        router.refresh();
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
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <button
          onClick={() => router.push('/dashboard/laporan')}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke laporan saya
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight mb-1">Edit Laporan</h1>
          <p className="text-base font-mono text-neutral-400">{report.target_number}</p>
        </div>

        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-8">
          <p className="text-sm text-amber-700 leading-relaxed">
            Setelah menyimpan, laporan akan masuk ke antrian review admin kembali.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Card title="Informasi dasar">
            <div className="space-y-5">
              <div>
                <FieldLabel label="Nomor" badge="tidak bisa diubah" />
                <InputField value={report.target_number} disabled className="opacity-40 cursor-not-allowed" />
              </div>
              <div>
                <FieldLabel label="Nama pemilik" optional />
                <InputField
                  type="text"
                  value={formData.target_name}
                  onChange={e => setFormData({ ...formData, target_name: e.target.value })}
                  placeholder="Budi Santoso"
                />
              </div>
              <div>
                <FieldLabel label="Kategori penipuan" />
                <SelectField
                  required
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {categoryList.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </SelectField>
              </div>
            </div>
          </Card>

          <Card title="Detail kejadian">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Kerugian" optional />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-medium select-none">Rp</span>
                    <InputField
                      type="text"
                      value={formData.loss_amount}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, loss_amount: val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '' });
                      }}
                      placeholder="0"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel label="Tanggal kejadian" optional />
                  <InputField
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.incident_date}
                    onChange={e => setFormData({ ...formData, incident_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Platform" optional />
                  <SelectField
                    value={formData.platform}
                    onChange={e => setFormData({ ...formData, platform: e.target.value })}
                  >
                    <option value="">Pilih...</option>
                    {platformList.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </SelectField>
                </div>
                <div>
                  <FieldLabel label="Link / URL" optional />
                  <InputField
                    type="url"
                    value={formData.link_url}
                    onChange={e => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <FieldLabel label="Akun media sosial penipu" optional />
                <div className="space-y-2">
                  {formData.social_media_accounts.map((val, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base select-none">@</span>
                        <InputField
                          type="text"
                          value={val}
                          onChange={e => updateSocialField(i, e.target.value)}
                          placeholder="username atau link profil"
                          className="pl-8"
                        />
                      </div>
                      {formData.social_media_accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSocialField(i)}
                          className="px-4 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-neutral-200 transition-all text-sm font-medium"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.social_media_accounts.length < 4 && (
                    <button
                      type="button"
                      onClick={addSocialField}
                      className="text-sm font-medium text-neutral-400 hover:text-neutral-700 transition-colors mt-1"
                    >
                      + Tambah akun lain
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Kronologi">
            <textarea
              required
              rows={7}
              minLength={20}
              value={formData.chronology}
              onChange={e => setFormData({ ...formData, chronology: e.target.value })}
              placeholder="Ceritakan bagaimana penipuan terjadi..."
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-base text-neutral-900 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 outline-none resize-none transition-all placeholder:text-neutral-300"
            />
          </Card>

          <Card title="Informasi tambahan">
            <div className="space-y-5">
              <div>
                <FieldLabel label="Ada korban lain?" optional />
                <div className="flex gap-3">
                  {[
                    { val: 'yes', label: 'Ya, ada korban lain' },
                    { val: 'no', label: 'Hanya saya' },
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
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                        formData.has_other_victims === opt.val
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel label="Sudah lapor ke mana?" optional />
                <div className="grid grid-cols-2 gap-2">
                  {reportedToOptions.map(opt => {
                    const active = formData.reported_to.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleReportedTo(opt.value)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium border text-left transition-all ${
                          active
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard/laporan')}
              className="sm:flex-1 py-3.5 border border-neutral-200 rounded-xl text-base font-medium text-neutral-600 bg-white hover:bg-neutral-50 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="sm:flex-[2] py-3.5 bg-neutral-900 text-white rounded-xl text-base font-semibold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan & Kirim ke Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}