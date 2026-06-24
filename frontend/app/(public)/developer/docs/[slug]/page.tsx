import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DOC_TOPICS, getDocTopic } from '@/app/(public)/developer/docs/data';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return DOC_TOPICS.map(t => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props) {
  const topic = getDocTopic(params.slug);
  if (!topic) return {};
  return {
    title:       `${topic.title} — Dokumentasi API KawalTransaksi`,
    description: topic.description,
  };
}

export default function DocsPage({ params }: Props) {
  const topic = getDocTopic(params.slug);
  if (!topic) notFound();

  const idx  = DOC_TOPICS.findIndex(t => t.slug === params.slug);
  const prev = DOC_TOPICS[idx - 1] ?? null;
  const next = DOC_TOPICS[idx + 1] ?? null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
        <h1 className="text-lg font-black text-slate-900 mb-1">{topic.title}</h1>
        <p className="text-sm text-slate-500 leading-relaxed">{topic.description}</p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
        {topic.content}
      </div>

      {/* Prev / Next navigation */}
      <div className="grid grid-cols-2 gap-3">
        {prev ? (
          <Link
            href={`/developer/docs/${prev.slug}`}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Sebelumnya</p>
              <p className="text-sm font-bold text-slate-700 truncate">{prev.title}</p>
            </div>
          </Link>
        ) : <div />}

        {next ? (
          <Link
            href={`/developer/docs/${next.slug}`}
            className="flex items-center justify-end gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 transition-colors group text-right ml-auto w-full"
          >
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Berikutnya</p>
              <p className="text-sm font-bold text-slate-700 truncate">{next.title}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}