import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { formatDateID, encodeSlug } from '@/lib/utils';
import { Phone, Building2, Wallet, ArrowRight, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 60;

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { }
        },
      },
    }
  );
}

const ewalletNames = ['gopay', 'dana', 'ovo', 'shopeepay', 'linkaja'];

const bankLogoMap: Record<string, string> = {
  bca: '/banks/bca.png', bni: '/banks/bni.png', bri: '/banks/bri.png',
  bsi: '/banks/bsi.png', cimb: '/banks/cimb.png', mandiri: '/banks/mandiri.png',
};

const ewalletLogoMap: Record<string, string> = {
  gopay: '/ewallets/gopay.png', dana: '/ewallets/dana.png', ovo: '/ewallets/ovo.png',
  shopeepay: '/ewallets/shopeepay.png', linkaja: '/ewallets/linkaja.png',
};

function getPlatformLogo(type: string, bankName: string | null): string | null {
  if (!bankName) return null;
  const key = bankName.toLowerCase();
  if (type === 'ewallet' || ewalletNames.includes(key)) return ewalletLogoMap[key] ?? null;
  if (type === 'bank_account') return bankLogoMap[key] ?? null;
  return null;
}

function getTargetMeta(type: string, bankName: string | null) {
  if (type === 'ewallet' || (type === 'phone' && bankName && ewalletNames.includes(bankName.toLowerCase()))) {
    return { icon: Wallet, label: bankName ?? 'E-Wallet', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' };
  }
  if (type === 'bank_account') {
    return { icon: Building2, label: bankName ?? 'Rekening Bank', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  }
  return { icon: Phone, label: 'Nomor HP', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
}

// Status agregat: kalau ada 1 verified → verified, kalau semua pending → pending, dll
function getAggregateStatus(verifiedCount: number, pendingCount: number): string {
  if (verifiedCount > 0) return 'verified';
  if (pendingCount > 0) return 'pending';
  return 'withdrawn';
}

function getStatusBadge(status: string, reportCount: number) {
  switch (status) {
    case 'verified':
      return { label: reportCount > 1 ? `${reportCount}x Terverifikasi` : 'Terverifikasi', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'pending':
      return { label: 'Menunggu', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'withdrawn':
      return { label: 'Sedang Direvisi', className: 'bg-slate-100 text-slate-500 border-slate-200' };
    default:
      return { label: status, className: 'bg-slate-50 text-slate-500 border-slate-200' };
  }
}

export default async function DatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const type = params.type ?? 'all';
  const page = parseInt(params.page ?? '1');
  const perPage = 12;

  // Fetch semua laporan (non-rejected) untuk di-group
  let query = supabase
    .from('reports')
    .select('id, target_number, target_name, target_type, bank_name, category, status, created_at')
    .in('status', ['verified', 'pending', 'withdrawn'])
    .order('created_at', { ascending: false });

  if (type === 'phone') query = query.eq('target_type', 'phone');
  if (type === 'bank_account') query = query.eq('target_type', 'bank_account');
  if (type === 'ewallet') query = query.eq('target_type', 'ewallet');

  const { data: allReports } = await query;

  // Group by target_number
  const grouped = new Map<string, {
    target_number: string;
    target_name: string | null;
    target_type: string;
    bank_name: string | null;
    category: string | null;
    latest_at: string;
    total: number;
    verified_count: number;
    pending_count: number;
  }>();

  (allReports ?? []).forEach((r) => {
    const existing = grouped.get(r.target_number);
    if (!existing) {
      grouped.set(r.target_number, {
        target_number: r.target_number,
        target_name: r.target_name,
        target_type: r.target_type,
        bank_name: r.bank_name,
        category: r.category,
        latest_at: r.created_at,
        total: 1,
        verified_count: r.status === 'verified' ? 1 : 0,
        pending_count: r.status === 'pending' ? 1 : 0,
      });
    } else {
      existing.total += 1;
      if (r.status === 'verified') existing.verified_count += 1;
      if (r.status === 'pending') existing.pending_count += 1;
      // Ambil nama dari laporan verified jika ada
      if (r.status === 'verified' && !existing.target_name) {
        existing.target_name = r.target_name;
      }
    }
  });

  // Sort: verified duluan, lalu by latest
  const groupedArray = Array.from(grouped.values()).sort((a, b) => {
    if (b.verified_count !== a.verified_count) return b.verified_count - a.verified_count;
    return new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime();
  });

  const totalUniqueNumbers = groupedArray.length;
  const totalPages = Math.ceil(totalUniqueNumbers / perPage);
  const paginatedReports = groupedArray.slice((page - 1) * perPage, page * perPage);

  const buildUrl = (newParams: Record<string, string>) => {
    const p = new URLSearchParams({ type, page: '1', ...newParams });
    return `/database?${p.toString()}`;
  };

  return (
    <main className="bg-white text-slate-900 font-sans min-h-screen">

      {/* ── Hero ── */}
      <section className="bg-slate-50 px-4 pt-10 pb-8 sm:pt-14 sm:pb-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase mb-2 leading-tight">
            Database Laporan Publik
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
            Semua laporan yang masuk ke sistem KawalTransaksi. Nomor dengan status{' '}
            <span className="font-bold text-emerald-600">VERIFIED</span> telah dikonfirmasi oleh tim auditor kami.
          </p>
        </div>
      </section>

      {/* Wave */}
      <svg viewBox="0 0 1440 50" preserveAspectRatio="none" className="w-full block bg-slate-50 -mb-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,50 C360,10 720,40 1080,15 C1260,2 1380,30 1440,50 Z" fill="#ffffff" />
      </svg>

      {/* ── Filter bar ── */}
      <section className="border-b border-slate-200 px-4 py-3 sticky top-16 bg-white z-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Tipe:</span>
            {[
              { val: 'all', label: 'Semua' },
              { val: 'phone', label: 'Nomor HP', icon: Phone },
              { val: 'bank_account', label: 'Rekening', icon: Building2 },
              { val: 'ewallet', label: 'E-Wallet', icon: Wallet },
            ].map((t) => (
              <Link key={t.val} href={buildUrl({ type: t.val })}
                className={`shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-colors flex items-center gap-1 ${
                  type === t.val
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}>
                {t.icon && <t.icon className="w-3 h-3" />}
                {t.label}
              </Link>
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:ml-auto">
            {totalUniqueNumbers} nomor
          </span>
        </div>
      </section>

      {/* ── Report cards ── */}
      <section className="px-4 py-6 sm:py-10">
        <div className="max-w-5xl mx-auto">
          {paginatedReports.length === 0 ? (
            <div className="text-center py-24">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Tidak ada laporan ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedReports.map((report) => {
                const meta = getTargetMeta(report.target_type, report.bank_name);
                const Icon = meta.icon;
                const logoSrc = getPlatformLogo(report.target_type, report.bank_name);
                const aggStatus = getAggregateStatus(report.verified_count, report.pending_count);
                const badge = getStatusBadge(aggStatus, report.verified_count);

                return (
                  <Link key={report.target_number} href={`/check/${encodeSlug(report.target_number)}`}
                    className="flex flex-col bg-white border border-slate-200 p-4 sm:p-5 rounded-xl hover:border-slate-300 hover:shadow-md transition-all group active:scale-[0.98]">
                    {/* Top row: badge + date */}
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{formatDateID(report.latest_at)}</span>
                    </div>

                    {/* Number + name */}
                    <div className="mb-3 flex-1">
                      <p className="text-base sm:text-lg font-black font-mono tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors break-all">
                        {report.target_number}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                        A.N. {report.target_name || 'Anonymous'}
                      </p>
                    </div>

                    {/* Bottom: platform + category + laporan count + arrow */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${meta.bg} ${meta.color} ${meta.border}`}>
                          {logoSrc
                            ? <Image src={logoSrc} alt={meta.label} width={12} height={12} className="object-contain rounded-sm" />
                            : <Icon className="w-3 h-3" />}
                          <span className="truncate max-w-[60px] sm:max-w-[80px]">{meta.label}</span>
                        </span>
                        {report.total > 1 && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest shrink-0">
                            {report.total} laporan
                          </span>
                        )}
                        {report.total === 1 && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate min-w-0">
                            {report.category}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 ml-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 sm:mt-10">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })}
                  className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest border border-slate-200 rounded-xl hover:border-slate-400 transition-colors active:scale-95">
                  ← Prev
                </Link>
              )}
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={buildUrl({ page: String(page + 1) })}
                  className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest border border-slate-200 rounded-xl hover:border-slate-400 transition-colors active:scale-95">
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}