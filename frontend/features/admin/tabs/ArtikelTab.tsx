'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Loader2, CheckCircle2, AlertCircle, FileText,
  Eye, EyeOff, Pencil, X, Upload, ChevronDown, ChevronUp,
  Sparkles, Plus, Trash2,
} from 'lucide-react';
import SectionTitle from '@/features/admin/components/SectionTitle';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  status: string;
  cover_image: string | null;
  published_at: string;
  total_reports: number | null;
  top_category: string | null;
  created_at: string;
}

const CATEGORIES = [
  'Jual Beli Online',
  'Penipuan COD',
  'Penipuan Marketplace (Tokopedia/Shopee/OLX)',
  'Penipuan Toko Online / Website Palsu',
  'Penipuan Rental (Motor/Mobil/Kamera)',
  'Penipuan Tiket (Konser/Pesawat/Kereta)',
  'Penipuan Jasa & Freelance',
  'Penipuan Transfer Salah',
  'Penipuan Pre-Order (PO)',
  'Penipuan Dropship',
  'Penipuan Reseller',
  'Phishing / Social Engineering',
  'Penipuan WhatsApp & Telegram',
  'Penipuan OTP & Verifikasi',
  'Skimming & Carding',
  'Penipuan Akun Media Sosial',
  'Penipuan Link Berbahaya',
  'Penipuan Undian & Hadiah Palsu',
  'Penipuan Kurir Palsu',
  'Penipuan CS Palsu (Bank/E-commerce)',
  'Penipuan Aplikasi Palsu',
  'Penipuan QR Code',
  'Investasi Bodong',
  'Pinjaman Online Ilegal',
  'Penipuan Kripto & NFT',
  'Penipuan Arisan Online',
  'Penipuan MLM / Money Game',
  'Penipuan Forex & Trading',
  'Penipuan Binary Option',
  'Penipuan Koperasi Palsu',
  'Penipuan Robot Trading',
  'Penipuan Saham Palsu',
  'Penipuan Percintaan (Romance Scam)',
  'Penipuan Donasi & Crowdfunding Palsu',
  'Penipuan Berkedok Agama / Umroh',
  'Penipuan Darurat Keluarga',
  'Penipuan Santet / Dukun Online',
  'Penipuan Adopsi Hewan',
  'Lowongan Kerja Palsu',
  'Penipuan Magang & Beasiswa',
  'Penipuan Kerja Luar Negeri (TKI)',
  'Penipuan Endorse & Paid Promote',
  'Penipuan Admin Medsos',
  'Penipuan Kerja Online (Klik/Like/Subscribe)',
  'Penipuan Properti & Kontrakan',
  'Penipuan Jual Beli Kendaraan',
  'Penipuan Sewa Kos',
  'Penipuan Dokumen & Administrasi',
  'Penipuan KTP / Data Pribadi',
  'Penipuan BPJS & Asuransi',
  'Penipuan Pajak & Denda Palsu',
  'Penipuan Tilang Online Palsu',
  'Lainnya',
];

