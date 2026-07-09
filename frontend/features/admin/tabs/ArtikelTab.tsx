'use client';

import { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Plus, Pencil, Trash2, Eye, EyeOff,
  Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, Minus, Upload, X,
} from 'lucide-react';
import { authClient } from '@/core/auth/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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

  if (view === 'editor') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800">{editing ? 'Edit Artikel' : 'Artikel Baru'}</p>
          <div className="flex gap-2">
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-800">Manajemen Artikel</p>
          <p className="text-xs text-slate-400 mt-0.5">{articles.length} artikel</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Artikel Baru
        </button>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
          <p className="text-sm text-slate-400 mb-3">Belum ada artikel.</p>
          <button onClick={openNew} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            Buat artikel pertama →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map(a => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-slate-300 transition-colors">
              {a.thumbnail && (
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                  <img src={`${API_URL}${a.thumbnail}`} alt={a.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {a.category && <span className="text-[10px] text-slate-400">{a.category}</span>}
                  {a.category && <span className="text-slate-200">·</span>}
                  <span className="text-[10px] text-slate-400">{formatDateID(a.createdAt)}</span>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                a.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                {a.status === 'published' ? 'Published' : 'Draft'}
              </span>

              <div className="flex gap-1 shrink-0">
                <button onClick={() => togglePublish(a)} title={a.status === 'published' ? 'Jadikan draft' : 'Publish'}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                  {a.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(a.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}