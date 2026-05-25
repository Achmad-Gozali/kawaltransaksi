import { createClient } from "@/core/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Phone, Building2, Wallet, ArrowRight } from "lucide-react";
import { formatDateID, encodeSlug } from "@/core/utils";
import StatsChart from "./StatsChart";
import SearchBar from "./SearchBar";

export const revalidate = 60;

const ewalletNames = ["gopay", "dana", "ovo", "shopeepay", "linkaja"];

const bankLogoMap: Record<string, string> = {
  bca: "/banks/bca.png",
  bni: "/banks/bni.png",
  bri: "/banks/bri.png",
  bsi: "/banks/bsi.png",
  cimb: "/banks/cimb.png",
  mandiri: "/banks/mandiri.png",
};

const ewalletLogoMap: Record<string, string> = {
  gopay: "/ewallets/gopay.png",
  dana: "/ewallets/dana.png",
  ovo: "/ewallets/ovo.png",
  shopeepay: "/ewallets/shopeepay.png",
  linkaja: "/ewallets/linkaja.png",
};

function getPlatformLogo(type: string, bankName: string | null): string | null {
  if (!bankName) return null;
  const key = bankName.toLowerCase();
  if (type === "ewallet" || ewalletNames.includes(key))
    return ewalletLogoMap[key] ?? null;
  if (type === "bank_account") return bankLogoMap[key] ?? null;
  return null;
}

function getTargetMeta(type: string, bankName: string | null) {
  if (
    type === "ewallet" ||
    (type === "phone" &&
      bankName &&
      ewalletNames.includes(bankName.toLowerCase()))
  ) {
    return {
      icon: Wallet,
      label: bankName ?? "E-Wallet",
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
    };
  }
  if (type === "bank_account") {
    return {
      icon: Building2,
      label: bankName ?? "Rekening Bank",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    };
  }
  return {
    icon: Phone,
    label: "Nomor HP",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  };
}

function getAggregateStatus(
  verifiedCount: number,
  pendingCount: number,
): string {
  if (verifiedCount > 0) return "verified";
  if (pendingCount > 0) return "pending";
  return "withdrawn";
}

