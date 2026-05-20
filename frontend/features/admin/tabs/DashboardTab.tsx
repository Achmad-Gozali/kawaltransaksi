'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Clock, CheckCircle2, XCircle,
  TrendingDown, TrendingUp, Users, AlertCircle,
  ChevronRight, Phone, Building2,
} from 'lucide-react';
import StatCard from '@/features/admin/components/StatCard';
import SectionTitle from '@/features/admin/components/SectionTitle';
import DailyChart from '@/features/admin/DailyChart';
import { formatRupiah } from '@/core/utils';
import type { Report, Stats } from '@/features/admin/types';

export default function DashboardTab({
  stats,
  reports,
}: {
  stats: Stats;
  reports: Report[];
}) {
  const router = useRouter();

  const todayStr = new Date().toLocaleDateString('en-CA');

  const todayReports = useMemo(
    () => reports.filter(r => new Date(r.created_at).toLocaleDateString('en-CA') === todayStr),
    [reports, todayStr]
  );
  const todayVerified = useMemo(
    () => todayReports.filter(r => r.status === 'verified'),
    [todayReports]
  );
  const totalLoss = useMemo(
    () => reports.reduce((s, r) => s + (Number(r.loss_amount) || 0), 0),
    [reports]
  );
  const multiVictimCount = useMemo(
    () => reports.filter(r => r.has_other_victims === 'yes').length,
    [reports]
  );
  const bankStats = useMemo(() => {
    const map: Record<string, { count: number; loss: number }> = {};
    reports.forEach(r => {
      const label = r.bank_name || (r.target_type === 'phone' ? 'Nomor Telepon' : 'Lainnya');
      if (!map[label]) map[label] = { count: 0, loss: 0 };
      map[label].count++;
      map[label].loss += (Number(r.loss_amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [reports]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SectionTitle title="Dashboard" subtitle="Overview semua laporan masuk" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Total Laporan"  value={String(stats.total)}   color="text-slate-800"   bg="bg-slate-100"  icon={FileText} />
        <StatCard label="Menunggu"       value={String(stats.pending)}  color="text-amber-600"   bg="bg-amber-50"   icon={Clock} />
        <StatCard label="Terverifikasi"  value={String(stats.verified)} color="text-emerald-600" bg="bg-emerald-50" icon={CheckCircle2} />
        <StatCard label="Ditolak"        value={String(stats.rejected)} color="text-red-500"     bg="bg-red-50"     icon={XCircle} />
        <StatCard label="Total Kerugian" value={totalLoss > 0 ? formatRupiah(totalLoss) : 'Rp 0'} color="text-slate-800" bg="bg-slate-100" icon={TrendingDown} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Masuk Hari Ini',    value: todayReports.length,  color: 'text-blue-600',    bg: 'bg-blue-50',    icon: TrendingUp },
          { label: 'Verified Hari Ini', value: todayVerified.length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
          { label: 'Multi Korban',      value: multiVictimCount,     color: 'text-orange-600',  bg: 'bg-orange-50',  icon: Users },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-semibold">{stats.pending}</span> laporan menunggu review
          </p>
          <button
            onClick={() => router.push('/admin?tab=laporan')}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Review <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <DailyChart reports={reports} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Bank Terbanyak Dilaporkan</h3>
          {bankStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {bankStats.slice(0, 5).map(([label, data]) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                      {label === 'Nomor Telepon'
                        ? <Phone className="w-3.5 h-3.5 text-slate-500" />
                        : <Building2 className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {data.loss > 0 && <span className="text-xs text-red-500 font-medium">{formatRupiah(data.loss)}</span>}
                    <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-lg">{data.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
