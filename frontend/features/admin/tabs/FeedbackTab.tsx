'use client';

import { useState, useMemo } from 'react';
import {
  Bug, Lightbulb, Layout, MoreHorizontal,
  ChevronDown, ChevronUp, Loader2, Search,
  MessageCircle, ExternalLink, Clock, CheckCircle2,
  Wrench, XCircle, Image as ImageIcon,
} from 'lucide-react';
import SectionTitle from '@/features/admin/components/SectionTitle';

// ---------------------------------------------
// Types
// ---------------------------------------------

export type FeedbackCategory = 'bug' | 'feature' | 'ui_ux' | 'other';
export type FeedbackUrgency  = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackStatus   = 'pending' | 'in_review' | 'fixed' | 'closed';

export interface FeedbackItem {
  id: string;
  user_id: string | null;
  user_email: string | null;
  category: FeedbackCategory;
  title: string;
  description: string;
  page_url: string | null;
  urgency: FeedbackUrgency;
  screenshot_urls: string[];
  status: FeedbackStatus;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

// ---------------------------------------------
// Config
// ---------------------------------------------

const CATEGORY_CONFIG: Record<FeedbackCategory, {
  label: string;
  icon: React.ElementType;
  color: string;
}> = {
  bug:     { label: 'Bug',      icon: Bug,            color: 'bg-red-50 text-red-600 border-red-200'         },
  feature: { label: 'Fitur',    icon: Lightbulb,      color: 'bg-purple-50 text-purple-600 border-purple-200' },
  ui_ux:   { label: 'UI/UX',   icon: Layout,          color: 'bg-blue-50 text-blue-600 border-blue-200'       },
  other:   { label: 'Lainnya', icon: MoreHorizontal,  color: 'bg-slate-100 text-slate-500 border-slate-200'   },
};

const URGENCY_CONFIG: Record<FeedbackUrgency, { label: string; color: string }> = {
  low:      { label: 'Low',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium:   { label: 'Medium',   color: 'bg-amber-50 text-amber-700 border-amber-200'       },
  high:     { label: 'High',     color: 'bg-orange-50 text-orange-700 border-orange-200'    },
  critical: { label: 'Critical', color: 'bg-red-50 text-red-700 border-red-200'             },
};

const STATUS_CONFIG: Record<FeedbackStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
}> = {
  pending:   { label: 'Pending',    icon: Clock,        color: 'bg-amber-50 text-amber-600 border-amber-200',       activeColor: 'bg-amber-500 text-white'   },
  in_review: { label: 'In Review',  icon: Wrench,       color: 'bg-blue-50 text-blue-600 border-blue-200',          activeColor: 'bg-blue-600 text-white'    },
  fixed:     { label: 'Fixed',      icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', activeColor: 'bg-emerald-500 text-white' },
  closed:    { label: 'Closed',     icon: XCircle,      color: 'bg-slate-100 text-slate-500 border-slate-200',      activeColor: 'bg-slate-700 text-white'   },
};

type StatusFilter = 'semua' | FeedbackStatus;

// ---------------------------------------------
// Helper
// ---------------------------------------------

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1)  return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHr < 24)  return `${diffHr} jam lalu`;
  if (diffDay < 7)  return `${diffDay} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------------------------------------------
// Main Component
// ---------------------------------------------

export default function FeedbackTab({
  feedbacks,
  token,
}: {
  feedbacks: FeedbackItem[];
  token: string;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | ''>('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [replyText, setReplyText]       = useState<Record<string, string>>({});
  const [loadingId, setLoadingId]       = useState<string | null>(null);

  // -- Filtered list --------------------------------------------
  const filtered = useMemo(() => feedbacks.filter(f => {
    const matchStatus   = statusFilter === 'semua' || f.status === statusFilter;
    const matchCategory = !categoryFilter || f.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch   = !q
      || f.title.toLowerCase().includes(q)
      || f.description.toLowerCase().includes(q)
      || f.user_email?.toLowerCase().includes(q)
      || f.page_url?.toLowerCase().includes(q);
    return matchStatus && matchCategory && matchSearch;
  }), [feedbacks, statusFilter, categoryFilter, searchQuery]);

  // -- Update status via API -------------------------------------
  const updateStatus = async (id: string, status: FeedbackStatus) => {
    setLoadingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      // Re-fetch dilakukan oleh router.refresh() di parent kalau mau,
      // atau optimistic update sederhana
      window.location.reload();
    } catch {
      alert('Gagal update status. Coba lagi.');
    } finally {
      setLoadingId(null);
    }
  };

  // -- Kirim reply -----------------------------------------------
  const sendReply = async (id: string) => {
    const reply = replyText[id]?.trim();
    if (!reply) return;
    setLoadingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback/${id}/reply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reply }),
      });
      if (!res.ok) throw new Error();
      setReplyText(prev => ({ ...prev, [id]: '' }));
      window.location.reload();
    } catch {
      alert('Gagal mengirim balasan. Coba lagi.');
    } finally {
      setLoadingId(null);
    }
  };

  // ---------------------------------------------
  // Render
  // ---------------------------------------------

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionTitle title="Feedback" />

      {/* -- Search & Category filter -- */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul, deskripsi, email, atau URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as FeedbackCategory | '')}
          className={`px-3 py-2.5 border rounded-xl text-sm cursor-pointer transition-all ${
            categoryFilter
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          <option value="">Semua Kategori</option>
          {Object.entries(CATEGORY_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* -- Status filter tabs -- */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['semua', 'pending', 'in_review', 'fixed', 'closed'] as StatusFilter[]).map(f => {
          const count = f === 'semua'
            ? feedbacks.length
            : feedbacks.filter(fb => fb.status === f).length;
          const cfg = f !== 'semua' ? STATUS_CONFIG[f] : null;
          const isActive = statusFilter === f;
          return (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? (cfg ? cfg.activeColor : 'bg-slate-900 text-white border-transparent')
                  : (cfg ? cfg.color : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')
              }`}
            >
              {f === 'semua' ? 'Semua' : cfg!.label} ({count})
            </button>
          );
        })}
      </div>

      {/* -- Empty state -- */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">Belum ada feedback</p>
          <p className="text-xs text-slate-400 mt-1">Feedback dari user akan muncul di sini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(fb => {
            const catCfg    = CATEGORY_CONFIG[fb.category] ?? CATEGORY_CONFIG.other;
            const urgCfg    = URGENCY_CONFIG[fb.urgency]   ?? URGENCY_CONFIG.low;
            const stCfg     = STATUS_CONFIG[fb.status]     ?? STATUS_CONFIG.pending;
            const StIcon    = stCfg.icon;
            const CatIcon   = catCfg.icon;
            const isExp     = expandedId === fb.id;
            const isLd      = loadingId === fb.id;
            const hasScreenshots = (fb.screenshot_urls ?? []).length > 0;

            return (
              <div
                key={fb.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-all"
              >
                {/* -- Row summary -- */}
                <div className="px-4 sm:px-5 py-4">
                  <div className="flex items-start gap-3">

                    {/* Category icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${catCfg.color}`}>
                      <CatIcon className="w-4 h-4" />
                    </div>

                    {/* Main info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-semibold text-slate-900 text-sm truncate max-w-xs">{fb.title}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${stCfg.color}`}>
                          <StIcon className="w-2.5 h-2.5" />{stCfg.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${urgCfg.color}`}>
                          {urgCfg.label}
                        </span>
                        {hasScreenshots && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">
                            <ImageIcon className="w-2.5 h-2.5" />{fb.screenshot_urls.length} foto
                          </span>
                        )}
                        {fb.admin_reply && (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg">
                            Sudah dibalas
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium ${catCfg.color}`}>{catCfg.label}</span>
                        {fb.user_email && <span>{fb.user_email}</span>}
                        <span>{formatDate(fb.created_at)}</span>
                        {fb.page_url && (
                          <a
                            href={fb.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {new URL(fb.page_url).pathname}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setExpandedId(isExp ? null : fb.id)}
                        className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        {isExp
                          ? <ChevronUp className="w-4 h-4 text-slate-500" />
                          : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* -- Expanded detail -- */}
                {isExp && (
                  <div className="border-t border-slate-100 px-4 sm:px-5 py-5 bg-slate-50/60 space-y-5">

                    {/* Deskripsi */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Deskripsi</p>
                      <div className="bg-white border border-slate-100 rounded-xl p-4">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{fb.description}</p>
                      </div>
                    </div>

                    {/* Screenshots */}
                    {hasScreenshots && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                          Screenshot ({fb.screenshot_urls.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {fb.screenshot_urls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 hover:border-slate-400 transition-colors block group"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Balasan admin sebelumnya */}
                    {fb.admin_reply && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Balasan Admin</p>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                          <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">{fb.admin_reply}</p>
                          {fb.replied_at && (
                            <p className="text-xs text-emerald-500 mt-2">{formatDate(fb.replied_at)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Update status */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Update Status</p>
                      <div className="flex gap-2 flex-wrap">
                        {(Object.keys(STATUS_CONFIG) as FeedbackStatus[]).map(s => {
                          const cfg = STATUS_CONFIG[s];
                          const Icon = cfg.icon;
                          const isCurrent = fb.status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => !isCurrent && updateStatus(fb.id, s)}
                              disabled={isLd || isCurrent}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all disabled:cursor-default ${
                                isCurrent
                                  ? cfg.activeColor + ' border-transparent'
                                  : cfg.color + ' hover:opacity-80'
                              }`}
                            >
                              {isLd && fb.status !== s
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Icon className="w-3 h-3" />}
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reply ke user */}
                    {fb.user_email && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                          Balas ke {fb.user_email}
                        </p>
                        <textarea
                          value={replyText[fb.id] ?? ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [fb.id]: e.target.value }))}
                          placeholder="Tulis balasan untuk user ini..."
                          rows={3}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                        />
                        <button
                          onClick={() => sendReply(fb.id)}
                          disabled={isLd || !(replyText[fb.id]?.trim())}
                          className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLd
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <MessageCircle className="w-3.5 h-3.5" />}
                          Kirim Balasan
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