function getStatusBadge(status: string, reportCount: number) {
  switch (status) {
    case "verified":
      return {
        label:
          reportCount > 1 ? `${reportCount}x Terverifikasi` : "Terverifikasi",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "pending":
      return {
        label: "Menunggu",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "withdrawn":
      return {
        label: "Sedang Direvisi",
        className: "bg-slate-100 text-slate-500 border-slate-200",
      };
    default:
      return {
        label: status,
        className: "bg-slate-50 text-slate-500 border-slate-200",
      };
  }
}

function buildPaginationPages(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return pages;
}

export default async function LaporanPublikPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    sort?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/laporan-publik");

  const params = await searchParams;
  const type = params.type ?? "all";
  const sort = params.sort ?? "latest";
  const q = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const perPage = 12;

  // [OK] OPTIMIZED: 2 RPC call parallel, gantiin fetch semua data + grouping di JS
  // Sebelumnya: fetch semua rows -> grouping di server memory -> slice untuk pagination
  // Sesudahnya: DB yang grouping + paginate, server terima data yang sudah siap
  const [laporanResult, statsResult] = await Promise.all([
    supabase.rpc("get_laporan_publik", {
      p_type: type,
      p_sort: sort,
      p_q: q.replace(/\D/g, "") || q,
      p_page: page,
      p_per_page: perPage,
    }),
    supabase.rpc("get_laporan_stats"),
  ]);

  const laporanData = laporanResult.data as {
    data: any[];
    total_unique: number;
  } | null;
  const paginatedReports: any[] = laporanData?.data ?? [];
  const totalUniqueNumbers: number = laporanData?.total_unique ?? 0;
  const allReportsForStats: any[] = statsResult.data ?? [];

  const totalReports = allReportsForStats.length;
  const totalPages = Math.ceil(totalUniqueNumbers / perPage);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginationPages = buildPaginationPages(safePage, totalPages);

  const buildUrl = (newParams: Record<string, string>) => {
    const p = new URLSearchParams({ type, sort, q, page: "1", ...newParams });
    if (p.get("type") === "all") p.delete("type");
    if (p.get("sort") === "latest") p.delete("sort");
    if (!p.get("q")) p.delete("q");
    if (p.get("page") === "1") p.delete("page");
    return `/laporan-publik?${p.toString()}`;
  };

  return (
    <main className="bg-white text-slate-900 font-sans min-h-screen">
      {/* -- Header ----------------------------------------------------------- */}
      <section className="bg-slate-50 px-4 pt-10 pb-8 sm:pt-14 sm:pb-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase mb-2 leading-tight">
            Database Laporan Publik
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
            Semua laporan yang masuk ke sistem KawalTransaksi. Nomor dengan
            status <span className="font-bold text-emerald-600">VERIFIED</span>{" "}
            telah dikonfirmasi oleh tim auditor kami.
          </p>
        </div>
      </section>

      <svg
        viewBox="0 0 1440 50"
        preserveAspectRatio="none"
        className="w-full block bg-slate-50 -mb-1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,50 C360,10 720,40 1080,15 C1260,2 1380,30 1440,50 Z"
          fill="#ffffff"
        />
      </svg>

      {/* -- Statistik -------------------------------------------------------- */}
      <section className="px-4 pt-6 pb-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Statistik
            </span>
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              {totalReports} total laporan
            </span>
          </div>
          <StatsChart rawReports={allReportsForStats} />
        </div>
      </section>

      {/* -- Filter & Search -------------------------------------------------- */}
      <section className="px-4 mt-8 pb-4 border-y border-slate-100 bg-white sticky top-16 z-10">
        <div className="max-w-5xl mx-auto space-y-4 py-4">
          <SearchBar defaultValue={q} type={type} sort={sort} />
          <div className="flex items-start gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
            {/* Filter tipe */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Tipe
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { val: "all", label: "Semua" },
                  { val: "phone", label: "HP / WA" },
                  { val: "bank_account", label: "Rekening" },
                  { val: "ewallet", label: "E-Wallet" },
                ].map((t) => (
                  <Link
                    key={t.val}
                    href={buildUrl({ type: t.val })}
                    scroll={false}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      type === t.val
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden sm:block w-px self-stretch bg-slate-100 mt-5" />

            {/* Sort */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Urutkan
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { val: "latest", label: "Terbaru" },
                  { val: "oldest", label: "Terlama" },
                ].map((s) => (
                  <Link
                    key={s.val}
                    href={buildUrl({ sort: s.val })}
                    scroll={false}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      sort === s.val
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Info & reset */}
            <div className="sm:ml-auto flex items-end pb-0.5 gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {totalUniqueNumbers} nomor unik
              </span>
              {(q || type !== "all" || sort !== "latest") && (
                <Link
                  href="/laporan-publik"
                  className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
                >
                  Reset
                </Link>
              )}
            </div>
          </div>

          {q && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Hasil pencarian untuk
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                &quot;{q}&quot;
              </span>
            </div>
          )}
        </div>
      </section>

      {/* -- Grid Laporan ----------------------------------------------------- */}
      <section className="px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {paginatedReports.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">
                {q
                  ? `Tidak ada hasil untuk "${q}"`
                  : "Tidak ada laporan ditemukan"}
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Coba ubah filter atau kata kunci pencarian
              </p>
              <Link
                href="/laporan-publik"
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Reset filter
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {paginatedReports.map((report) => {
                const meta = getTargetMeta(
                  report.target_type,
                  report.bank_name,
                );
                const Icon = meta.icon;
                const logoSrc = getPlatformLogo(
                  report.target_type,
                  report.bank_name,
                );
                const aggStatus = getAggregateStatus(
                  Number(report.verified_count),
                  Number(report.pending_count),
                );
                const badge = getStatusBadge(
                  aggStatus,
                  Number(report.verified_count),
                );
                const isVerified = Number(report.verified_count) > 0;
                const displayName = isVerified ? report.target_name : null;

                return (
                  <Link
                    key={report.target_number}
                    href={`/check/${encodeSlug(report.target_number)}`}
                    className="flex flex-col bg-white border border-slate-200 p-4 sm:p-5 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all group active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                        {formatDateID(report.latest_at)}
                      </span>
                    </div>
                    <div className="mb-3 flex-1">
                      <p className="text-lg sm:text-xl font-black font-mono tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors break-all">
                        {report.target_number}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 truncate">
                        {displayName
                          ? `A.N. ${displayName}`
                          : isVerified
                            ? "A.N. Anonymous"
                            : "Identitas belum terverifikasi"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border shrink-0 ${meta.bg} ${meta.color} ${meta.border}`}
                        >
                          {logoSrc ? (
                            <Image
                              src={logoSrc}
                              alt={meta.label}
                              width={12}
                              height={12}
                              className="object-contain rounded-sm"
                            />
                          ) : (
                            <Icon className="w-3 h-3" />
                          )}
                          <span className="truncate max-w-[60px] sm:max-w-[80px]">
                            {meta.label}
                          </span>
                        </span>
                        {Number(report.total) > 1 && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest shrink-0">
                            {report.total} laporan
                          </span>
                        )}
                        {Number(report.total) === 1 && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate min-w-0">
                            {report.category}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 ml-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* -- Pagination ---------------------------------------------------- */}
          {totalPages > 1 && (
            <div className="mt-8 sm:mt-10">
              <p className="text-center text-xs text-slate-400 font-medium mb-4">
                Menampilkan {(safePage - 1) * perPage + 1}-
                {Math.min(safePage * perPage, totalUniqueNumbers)} dari{" "}
                {totalUniqueNumbers} nomor
              </p>
              <div className="flex justify-center items-center gap-1.5 flex-wrap">
                {safePage > 1 ? (
                  <Link
                    href={buildUrl({ page: String(safePage - 1) })}
                    scroll={false}
                    className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all"
                  >
                    <-
                  </Link>
                ) : (
                  <span className="px-3 py-2 text-xs font-bold border border-slate-100 rounded-lg text-slate-300 cursor-not-allowed">
                    <-
                  </span>
                )}

                {paginationPages.map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`dots-${i}`}
                      className="px-2 py-2 text-xs text-slate-300 font-bold"
                    >
                      ---
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={buildUrl({ page: String(p) })}
                      scroll={false}
                      className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-lg border transition-all ${
                        p === safePage
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </Link>
                  ),
                )}

                {safePage < totalPages ? (
                  <Link
                    href={buildUrl({ page: String(safePage + 1) })}
                    scroll={false}
                    className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all"
                  >
                    ->
                  </Link>
                ) : (
                  <span className="px-3 py-2 text-xs font-bold border border-slate-100 rounded-lg text-slate-300 cursor-not-allowed">
                    ->
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
