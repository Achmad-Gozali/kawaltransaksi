// frontend/app/admin/tabs/StatistikTab.tsx

"use client";

import { useMemo } from "react";
import { Phone, Building2, Users } from "lucide-react";
import SectionTitle from "../components/SectionTitle";
import DailyChart from "../DailyChart";
import { formatRupiah } from "@/core/utils";
import type { Report, Stats } from "../types";

export default function StatistikTab({
  stats,
  reports,
}: {
  stats: Stats;
  reports: Report[];
}) {
  const multiVictimCount = useMemo(
    () => reports.filter((r) => r.has_other_victims === "yes").length,
    [reports],
  );

  const bankStats = useMemo(() => {
    const map: Record<string, { count: number; loss: number }> = {};
    reports.forEach((r) => {
      const label =
        r.bank_name ||
        (r.target_type === "phone" ? "Nomor Telepon" : "Lainnya");
      if (!map[label]) map[label] = { count: 0, loss: 0 };
      map[label].count++;
      map[label].loss += Number(r.loss_amount) || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [reports]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((r) => {
      map[r.category] = (map[r.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [reports]);
  const maxCat = categoryStats[0]?.[1] || 1;

  const platformStats = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((r) => {
      if (r.platform) map[r.platform] = (map[r.platform] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [reports]);
  const maxPlat = platformStats[0]?.[1] || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SectionTitle title="Statistik" subtitle="Analisis data laporan" />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Daily chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <DailyChart reports={reports} />
        </div>

        {/* Kategori */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">
            Kategori
          </h3>
          {categoryStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada</p>
          ) : (
            <div className="space-y-3.5">
              {categoryStats.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-700">
                      {cat}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${(count / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bank / E-Wallet */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">
            Bank / E-Wallet
          </h3>
          {bankStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada</p>
          ) : (
            <div className="space-y-3">
              {bankStats.map(([label, data]) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                      {label === "Nomor Telepon" ? (
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <span className="text-sm text-slate-700 font-medium">
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {data.loss > 0 && (
                      <span className="text-xs text-red-500 font-semibold">
                        {formatRupiah(data.loss)}
                      </span>
                    )}
                    <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-lg">
                      {data.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">
            Platform
          </h3>
          {platformStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada</p>
          ) : (
            <div className="space-y-3.5">
              {platformStats.map(([p, c]) => (
                <div key={p}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-700">
                      {p}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {c}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 rounded-full"
                      style={{ width: `${(c / maxPlat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rate cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          {
            label: "Approval Rate",
            value:
              stats.total > 0
                ? Math.round((stats.verified / stats.total) * 100)
                : 0,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Rejection Rate",
            value:
              stats.total > 0
                ? Math.round((stats.rejected / stats.total) * 100)
                : 0,
            color: "text-red-500",
            bg: "bg-red-50",
          },
          {
            label: "Pending Rate",
            value:
              stats.total > 0
                ? Math.round((stats.pending / stats.total) * 100)
                : 0,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-2xl border border-slate-200 p-6 text-center`}
          >
            <p className={`text-3xl lg:text-4xl font-black ${s.color}`}>
              {s.value}%
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Info tambahan */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-5">
          Info Tambahan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <p className="text-2xl font-black text-orange-600">
              {multiVictimCount}
            </p>
            <p className="text-xs text-orange-500 font-medium mt-1">
              Laporan multi korban
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-2xl font-black text-slate-700">
              {
                reports.filter(
                  (r) =>
                    (r.social_media_accounts ?? []).filter(Boolean).length > 0,
                ).length
              }
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Laporan ada data sosmed
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-2xl font-black text-emerald-600">
              {
                reports.filter((r) =>
                  (r.reported_to ?? []).some((v) => v !== "belum"),
                ).length
              }
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Sudah lapor ke instansi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
