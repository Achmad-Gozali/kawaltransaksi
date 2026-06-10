'use client';

import { useState, useRef } from 'react';
import {
  MessageCircle, X, Bug, Lightbulb, Layout, MoreHorizontal,
  ChevronRight, Loader2, CheckCircle2, Upload, Trash2,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/core/supabase/browser';

// ---------------------------------------------
// Types
// ---------------------------------------------

type Category = 'bug' | 'feature' | 'ui_ux' | 'other';
type Urgency  = 'low' | 'medium' | 'high' | 'critical';
type Step     = 'category' | 'form' | 'success';

// ---------------------------------------------
// Config
// ---------------------------------------------

const CATEGORIES: {
  value:   Category;
  label:   string;
  icon:    React.ElementType;
  desc:    string;
  border:  string;
  iconBg:  string;
  iconColor: string;
}[] = [
  {
    value:     'bug',
    label:     'Laporkan Bug',
    icon:      Bug,
    desc:      'Ada yang tidak berjalan dengan benar',
    border:    'hover:border-red-300 hover:bg-red-50/40',
    iconBg:    'bg-red-50',
    iconColor: 'text-red-500',
  },
  {
    value:     'feature',
    label:     'Saran Fitur',
    icon:      Lightbulb,
    desc:      'Ide atau fitur baru yang kamu inginkan',
    border:    'hover:border-amber-300 hover:bg-amber-50/40',
    iconBg:    'bg-amber-50',
    iconColor: 'text-amber-500',
  },
  {
    value:     'ui_ux',
    label:     'Feedback UI/UX',
    icon:      Layout,
    desc:      'Tampilan atau pengalaman pengguna',
    border:    'hover:border-blue-300 hover:bg-blue-50/40',
    iconBg:    'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    value:     'other',
    label:     'Lainnya',
    icon:      MoreHorizontal,
    desc:      'Hal lain yang ingin kamu sampaikan',
    border:    'hover:border-slate-300 hover:bg-slate-50/40',
    iconBg:    'bg-slate-100',
    iconColor: 'text-slate-500',
  },
];

const URGENCY_OPTIONS: {
  value:   Urgency;
  label:   string;
  desc:    string;
  active:  string;
  inactive: string;
}[] = [
  { value: 'low',      label: 'Low',      desc: 'Tidak mendesak',           active: 'bg-emerald-500 text-white border-emerald-500', inactive: 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50' },
  { value: 'medium',   label: 'Medium',   desc: 'Perlu diperhatikan',       active: 'bg-amber-500 text-white border-amber-500',     inactive: 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'     },
  { value: 'high',     label: 'High',     desc: 'Mengganggu penggunaan',    active: 'bg-orange-500 text-white border-orange-500',   inactive: 'border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'   },
  { value: 'critical', label: 'Critical', desc: 'Tidak bisa digunakan',     active: 'bg-red-500 text-white border-red-500',         inactive: 'border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50'             },
];

const MAX_SCREENSHOTS = 3;
const MAX_FILE_SIZE   = 5 * 1024 * 1024;

// ---------------------------------------------
// Field types per kategori
// ---------------------------------------------

interface BugFields     { title: string; description: string; steps: string; device: string }
interface FeatureFields { title: string; problem: string; solution: string; benefit: string }
interface UiUxFields    { title: string; page: string; problem: string; suggestion: string }
interface OtherFields   { title: string; message: string }

// ---------------------------------------------
// Reusable field components
// ---------------------------------------------

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder: string; maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
    />
  );
}

function Textarea({ value, onChange, placeholder, maxLength, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder: string; maxLength?: number; rows?: number;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
      />
      {maxLength && (
        <p className="text-[11px] text-slate-400 text-right mt-0.5">{value.length}/{maxLength}</p>
      )}
    </div>
  );
}

// ---------------------------------------------
// Form per kategori
// ---------------------------------------------

function BugForm({ f, set }: { f: BugFields; set: (v: Partial<BugFields>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel required>Judul bug</FieldLabel>
        <Input value={f.title} onChange={(v) => set({ title: v })} placeholder="Contoh: Tombol submit tidak bisa diklik di halaman /report" maxLength={150} />
      </div>
      <div>
        <FieldLabel required>Apa yang terjadi?</FieldLabel>
        <Textarea value={f.description} onChange={(v) => set({ description: v })} placeholder="Jelaskan bug yang kamu temukan. Apa yang kamu harapkan terjadi vs apa yang sebenarnya terjadi?" maxLength={1000} rows={3} />
      </div>
      <div>
        <FieldLabel>Langkah untuk mereproduksi</FieldLabel>
        <Textarea value={f.steps} onChange={(v) => set({ steps: v })} placeholder={`1. Buka halaman ...\n2. Klik tombol ...\n3. Bug muncul saat ...`} maxLength={500} rows={3} />
      </div>
      <div>
        <FieldLabel>Browser & perangkat</FieldLabel>
        <Input value={f.device} onChange={(v) => set({ device: v })} placeholder="Contoh: Chrome 120 / MacBook Pro, Safari / iPhone 15" maxLength={100} />
      </div>
    </div>
  );
}

function FeatureForm({ f, set }: { f: FeatureFields; set: (v: Partial<FeatureFields>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel required>Nama fitur yang diusulkan</FieldLabel>
        <Input value={f.title} onChange={(v) => set({ title: v })} placeholder="Contoh: Filter laporan berdasarkan kota" maxLength={150} />
      </div>
      <div>
        <FieldLabel required>Masalah apa yang ingin diselesaikan?</FieldLabel>
        <Textarea value={f.problem} onChange={(v) => set({ problem: v })} placeholder="Ceritakan situasi atau kesulitan yang kamu hadapi saat ini yang mendorong kamu mengusulkan fitur ini..." maxLength={600} rows={3} />
      </div>
      <div>
        <FieldLabel required>Solusi atau ide fiturnya seperti apa?</FieldLabel>
        <Textarea value={f.solution} onChange={(v) => set({ solution: v })} placeholder="Jelaskan fitur yang kamu bayangkan. Bagaimana cara kerjanya? Seperti apa tampilannya?" maxLength={600} rows={3} />
      </div>
      <div>
        <FieldLabel>Siapa yang paling diuntungkan?</FieldLabel>
        <Input value={f.benefit} onChange={(v) => set({ benefit: v })} placeholder="Contoh: Semua user, admin, pelapor pemula, dll." maxLength={150} />
      </div>
    </div>
  );
}

function UiUxForm({ f, set }: { f: UiUxFields; set: (v: Partial<UiUxFields>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel required>Judul feedback</FieldLabel>
        <Input value={f.title} onChange={(v) => set({ title: v })} placeholder="Contoh: Tombol CTA susah ditemukan di mobile" maxLength={150} />
      </div>
      <div>
        <FieldLabel>Halaman yang bermasalah</FieldLabel>
        <Input value={f.page} onChange={(v) => set({ page: v })} placeholder="Contoh: /report, /check/08xxx, beranda" maxLength={200} />
      </div>
      <div>
        <FieldLabel required>Apa yang membingungkan atau mengganggu?</FieldLabel>
        <Textarea value={f.problem} onChange={(v) => set({ problem: v })} placeholder="Jelaskan elemen UI/UX yang terasa membingungkan, tidak intuitif, atau mengganggu pengalaman kamu..." maxLength={600} rows={3} />
      </div>
      <div>
        <FieldLabel>Saran perbaikanmu</FieldLabel>
        <Textarea value={f.suggestion} onChange={(v) => set({ suggestion: v })} placeholder="Kalau kamu punya ide solusinya, ceritakan di sini. Tidak wajib, tapi sangat membantu!" maxLength={400} rows={2} />
      </div>
    </div>
  );
}

function OtherForm({ f, set }: { f: OtherFields; set: (v: Partial<OtherFields>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel required>Judul</FieldLabel>
        <Input value={f.title} onChange={(v) => set({ title: v })} placeholder="Ringkasan singkat pesanmu" maxLength={150} />
      </div>
      <div>
        <FieldLabel required>Pesan</FieldLabel>
        <Textarea value={f.message} onChange={(v) => set({ message: v })} placeholder="Ceritakan apa yang ingin kamu sampaikan kepada tim KawalTransaksi..." maxLength={2000} rows={5} />
      </div>
    </div>
  );
}

// ---------------------------------------------
// Build description dari fields
// ---------------------------------------------

function buildDescription(category: Category, fields: any): string {
  switch (category) {
    case 'bug': {
      const f = fields as BugFields;
      let d = f.description;
      if (f.steps.trim())  d += `\n\n--- Langkah Reproduksi ---\n${f.steps}`;
      if (f.device.trim()) d += `\n\n--- Browser & Perangkat ---\n${f.device}`;
      return d;
    }
    case 'feature': {
      const f = fields as FeatureFields;
      let d = `Masalah yang ingin diselesaikan:\n${f.problem}\n\nSolusi yang diusulkan:\n${f.solution}`;
      if (f.benefit.trim()) d += `\n\nTarget pengguna:\n${f.benefit}`;
      return d;
    }
    case 'ui_ux': {
      const f = fields as UiUxFields;
      let d = `Yang membingungkan/mengganggu:\n${f.problem}`;
      if (f.page.trim())       d += `\n\nHalaman bermasalah:\n${f.page}`;
      if (f.suggestion.trim()) d += `\n\nSaran perbaikan:\n${f.suggestion}`;
      return d;
    }
    case 'other':
      return (fields as OtherFields).message;
  }
}

function getTitle(category: Category, fields: any): string {
  return (fields as any).title ?? '';
}

function isValid(category: Category, fields: any): boolean {
  switch (category) {
    case 'bug':     { const f = fields as BugFields;     return f.title.trim().length >= 5 && f.description.trim().length >= 10; }
    case 'feature': { const f = fields as FeatureFields; return f.title.trim().length >= 5 && f.problem.trim().length >= 10 && f.solution.trim().length >= 10; }
    case 'ui_ux':   { const f = fields as UiUxFields;    return f.title.trim().length >= 5 && f.problem.trim().length >= 10; }
    case 'other':   { const f = fields as OtherFields;   return f.title.trim().length >= 5 && f.message.trim().length >= 10; }
  }
}

// ---------------------------------------------
// Main Component
// ---------------------------------------------

export default function FeedbackButton() {
  const [open, setOpen]         = useState(false);
  const [step, setStep]         = useState<Step>('category');
  const [category, setCategory] = useState<Category | null>(null);
  const [urgency, setUrgency]   = useState<Urgency>('low');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [uploading, setUploading]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]       = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bugF,     setBugF]     = useState<BugFields>    ({ title: '', description: '', steps: '', device: '' });
  const [featureF, setFeatureF] = useState<FeatureFields>({ title: '', problem: '', solution: '', benefit: '' });
  const [uiUxF,    setUiUxF]    = useState<UiUxFields>   ({ title: '', page: '', problem: '', suggestion: '' });
  const [otherF,   setOtherF]   = useState<OtherFields>  ({ title: '', message: '' });

  const getFields = () => {
    if (category === 'bug')     return bugF;
    if (category === 'feature') return featureF;
    if (category === 'ui_ux')   return uiUxF;
    if (category === 'other')   return otherF;
    return {};
  };

  const reset = () => {
    setStep('category'); setCategory(null); setUrgency('low');
    setScreenshots([]); setError('');
    setBugF({ title: '', description: '', steps: '', device: '' });
    setFeatureF({ title: '', problem: '', solution: '', benefit: '' });
    setUiUxF({ title: '', page: '', problem: '', suggestion: '' });
    setOtherF({ title: '', message: '' });
  };

  const handleClose = () => { setOpen(false); setTimeout(reset, 300); };

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    if (cat === 'ui_ux' && typeof window !== 'undefined') {
      setUiUxF(prev => ({ ...prev, page: window.location.pathname }));
    }
    setStep('form');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.size <= MAX_FILE_SIZE && f.type.startsWith('image/'));
    const remaining = MAX_SCREENSHOTS - screenshots.length;
    setScreenshots(prev => [...prev, ...files.slice(0, remaining)]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadScreenshots = async (supabase: ReturnType<typeof createClient>): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of screenshots) {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const name = `feedback/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('evidence').upload(name, file, { cacheControl: '3600', upsert: false });
      if (error) throw new Error(`Gagal upload: ${error.message}`);
      const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(data.path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!category) return;
    const fields = getFields();
    if (!isValid(category, fields)) { setError('Lengkapi semua field yang wajib diisi.'); return; }
    setError(''); setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      let screenshotUrls: string[] = [];
      if (screenshots.length > 0) { setUploading(true); screenshotUrls = await uploadScreenshots(supabase); setUploading(false); }
      const { error: insertError } = await supabase.from('feedback').insert({
        user_id:         user?.id ?? null,
        user_email:      user?.email ?? null,
        category,
        title:           getTitle(category, fields).trim(),
        description:     buildDescription(category, fields).trim(),
        page_url:        typeof window !== 'undefined' ? window.location.href : null,
        urgency,
        screenshot_urls: screenshotUrls,
        status:          'pending',
      });
      if (insertError) throw new Error(insertError.message);
      setStep('success');
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCat = CATEGORIES.find(c => c.value === category);
  const canSubmit   = category ? isValid(category, getFields()) : false;
  const showUrgency = category === 'bug' || category === 'ui_ux';

  return (
    <>
      {/* -- Floating Button -- */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full shadow-lg hover:bg-slate-700 active:scale-95 transition-all"
        aria-label="Beri feedback"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Feedback</span>
      </button>

      {/* -- Backdrop -- */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* -- Modal -- */}
          <div className="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh]">

            {/* Drag handle -- mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* -- Header -- */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {step === 'form' && (
                  <button
                    onClick={() => setStep('category')}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                )}
                {step === 'form' && selectedCat && (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedCat.iconBg}`}>
                    <selectedCat.icon className={`w-4 h-4 ${selectedCat.iconColor}`} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {step === 'category' && 'Kasih feedback'}
                    {step === 'form'     && selectedCat?.label}
                    {step === 'success'  && 'Terima kasih!'}
                  </p>
                  {step === 'form' && (
                    <p className="text-xs text-slate-400 truncate">{selectedCat?.desc}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* -- Step: Pilih Kategori -- */}
            {step === 'category' && (
              <div className="p-4 space-y-3 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => handleCategorySelect(cat.value)}
                        className={`flex flex-col items-start gap-3 p-4 border border-slate-200 rounded-xl text-left transition-all ${cat.border}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBg}`}>
                          <Icon className={`w-4 h-4 ${cat.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{cat.label}</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cat.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Info */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Feedback ini untuk pengembangan aplikasi. Untuk melaporkan penipuan, gunakan fitur <strong>Laporkan</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* -- Step: Form -- */}
            {step === 'form' && category && (
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-4 sm:p-5 space-y-5">

                  {/* Form spesifik per kategori */}
                  {category === 'bug'     && <BugForm     f={bugF}     set={(v) => setBugF(p => ({ ...p, ...v }))}     />}
                  {category === 'feature' && <FeatureForm f={featureF} set={(v) => setFeatureF(p => ({ ...p, ...v }))} />}
                  {category === 'ui_ux'   && <UiUxForm    f={uiUxF}    set={(v) => setUiUxF(p => ({ ...p, ...v }))}    />}
                  {category === 'other'   && <OtherForm   f={otherF}   set={(v) => setOtherF(p => ({ ...p, ...v }))}   />}

                  {/* Urgency -- hanya untuk bug & ui_ux */}
                  {showUrgency && (
                    <div>
                      <FieldLabel>Tingkat urgensi</FieldLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {URGENCY_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setUrgency(opt.value)}
                            className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${urgency === opt.value ? opt.active : opt.inactive}`}
                          >
                            <p className="font-bold">{opt.label}</p>
                            <p className={`text-[10px] mt-0.5 font-normal ${urgency === opt.value ? 'opacity-75' : 'text-slate-400'}`}>{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Screenshot */}
                  <div>
                    <FieldLabel>Screenshot <span className="text-slate-400 font-normal normal-case">(opsional, maks {MAX_SCREENSHOTS})</span></FieldLabel>

                    {screenshots.length > 0 && (
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {screenshots.map((file, i) => (
                          <div key={i} className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={URL.createObjectURL(file)} alt={`Screenshot ${i + 1}`} className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                            <button
                              onClick={() => setScreenshots(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {screenshots.length < MAX_SCREENSHOTS && (
                      <>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-slate-300 rounded-xl text-sm text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all"
                        >
                          <Upload className="w-4 h-4" />
                          Klik untuk pilih foto
                        </button>
                        <p className="text-[11px] text-slate-400 mt-1">Maks 5MB per foto - JPG, PNG, WebP</p>
                      </>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* -- Step: Success -- */}
            {step === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base mb-1.5">Feedback terkirim!</p>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                    Masukan kamu sudah kami terima. Tim KawalTransaksi akan meninjaunya secepatnya.
                  </p>
                </div>
                <button onClick={handleClose} className="mt-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors">
                  Tutup
                </button>
              </div>
            )}

            {/* -- Submit button -- sticky bawah -- */}
            {step === 'form' && (
              <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-slate-100 bg-white">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmit}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{uploading ? 'Mengupload foto...' : 'Mengirim...'}</>
                  ) : 'Kirim feedback'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}