const CUSTOM_SENTINEL = '__custom__';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const s = type === 'error'
    ? 'bg-red-50 border-red-100 text-red-600'
    : 'bg-emerald-50 border-emerald-100 text-emerald-600';
  const Icon = type === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div className={`flex items-start gap-3 p-4 border rounded-2xl ${s}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function Btn({
  onClick, disabled, loading, icon: Icon, label, className, type,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ElementType;
  label: string;
  className: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors ${className}`}
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : Icon ? <Icon className="w-3.5 h-3.5" /> : null}
      {label}
    </button>
  );
}

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isCustom  = value === CUSTOM_SENTINEL || (value !== '' && !CATEGORIES.includes(value));
  const selectVal = isCustom ? 'Lainnya' : value;
  const customVal = value === CUSTOM_SENTINEL ? '' : (isCustom ? value : '');

  return (
    <div className="space-y-2">
      <select
        value={selectVal}
        onChange={e => {
          if (e.target.value === 'Lainnya') onChange(CUSTOM_SENTINEL);
          else onChange(e.target.value);
        }}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-emerald-400 transition-all"
      >
        <option value="">Pilih kategori...</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      {isCustom && (
        <input
          value={customVal}
          onChange={e => onChange(e.target.value)}
          placeholder="Tulis kategori sendiri..."
          autoFocus
          className="w-full px-3 py-2.5 bg-slate-50 border border-emerald-300 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-emerald-400 transition-all"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function ArtikelTab({ token }: { token: string }) {
  const [articles,    setArticles]    = useState<Article[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [fetched,     setFetched]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState<string | null>(null);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editFields,  setEditFields]  = useState({ title: '', summary: '', content: '' });
  const [savingId,    setSavingId]    = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [publishingId,setPublishingId]= useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [generating,  setGenerating]  = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [createFields,setCreateFields]= useState({ title: '', summary: '', content: '', category: '' });

  const fileInputRef    = useRef<HTMLInputElement>(null);
  const [uploadTargetId,setUploadTargetId] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/admin/articles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setArticles(data.data); setFetched(true); }
      else setError('Gagal memuat artikel.');
    } catch {
      setError('Gagal memuat artikel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  // ---------------------------------------------------------------------------
  // Generate AI
  // ---------------------------------------------------------------------------

  const handleGenerate = async () => {
    if (!confirm('Generate artikel otomatis berdasarkan laporan minggu ini?')) return;
    setGenerating(true);
    setError(null);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/admin/articles/generate`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Artikel berhasil di-generate! Cek di bagian Draft.');
        await fetchArticles();
      } else {
        setError(data.message || 'Gagal generate artikel.');
      }
    } catch {
      setError('Gagal generate artikel.');
    } finally {
      setGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Create manual
  // ---------------------------------------------------------------------------

  const handleCreate = async () => {
    const { title, summary, content, category } = createFields;
    if (!title.trim() || !summary.trim() || !content.trim()) {
      setError('Judul, summary, dan konten wajib diisi.');
      return;
    }
    const finalCategory = category === CUSTOM_SENTINEL ? null : (category || null);
    setCreating(true);
    setError(null);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/admin/articles`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ title, summary, content, top_category: finalCategory }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Artikel berhasil dibuat!');
        setShowCreateForm(false);
        setCreateFields({ title: '', summary: '', content: '', category: '' });
        await fetchArticles();
      } else {
        setError(data.message || 'Gagal membuat artikel.');
      }
    } catch {
      setError('Gagal membuat artikel.');
    } finally {
      setCreating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus artikel "${title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingId(id);
    setError(null);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/admin/articles/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setArticles(prev => prev.filter(a => a.id !== id));
        showSuccess('Artikel berhasil dihapus.');
      } else {
        setError(data.message || 'Gagal menghapus artikel.');
      }
    } catch {
      setError('Gagal menghapus artikel.');
    } finally {
      setDeletingId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Publish / unpublish
  // ---------------------------------------------------------------------------

  const handlePublishToggle = async (article: Article) => {
    setPublishingId(article.id);
    setError(null);
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      const res  = await fetch(`${BACKEND_URL}/api/admin/articles/${article.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setArticles(prev => prev.map(a => a.id === article.id ? { ...a, status: newStatus } : a));
        showSuccess(newStatus === 'published' ? 'Artikel berhasil dipublish!' : 'Artikel dijadikan draft.');
      } else {
        setError(data.message || 'Gagal update status.');
      }
    } catch {
      setError('Gagal update status.');
    } finally {
      setPublishingId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Edit & save
  // ---------------------------------------------------------------------------

  const handleSaveEdit = async (id: string) => {
    setSavingId(id);
    setError(null);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/admin/articles/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(editFields),
      });
      const data = await res.json();
      if (data.success) {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, ...editFields } : a));
        setEditingId(null);
        showSuccess('Artikel berhasil disimpan!');
      } else {
        setError(data.message || 'Gagal menyimpan.');
      }
    } catch {
      setError('Gagal menyimpan.');
    } finally {
      setSavingId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Upload cover — lewat backend, bukan Supabase langsung
  // ---------------------------------------------------------------------------

  const handleUploadCover = async (file: File, articleId: string) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format gambar harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5MB.');
      return;
    }

    setUploadingId(articleId);
    setError(null);

    try {
      // Kirim ke backend — backend yang upload ke Supabase Storage
      // pakai service role key, bypass RLS, tidak ada masalah permission
      const formData = new FormData();
      formData.append('file', file);

      const res  = await fetch(`${BACKEND_URL}/api/admin/articles/${articleId}/cover`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? 'Gagal upload gambar.');
        return;
      }

      setArticles(prev =>
        prev.map(a => a.id === articleId ? { ...a, cover_image: data.cover_url } : a)
      );
      showSuccess('Cover berhasil diupload!');
    } catch (err) {
      console.error('[cover-upload] unexpected error:', err);
      setError('Gagal upload gambar. Coba lagi.');
    } finally {
      setUploadingId(null);
      setUploadTargetId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const drafts    = articles.filter(a => a.status === 'draft');
  const published = articles.filter(a => a.status === 'published');

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4 w-full">
      <SectionTitle title="Artikel" subtitle="Kelola artikel penipuan mingguan" />

      {/* Hidden file input — trigger dari tombol Upload Cover di tiap row */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && uploadTargetId) handleUploadCover(file, uploadTargetId);
          e.target.value = '';
        }}
      />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Btn
          onClick={handleGenerate}
          disabled={generating}
          loading={generating}
          icon={Sparkles}
          label={generating ? 'Generating...' : 'Generate AI'}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        />
        <Btn
          onClick={() => setShowCreateForm(!showCreateForm)}
          icon={Plus}
          label="Buat Manual"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700"
        />
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
          <p className="text-sm font-bold text-slate-800">Buat Artikel Baru</p>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judul *</label>
            <input
              value={createFields.title}
              onChange={e => setCreateFields(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Judul artikel..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Summary *</label>
            <textarea
              value={createFields.summary}
              onChange={e => setCreateFields(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Ringkasan singkat artikel..."
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-emerald-400 transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kategori</label>
            <CategorySelect
              value={createFields.category}
              onChange={v => setCreateFields(prev => ({ ...prev, category: v }))}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Konten (Markdown) *</label>
            <textarea
              value={createFields.content}
              onChange={e => setCreateFields(prev => ({ ...prev, content: e.target.value }))}
              placeholder="## Judul Section&#10;&#10;Isi konten artikel..."
              rows={10}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono focus:outline-none focus:border-emerald-400 transition-all resize-y"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Btn
              onClick={handleCreate}
              disabled={creating}
              loading={creating}
              icon={CheckCircle2}
              label="Simpan Draft"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            />
            <Btn
              onClick={() => {
                setShowCreateForm(false);
                setCreateFields({ title: '', summary: '', content: '', category: '' });
              }}
              icon={X}
              label="Batal"
              className="bg-slate-100 hover:bg-slate-200 text-slate-600"
            />
          </div>
        </div>
      )}

      {error   && <Alert type="error"   message={error} />}
      {success && <Alert type="success" message={success} />}

      {!fetched && loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {fetched && (
        <>
          <ArticleSection
            title={`Draft (${drafts.length})`}
            subtitle="Belum dipublish — tambah gambar & review dulu"
            articles={drafts}
            loading={loading}
            onRefresh={fetchArticles}
            expandedId={expandedId}
            onToggleExpand={id => setExpandedId(expandedId === id ? null : id)}
            editingId={editingId}
            editFields={editFields}
            onEditFields={setEditFields}
            onStartEdit={a => {
              setEditingId(a.id);
              setEditFields({ title: a.title, summary: a.summary, content: a.content ?? '' });
            }}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={handleSaveEdit}
            savingId={savingId}
            uploadingId={uploadingId}
            publishingId={publishingId}
            deletingId={deletingId}
            onUpload={id => { setUploadTargetId(id); fileInputRef.current?.click(); }}
            onPublishToggle={handlePublishToggle}
            onDelete={handleDelete}
          />
          <ArticleSection
            title={`Published (${published.length})`}
            subtitle="Tampil di website — bisa unpublish kapan saja"
            articles={published}
            loading={loading}
            expandedId={expandedId}
            onToggleExpand={id => setExpandedId(expandedId === id ? null : id)}
            editingId={editingId}
            editFields={editFields}
            onEditFields={setEditFields}
            onStartEdit={a => {
              setEditingId(a.id);
              setEditFields({ title: a.title, summary: a.summary, content: a.content ?? '' });
            }}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={handleSaveEdit}
            savingId={savingId}
            uploadingId={uploadingId}
            publishingId={publishingId}
            deletingId={deletingId}
            onUpload={id => { setUploadTargetId(id); fileInputRef.current?.click(); }}
            onPublishToggle={handlePublishToggle}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ArticleSection
// ---------------------------------------------------------------------------

function ArticleSection({
  title, subtitle, articles, loading, onRefresh,
  expandedId, onToggleExpand, editingId, editFields, onEditFields,
  onStartEdit, onCancelEdit, onSaveEdit, savingId, uploadingId,
  publishingId, deletingId, onUpload, onPublishToggle, onDelete,
}: {
  title: string;
  subtitle: string;
  articles: Article[];
  loading: boolean;
  onRefresh?: () => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  editingId: string | null;
  editFields: { title: string; summary: string; content: string };
  onEditFields: (f: { title: string; summary: string; content: string }) => void;
  onStartEdit: (a: Article) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  savingId: string | null;
  uploadingId: string | null;
  publishingId: string | null;
  deletingId: string | null;
  onUpload: (id: string) => void;
  onPublishToggle: (a: Article) => void;
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{subtitle}</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Refresh'}
          </button>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="p-10 text-center">
          <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Tidak ada artikel</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {articles.map(article => (
            <ArticleRow
              key={article.id}
              article={article}
              expanded={expandedId === article.id}
              onToggleExpand={() => onToggleExpand(article.id)}
              editing={editingId === article.id}
              editFields={editFields}
              onEditFields={onEditFields}
              onStartEdit={() => onStartEdit(article)}
              onCancelEdit={onCancelEdit}
              onSaveEdit={() => onSaveEdit(article.id)}
              saving={savingId === article.id}
              uploading={uploadingId === article.id}
              publishing={publishingId === article.id}
              deleting={deletingId === article.id}
              onUpload={() => onUpload(article.id)}
              onPublishToggle={() => onPublishToggle(article)}
              onDelete={() => onDelete(article.id, article.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ArticleRow
// ---------------------------------------------------------------------------

function ArticleRow({
  article, expanded, onToggleExpand, editing, editFields, onEditFields,
  onStartEdit, onCancelEdit, onSaveEdit, saving, uploading, publishing,
  deleting, onUpload, onPublishToggle, onDelete,
}: {
  article: Article;
  expanded: boolean;
  onToggleExpand: () => void;
  editing: boolean;
  editFields: { title: string; summary: string; content: string };
  onEditFields: (f: { title: string; summary: string; content: string }) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  saving: boolean;
  uploading: boolean;
  publishing: boolean;
  deleting: boolean;
  onUpload: () => void;
  onPublishToggle: () => void;
  onDelete: () => void;
}) {
  const isPublished = article.status === 'published';

  // Tombol aksi — dipakai di mobile (icon only) dan desktop (dengan label)
  const actions = [
    {
      onClick:  onUpload,
      disabled: uploading,
      loading:  uploading,
      Icon:     Upload,
      label:    article.cover_image ? 'Ganti Cover' : 'Upload Cover',
      cls:      'bg-slate-100 hover:bg-slate-200 text-slate-600',
    },
    {
      onClick:  onPublishToggle,
      disabled: publishing,
      loading:  publishing,
      Icon:     isPublished ? EyeOff : Eye,
      label:    isPublished ? 'Unpublish' : 'Publish',
      cls:      isPublished
        ? 'bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-600'
        : 'bg-emerald-500 hover:bg-emerald-600 text-white',
    },
    {
      onClick:  onDelete,
      disabled: deleting,
      loading:  deleting,
      Icon:     Trash2,
      label:    'Hapus',
      cls:      'bg-red-50 hover:bg-red-100 text-red-500',
    },
  ] as const;

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">

        {/* Thumbnail */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200">
          {article.cover_image ? (
            <div className="relative w-full h-full">
              <Image src={article.cover_image} alt={article.title} fill className="object-cover" />
            </div>
          ) : (
            <FileText className="w-5 h-5 text-slate-300" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isPublished
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
            {article.top_category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 hidden sm:inline">
                {article.top_category}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
            {article.title}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(article.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile: icon only */}
          {actions.map(({ onClick, disabled, loading, Icon, cls }, i) => (
            <button
              key={i}
              onClick={onClick}
              disabled={disabled}
              className={`w-8 h-8 sm:hidden flex items-center justify-center rounded-xl disabled:opacity-50 transition-colors ${cls}`}
            >
              {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Icon className="w-3.5 h-3.5" />}
            </button>
          ))}

          {/* Desktop: dengan label */}
          {actions.map(({ onClick, disabled, loading, Icon, label, cls }, i) => (
            <Btn
              key={i}
              onClick={onClick}
              disabled={disabled}
              loading={loading}
              icon={Icon}
              label={label}
              className={`hidden sm:flex ${cls}`}
            />
          ))}

          <button
            onClick={onToggleExpand}
            className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            {expanded
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {!editing ? (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Summary</p>
                <p className="text-sm text-slate-700 leading-relaxed">{article.summary}</p>
              </div>
              <Btn
                onClick={onStartEdit}
                icon={Pencil}
                label="Edit Konten"
                className="bg-slate-100 hover:bg-slate-200 text-slate-600"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {([
                { label: 'Judul',              key: 'title',   type: 'input'    },
                { label: 'Summary',            key: 'summary', type: 'textarea', rows: 2  },
                { label: 'Konten (Markdown)',  key: 'content', type: 'textarea', rows: 12, mono: true },
              ] as { label: string; key: keyof typeof editFields; type: string; rows?: number; mono?: boolean }[]).map(
                ({ label, key, type, rows, mono }) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {label}
                    </label>
                    {type === 'input' ? (
                      <input
                        value={editFields[key]}
                        onChange={e => onEditFields({ ...editFields, [key]: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400 transition-all"
                      />
                    ) : (
                      <textarea
                        value={editFields[key]}
                        onChange={e => onEditFields({ ...editFields, [key]: e.target.value })}
                        rows={rows}
                        className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-emerald-400 transition-all resize-y ${mono ? 'font-mono' : ''}`}
                      />
                    )}
                  </div>
                )
              )}
              <div className="flex gap-2 flex-wrap">
                <Btn
                  onClick={onSaveEdit}
                  disabled={saving}
                  loading={saving}
                  icon={CheckCircle2}
                  label="Simpan"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                />
                <Btn
                  onClick={onCancelEdit}
                  icon={X}
                  label="Batal"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}