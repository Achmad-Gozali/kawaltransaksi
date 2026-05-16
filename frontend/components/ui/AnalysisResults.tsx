import { Brain, ShieldCheck, ShieldAlert, ShieldX, Info, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { AnalysisResult, TextAnalysis } from '../report/types';

// ── Komponen skor bar ─────────────────────────────────────────────────────────

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-8 text-right">{value}%</span>
    </div>
  );
}

// ── Hasil analisis foto ───────────────────────────────────────────────────────

export function ImageAnalysisResult({ analysis }: { analysis: AnalysisResult }) {
  const isValid = analysis.is_likely_authentic && analysis.relevance_score >= 90;
  const isPartial = !isValid && analysis.authenticity_score >= 70;

  const config = isValid
    ? {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        subtext: 'text-emerald-600',
        icon: ShieldCheck,
        iconColor: 'text-emerald-500',
        label: 'Bukti Valid',
        desc: 'Foto terindikasi asli dan relevan sebagai bukti penipuan.',
        barColor: 'bg-emerald-500',
      }
    : isPartial
    ? {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        subtext: 'text-amber-600',
        icon: ShieldAlert,
        iconColor: 'text-amber-500',
        label: 'Bukti Kurang Kuat',
        desc: 'Foto ada namun belum memenuhi standar bukti yang diperlukan untuk verifikasi.',
        barColor: 'bg-amber-400',
      }
    : {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        subtext: 'text-red-600',
        icon: ShieldX,
        iconColor: 'text-red-500',
        label: 'Bukti Tidak Memadai',
        desc: 'Foto tidak dapat dikonfirmasi sebagai bukti penipuan yang valid.',
        barColor: 'bg-red-400',
      };

  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} mt-3 overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center gap-2.5 border-b ${config.border}`}>
        <Icon className={`w-4 h-4 ${config.iconColor} shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${config.text}`}>{config.label}</p>
          <p className={`text-xs ${config.subtext} mt-0.5`}>{config.desc}</p>
        </div>
      </div>

      {/* Skor */}
      <div className="px-4 py-3 space-y-2.5">
        <div>
          <div className="flex justify-between mb-1">
            <span className={`text-xs font-medium ${config.subtext}`}>Keaslian Foto</span>
          </div>
          <ScoreBar value={analysis.authenticity_score} color={config.barColor} />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className={`text-xs font-medium ${config.subtext}`}>Relevansi Bukti</span>
          </div>
          <ScoreBar value={analysis.relevance_score} color={config.barColor} />
        </div>
      </div>

      {/* Indikator */}
      <div className={`px-4 py-3 border-t ${config.border} flex flex-wrap gap-x-4 gap-y-2`}>
        <span className={`flex items-center gap-1.5 text-xs font-medium ${config.text}`}>
          {analysis.has_concrete_evidence
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            : <XCircle className="w-3.5 h-3.5 text-red-400" />}
          Bukti konkret
        </span>
        <span className={`flex items-center gap-1.5 text-xs font-medium ${config.text}`}>
          {analysis.is_likely_authentic
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            : <XCircle className="w-3.5 h-3.5 text-red-400" />}
          Terindikasi asli
        </span>
      </div>

      {/* Ringkasan AI */}
      {analysis.summary && (
        <div className={`px-4 py-3 border-t ${config.border}`}>
          <p className={`text-xs leading-relaxed ${config.text} opacity-80`}>{analysis.summary}</p>
        </div>
      )}
    </div>
  );
}

// ── Hasil analisis teks ───────────────────────────────────────────────────────

export function TextAnalysisResult({ analysis }: { analysis: TextAnalysis }) {
  const isHigh = analysis.risk_level === 'high';
  const isMedium = analysis.risk_level === 'medium';

  const config = isHigh
    ? {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        subtext: 'text-red-600',
        badge: 'bg-red-100 text-red-700 border border-red-200',
        label: 'Indikasi Penipuan Kuat',
        desc: 'Kronologi mengandung pola yang sangat konsisten dengan kasus penipuan.',
        barColor: 'bg-red-500',
        scoreColor: 'text-red-600',
        icon: ShieldX,
        iconColor: 'text-red-500',
      }
    : isMedium
    ? {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        subtext: 'text-amber-600',
        badge: 'bg-amber-100 text-amber-700 border border-amber-200',
        label: 'Indikasi Penipuan Sedang',
        desc: 'Kronologi mengandung beberapa pola mencurigakan namun perlu informasi tambahan.',
        barColor: 'bg-amber-400',
        scoreColor: 'text-amber-600',
        icon: ShieldAlert,
        iconColor: 'text-amber-500',
      }
    : {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-700',
        subtext: 'text-slate-500',
        badge: 'bg-slate-100 text-slate-600 border border-slate-200',
        label: 'Indikasi Penipuan Lemah',
        desc: 'Kronologi belum menunjukkan pola penipuan yang jelas. Tambahkan detail lebih lengkap.',
        barColor: 'bg-slate-400',
        scoreColor: 'text-slate-500',
        icon: AlertCircle,
        iconColor: 'text-slate-400',
      };

  const Icon = config.icon;

  // Tentukan kelengkapan laporan
  const completenessScore = analysis.chronology_score;
  const completenessLabel =
    completenessScore >= 90 ? 'Sangat Lengkap' :
    completenessScore >= 70 ? 'Cukup Lengkap' :
    completenessScore >= 50 ? 'Perlu Dilengkapi' : 'Kurang Detail';

  const completenessColor =
    completenessScore >= 90 ? 'text-emerald-600' :
    completenessScore >= 70 ? 'text-amber-600' :
    'text-red-500';

  const completenessBarColor =
    completenessScore >= 90 ? 'bg-emerald-500' :
    completenessScore >= 70 ? 'bg-amber-400' :
    'bg-red-400';

  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} mt-4 overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-start gap-2.5 border-b ${config.border}`}>
        <Icon className={`w-4 h-4 ${config.iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold ${config.text}`}>{config.label}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${config.badge}`}>
              {analysis.risk_level === 'high' ? 'Tinggi' : analysis.risk_level === 'medium' ? 'Sedang' : 'Rendah'}
            </span>
          </div>
          <p className={`text-xs ${config.subtext} mt-0.5 leading-relaxed`}>{config.desc}</p>
        </div>
      </div>

      {/* Skor kelengkapan */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${config.subtext}`}>Kelengkapan Kronologi</span>
          <span className={`text-xs font-bold ${completenessColor}`}>
            {completenessLabel} · {completenessScore}/100
          </span>
        </div>
        <ScoreBar value={completenessScore} color={completenessBarColor} />
      </div>

      {/* Analisis teks */}
      <div className={`px-4 py-3 border-t ${config.border}`}>
        <div className="flex items-center gap-1.5 mb-2">
          <Brain className={`w-3.5 h-3.5 ${config.subtext}`} />
          <span className={`text-xs font-semibold ${config.subtext} uppercase tracking-wide`}>Evaluasi AI</span>
        </div>
        <p className={`text-sm leading-relaxed ${config.text}`}>{analysis.analysis}</p>
      </div>

      {/* Saran kategori */}
      {analysis.suggested_category && (
        <div className={`px-4 py-3 border-t ${config.border} flex items-start gap-2`}>
          <Info className={`w-3.5 h-3.5 ${config.subtext} shrink-0 mt-0.5`} />
          <p className={`text-xs ${config.text} leading-relaxed`}>
            Kategori yang disarankan berdasarkan analisis:{' '}
            <span className="font-bold">{analysis.suggested_category}</span>
          </p>
        </div>
      )}
    </div>
  );
}