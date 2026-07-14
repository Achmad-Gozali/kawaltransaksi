'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Plus, Pencil, Trash2, Eye,
  Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, Minus, Upload, X,
  Search, ChevronDown, MoreHorizontal, Calendar, FileText,
  ChevronLeft, ChevronRight, Globe, PencilLine,
} from 'lucide-react';
import { authClient } from '@/core/auth/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const PER_PAGE = 8;

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail: string | null;
  category: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

interface ArticleFull extends Article { content: string; }

function formatDateID(d: string) {
  try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

// Palet warna badge kategori — deterministik berdasar hash nama kategori,
// supaya kategori yang sama selalu dapat warna yang sama tanpa perlu daftar manual.
const CATEGORY_PALETTE = [
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
];

function categoryClass(cat: string) {
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = (hash * 31 + cat.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

function ToolbarButton({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`p-1.5 rounded-lg transition-all ${active ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
      {children}
    </button>
  );
}

function TiptapEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Tulis konten artikel di sini...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-0.5 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px bg-slate-200 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px bg-slate-200 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px bg-slate-200 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-4 py-3 min-h-[280px] text-slate-800 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  );
}

function StatusDropdown({
  article, onTogglePublish,
}: {
  article: Article;
  onTogglePublish: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20">
          <button
            onClick={() => { onTogglePublish(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {article.status === 'published'
              ? <><PencilLine className="w-3.5 h-3.5 text-slate-400" /> Jadikan Draft</>
              : <><Globe className="w-3.5 h-3.5 text-emerald-500" /> Publish</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all";

export default function ArtikelTab({ token }: { token: string }) {
  const [articles, setArticles]         = useState<Article[]>([]);
  const [loaded, setLoaded]             = useState(false);
  const [view, setView]                 = useState<'list' | 'editor'>('list');
  const [editing, setEditing]           = useState<ArticleFull | null>(null);
  const [loading, setLoading]           = useState(false);
  const [deleting, setDeleting]         = useState<string | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);

  const [form, setForm] = useState({
    title: '', excerpt: '', content: '', thumbnail: '', category: '', status: 'draft',
  });

  const getToken = () => authClient.getToken() ?? token;

  const fetchArticles = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/admin/articles`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setArticles(data.data ?? []);
      setLoaded(true);
    } catch { setLoaded(true); }
  }, []);

  if (!loaded) { fetchArticles(); }

  const categories = useMemo(() => {
    const set = new Set(articles.map(a => a.category).filter(Boolean));
    return Array.from(set);
  }, [articles]);

  const filtered = useMemo(() => articles.filter(a => {
    const q = search.toLowerCase();
    const matchesQ = a.title.toLowerCase().includes(q) || (a.category ?? '').toLowerCase().includes(q);
    const matchesCat = !categoryFilter || a.category === categoryFilter;
    const matchesStatus = !statusFilter || a.status === statusFilter;
    return matchesQ && matchesCat && matchesStatus;
  }), [articles, search, categoryFilter, statusFilter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated   = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', excerpt: '', content: '', thumbnail: '', category: '', status: 'draft' });
    setThumbnailPreview(null);
    setView('editor');
  };

  const openEdit = async (id: string) => {
    const res  = await fetch(`${API_URL}/api/admin/articles/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    const a    = data.data as ArticleFull;
    setEditing(a);
    setForm({ title: a.title, excerpt: a.excerpt ?? '', content: a.content, thumbnail: a.thumbnail ?? '', category: a.category, status: a.status });
    setThumbnailPreview(a.thumbnail ? `${API_URL}${a.thumbnail}` : null);
    setView('editor');
  };

  const handleThumbnailUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('folder', 'articles');
      fd.append('file', file);
      const res  = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (data.data?.url) {
        setForm(f => ({ ...f, thumbnail: data.data.url }));
        setThumbnailPreview(`${API_URL}${data.data.url}`);
      }
    } finally { setUploading(false); }
  };

  const handleSave = async (saveStatus?: string) => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const body   = { ...form, status: saveStatus ?? form.status };
      const url    = editing ? `${API_URL}/api/admin/articles/${editing.id}` : `${API_URL}/api/admin/articles`;
      const method = editing ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (res.ok) { await fetchArticles(); setView('list'); }
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus artikel ini?')) return;
    setDeleting(id);
    try {
      await fetch(`${API_URL}/api/admin/articles/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` },
      });
      setArticles(prev => prev.filter(a => a.id !== id));
    } finally { setDeleting(null); }
  };

  const togglePublish = async (a: Article) => {
    const newStatus = a.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`${API_URL}/api/admin/articles/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setArticles(prev => prev.map(x => x.id === a.id ? { ...x, status: newStatus } : x));
  };

  const previewUrl = (a: Article) => {
    if (a.status !== 'published') return null;
    if (typeof window === 'undefined') return `/artikel/${a.slug}`;
    return `${window.location.origin}/artikel/${a.slug}`;
  };

  if (view === 'editor') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800">{editing ? 'Edit Artikel' : 'Artikel Baru'}</p>
          <div className="flex gap-2">
            <button onClick={() => setView('list')}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-semibold rounded-xl transition-all">
              Batal
            </button>
            <button onClick={() => handleSave('draft')} disabled={loading || !form.title.trim()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all disabled:opacity-40">
              Simpan Draft
            </button>
            <button onClick={() => handleSave('published')} disabled={loading || !form.title.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40">
              {loading ? 'Menyimpan...' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Judul</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Judul artikel..." className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Kategori</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Contoh: Tips Keamanan, Modus, Berita..." className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Thumbnail</label>
              {thumbnailPreview ? (
                <div className="relative w-full h-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center px-3 gap-3">
                  <img src={thumbnailPreview} alt="preview" className="h-7 w-12 object-cover rounded-lg shrink-0" />
                  <span className="text-xs text-slate-500 truncate flex-1">Thumbnail terpilih</span>
                  <button type="button" onClick={() => { setThumbnailPreview(null); setForm(f => ({ ...f, thumbnail: '' })); }}
                    className="shrink-0 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className={`${inputCls} flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                  <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-400 text-sm">{uploading ? 'Mengupload...' : 'Upload gambar...'}</span>
                  <input type="file" accept="image/jpeg,image/png" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(f); }} />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Ringkasan</label>
            <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Ringkasan singkat artikel..." rows={2}
              className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Konten</label>
            <TiptapEditor content={form.content} onChange={content => setForm(f => ({ ...f, content }))} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Manajemen Artikel</h1>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {articles.length} artikel
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Kelola konten artikel, panduan, dan informasi di KawalTransaksi</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shrink-0">
          <Plus className="w-4 h-4" /> Artikel Baru
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari artikel berdasarkan judul, kategori, atau tag..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3.5 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 transition-colors cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3.5 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 transition-colors cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {paginated.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400 mb-3">
              {articles.length === 0 ? 'Belum ada artikel.' : 'Tidak ada artikel ditemukan.'}
            </p>
            {articles.length === 0 && (
              <button onClick={openNew} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                Buat artikel pertama →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-bold text-slate-700 text-xs">Artikel</th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-xs hidden md:table-cell">Kategori</th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-xs hidden sm:table-cell">Tanggal</th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-xs">Status</th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-xs text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map(a => {
                  const preview = previewUrl(a);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {a.thumbnail ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                              <img src={`${API_URL}${a.thumbnail}`} alt={a.title} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-slate-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 line-clamp-2">{a.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 md:hidden">
                              {a.category && <span>{a.category}</span>}
                              {a.category && <span>·</span>}
                              <span>{formatDateID(a.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {a.category ? (
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${categoryClass(a.category)}`}>
                            {a.category}
                          </span>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          {formatDateID(a.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${
                          a.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {a.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {preview ? (
                            <a href={preview} target="_blank" rel="noopener noreferrer" title="Preview"
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                              <Eye className="w-4 h-4" />
                            </a>
                          ) : (
                            <span title="Publish dulu untuk bisa preview" className="w-8 h-8 flex items-center justify-center text-slate-200 cursor-not-allowed">
                              <Eye className="w-4 h-4" />
                            </span>
                          )}
                          <button onClick={() => openEdit(a.id)} title="Edit"
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id} title="Hapus"
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <StatusDropdown article={a} onTogglePublish={() => togglePublish(a)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Menampilkan {(currentPage - 1) * PER_PAGE + 1} - {Math.min(currentPage * PER_PAGE, filtered.length)} dari {filtered.length} artikel
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    n === currentPage ? 'bg-emerald-600 text-white' : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}