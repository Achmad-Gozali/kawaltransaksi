import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DOC_TOPICS, getDocTopic } from '@/app/(public)/developer/docs/data';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return DOC_TOPICS.map(t => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const topic = getDocTopic(slug);
  if (!topic) return {};
  return {
    title:       `${topic.title} — Dokumentasi API KawalTransaksi`,
    description: topic.description,
  };
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  const topic = getDocTopic(slug);
  if (!topic) notFound();

  const idx  = DOC_TOPICS.findIndex(t => t.slug === slug);
  const prev = DOC_TOPICS[idx - 1] ?? null;
  const next = DOC_TOPICS[idx + 1] ?? null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
        <h1 className="text-lg font-black text-slate-900 mb-1">{topic.title}</h1>
        <p className="text-sm text-slate-500 leading-relaxed">{topic.description}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
        {topic.content}
      </div>

      {(prev || next) && (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
          {prev ? (
            <Link
              href={`/developer/docs/${prev.slug}`}
              className="group flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 flex-1 sm:flex-none sm:min-w-[140px] lg:min-w-[200px]"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sebelumnya</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors truncate">
                  {prev.title}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {next ? (
            <Link
              href={`/developer/docs/${next.slug}`}
              className="group flex items-center justify-end gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 flex-1 sm:flex-none sm:min-w-[140px] lg:min-w-[200px] text-right"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Berikutnya</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors truncate">
                  {next.title}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      )}
    </div>
  );
}