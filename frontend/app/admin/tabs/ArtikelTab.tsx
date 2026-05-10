'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';
import {
  Loader2, CheckCircle2, AlertCircle, FileText,
  Eye, EyeOff, Pencil, X, Upload, ChevronDown, ChevronUp,
  Sparkles, Plus,
} from 'lucide-react';
import SectionTitle from '../components/SectionTitle';

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const CATEGORIES = [
  'Jual Beli Online', 'Phishing / Soceng', 'Investasi Bodong',
  'Lowongan Kerja Palsu', 'Penipuan Percintaan', 'Pinjaman Online',
];

export default function ArtikelTab({ token }: { token: string }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const supabase = createClient();

  // Generate state
  const [generating, setGenerating] = useState(false);

  // Create manual state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createSummary, setCreateSummary] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchArticles = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/articles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setArticles(data.data); setFetched(true); }
      else setError('Gagal memuat artikel.');
    } catch { setError('Gagal memuat artikel.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchArticles(); }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleGenerate = async () => {
    if (!confirm('Generate artikel otomatis berdasarkan laporan minggu ini?')) return;
    setGenerating(true); setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/articles/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Artikel berhasil di-generate! Cek di bagian Draft.');
        await fetchArticles();
      } else setError(data.message || 'Gagal generate artikel.');
    } catch { setError('Gagal generate artikel.'); }
    finally { setGenerating(false); }
  };

  const handleCreate = async () => {
    if (!createTitle.trim() || !createSummary.trim() || !createContent.trim()) {
      setError('Judul, summary, dan konten wajib diisi.'); return;
    }
    setCreating(true); setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: createTitle,
          summary: createSummary,
          content: createContent,
          top_category: createCategory || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Artikel berhasil dibuat!');
        setShowCreateForm(false);
        setCreateTitle(''); setCreateSummary(''); setCreateContent(''); setCreateCategory('');
        await fetchArticles();
      } else setError(data.message || 'Gagal membuat artikel.');
    } catch { setError('Gagal membuat artikel.'); }
    finally { setCreating(false); }
  };

  const handlePublishToggle = async (article: Article) => {
    setPublishingId(article.id); setError(null);
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setArticles(prev => prev.map(a => a.id === article.id ? { ...a, status: newStatus } : a));
        showSuccess(newStatus === 'published' ? 'Artikel berhasil dipublish!' : 'Artikel dijadikan draft.');
      } else setError(data.message || 'Gagal update status.');
    } catch { setError('Gagal update status.'); }
    finally { setPublishingId(null); }
  };

  const handleSaveEdit = async (id: string) => {
    setSavingId(id); setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle, summary: editSummary, content: editContent }),
      });
      const data = await res.json();
      if (data.success) {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, title: editTitle, summary: editSummary, content: editContent } : a));
        setEditingId(null);
        showSuccess('Artikel berhasil disimpan!');
      } else setError(data.message || 'Gagal menyimpan.');
    } catch { setError('Gagal menyimpan.'); }
    finally { setSavingId(null); }
  };

  const handleUploadCover = async (file: File, articleId: string) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format gambar harus JPG, PNG, atau WebP.'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5MB.'); return;
    }
    setUploadingId(articleId); setError(null);
    try {
      const ext = file.name.split('.').pop();
      const path = `articles/${articleId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('reports').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path);
      const coverUrl = urlData.publicUrl;
      const res = await fetch(`${BACKEND_URL}/api/admin/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cover_image: coverUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setArticles(prev => prev.map(a => a.id === articleId ? { ...a, cover_image: coverUrl } : a));
        showSuccess('Cover berhasil diupload!');
      } else setError('Gagal menyimpan URL cover.');
    } catch { setError('Gagal upload gambar.'); }
    finally { setUploadingId(null); setUploadTargetId(null); }
  };

  const drafts = articles.filter(a => a.status === 'draft');
  const published = articles.filter(a => a.status === 'published');

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <SectionTitle title="Artikel" subtitle="Kelola artikel penipuan mingguan" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadTargetId) handleUploadCover(file, uploadTargetId);
          e.target.value = '';
        }}
      />

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Generating...' : 'Generate Artikel AI'}
        </button>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buat Artikel Manual
        </button>
      </div>

      {/* Create Manual Form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-sm font-bold text-slate-800">Buat Artikel Baru</p>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judul *</label>
            <input
              value={createTitle}
              onChange={e => setCreateTitle(e.target.value)}
              placeholder="Judul artikel..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kategori</label>
            <select
              value={createCategory}
              onChange={e => setCreateCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-emerald-400 transition-all"
            >
              <option value="">Pilih kategori...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Summary *</label>
            <textarea
              value={createSummary}
              onChange={e => setCreateSummary(e.target.value)}
              placeholder="Ringkasan singkat artikel..."
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-emerald-400 transition-all resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Konten (Markdown) *</label>
            <textarea
              value={createContent}
              onChange={e => setCreateContent(e.target.value)}
              placeholder="## Judul Section&#10;&#10;Isi konten artikel dalam format Markdown..."
              rows={12}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono focus:outline-none focus:border-emerald-400 transition-all resize-y"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Simpan sebagai Draft
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setCreateTitle(''); setCreateSummary(''); setCreateContent(''); setCreateCategory(''); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Batal
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {!fetched && loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {fetched && (
        <>
          {/* DRAFT */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Draft ({drafts.length})</p>
                <p className="text-xs text-slate-400 mt-0.5">Belum dipublish — tambah gambar & review dulu</p>
              </div>
              <button onClick={fetchArticles} disabled={loading}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Refresh'}
              </button>
            </div>
            {drafts.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Tidak ada draft</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {drafts.map(article => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    expanded={expandedId === article.id}
                    onToggleExpand={() => setExpandedId(expandedId === article.id ? null : article.id)}
                    editing={editingId === article.id}
                    editTitle={editTitle}
                    editSummary={editSummary}
                    editContent={editContent}
                    onEditTitle={setEditTitle}
                    onEditSummary={setEditSummary}
                    onEditContent={setEditContent}
                    onStartEdit={() => { setEditingId(article.id); setEditTitle(article.title); setEditSummary(article.summary); setEditContent(article.content ?? ''); }}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => handleSaveEdit(article.id)}
                    saving={savingId === article.id}
                    uploading={uploadingId === article.id}
                    publishing={publishingId === article.id}
                    onUpload={() => { setUploadTargetId(article.id); fileInputRef.current?.click(); }}
                    onPublishToggle={() => handlePublishToggle(article)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* PUBLISHED */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Published ({published.length})</p>
              <p className="text-xs text-slate-400 mt-0.5">Tampil di website — bisa unpublish kapan saja</p>
            </div>
            {published.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-400">Belum ada artikel yang dipublish</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {published.map(article => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    expanded={expandedId === article.id}
                    onToggleExpand={() => setExpandedId(expandedId === article.id ? null : article.id)}
                    editing={editingId === article.id}
                    editTitle={editTitle}
                    editSummary={editSummary}
                    editContent={editContent}
                    onEditTitle={setEditTitle}
                    onEditSummary={setEditSummary}
                    onEditContent={setEditContent}
                    onStartEdit={() => { setEditingId(article.id); setEditTitle(article.title); setEditSummary(article.summary); setEditContent(article.content ?? ''); }}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => handleSaveEdit(article.id)}
                    saving={savingId === article.id}
                    uploading={uploadingId === article.id}
                    publishing={publishingId === article.id}
                    onUpload={() => { setUploadTargetId(article.id); fileInputRef.current?.click(); }}
                    onPublishToggle={() => handlePublishToggle(article)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ArticleRow({
  article, expanded, onToggleExpand,
  editing, editTitle, editSummary, editContent,
  onEditTitle, onEditSummary, onEditContent,
  onStartEdit, onCancelEdit, onSaveEdit,
  saving, uploading, publishing, onUpload, onPublishToggle,
}: {
  article: Article;
  expanded: boolean;
  onToggleExpand: () => void;
  editing: boolean;
  editTitle: string;
  editSummary: string;
  editContent: string;
  onEditTitle: (v: string) => void;
  onEditSummary: (v: string) => void;
  onEditContent: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  saving: boolean;
  uploading: boolean;
  publishing: boolean;
  onUpload: () => void;
  onPublishToggle: () => void;
}) {
  const isPublished = article.status === 'published';

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200">
          {article.cover_image ? (
            <div className="relative w-full h-full">
              <Image src={article.cover_image} alt={article.title} fill className="object-cover" />
            </div>
          ) : (
            <FileText className="w-6 h-6 text-slate-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isPublished ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
            {article.top_category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{article.top_category}</span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{article.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatDate(article.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onUpload} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {article.cover_image ? 'Ganti' : 'Upload'} Cover
          </button>
          <button onClick={onPublishToggle} disabled={publishing}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors ${isPublished ? 'bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-600' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button onClick={onToggleExpand}
            className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {!editing ? (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Summary</p>
                <p className="text-sm text-slate-700 leading-relaxed">{article.summary}</p>
              </div>
              <button onClick={onStartEdit}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors">
                <Pencil className="w-3.5 h-3.5" /> Edit Konten
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judul</label>
                <input value={editTitle} onChange={e => onEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Summary</label>
                <textarea value={editSummary} onChange={e => onEditSummary(e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-emerald-400 transition-all resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Konten (Markdown)</label>
                <textarea value={editContent} onChange={e => onEditContent(e.target.value)} rows={12}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono focus:outline-none focus:border-emerald-400 transition-all resize-y" />
              </div>
              <div className="flex gap-2">
                <button onClick={onSaveEdit} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Simpan
                </button>
                <button onClick={onCancelEdit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors">
                  <X className="w-3.5 h-3.5" /> Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}