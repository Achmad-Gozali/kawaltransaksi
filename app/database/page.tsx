import { createClient } from '@/lib/supabase-server';
import { formatDateID } from '@/lib/utils';
import { Phone, Building2, Wallet, ArrowUpRight, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 60;

const ewalletNames = ['gopay', 'dana', 'ovo', 'shopeepay', 'linkaja'];

const bankLogoMap: Record<string, string> = {
  bca: '/banks/bca.png',
  bni: '/banks/bni.png',
  bri: '/banks/bri.png',
  bsi: '/banks/bsi.png',
  cimb: '/banks/cimb.png',
  mandiri: '/banks/mandiri.png',
};

const ewalletLogoMap: Record<string, string> = {
  gopay: '/ewallets/gopay.png',
  dana: '/ewallets/dana.png',
  ovo: '/ewallets/ovo.png',
  shopeepay: '/ewallets/shopeepay.png',
  linkaja: '/ewallets/linkaja.png',
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
    return {
      icon: Wallet,
      label: bankName ?? 'E-Wallet',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
    };
  }
  if (type === 'bank_account') {
    return {
      icon: Building2,
      label: bankName ?? 'Rekening Bank',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    };
  }
  return {
    icon: Phone,
    label: 'Nomor HP',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  };
}

export default async function DatabasePage({
  searchParams,
}: {
  searchParams: { type?: string; page?: string };
}) {
  const supabase = await createClient();

  const type = searchParams.type ?? 'all';
  const page = parseInt(searchParams.page ?? '1');
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('reports')
    .select('id, target_number, target_name, target_type, bank_name, category, status, created_at', { count: 'exact' })
    .order('status', { ascending: true }) // verified comes before pending alphabetically — adjust if needed
    .order('created_at', { ascending: false })
    .range(from, to);

  if (type === 'phone') query = query.eq('target_type', 'phone');
  if (type === 'bank_account') query = query.eq('target_type', 'bank_account');
  if (type === 'ewallet') query = query.eq('target_type', 'ewallet');

  const { data: reports, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / perPage);

  const buildUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams({ type, page: '1', ...params });
    return `/database?${p.toString()}`;
  };

  return (
    <main className="bg-white text-slate-900 font-sans min-h-screen">

      {/* ── HEADER ── */}
      <section className="border-b border-slate-200 px-4 pt-14 pb-10 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase mb-2">
            Database Laporan Publik
          </h1>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Semua laporan yang masuk ke sistem KawalTransaksi. Nomor dengan status{' '}
            <span className="font-bold text-emerald-600">VERIFIED</span> telah dikonfirmasi oleh tim auditor kami.
          </p>
        </div>
      </section>

      {/* ── FILTER ── */}
      <section className="border-b border-slate-200 px-4 py-4 sticky top-16 bg-white z-10">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2 items-center">

          {/* Filter Tipe */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipe:</span>
            {[
              { val: 'all', label: 'Semua' },
              { val: 'phone', label: 'Nomor HP', icon: Phone },
              { val: 'bank_account', label: 'Rekening', icon: Building2 },
              { val: 'ewallet', label: 'E-Wallet', icon: Wallet },
            ].map((t) => (
              <Link
                key={t.val}
                href={buildUrl({ type: t.val })}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-colors flex items-center gap-1 ${
                  type === t.val
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {t.icon && <t.icon className="w-3 h-3" />}
                {t.label}
              </Link>
            ))}
          </div>

          {/* Total */}
          <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {count ?? 0} laporan
          </span>
        </div>
      </section>

      {/* ── LIST LAPORAN ── */}
      <section className="px-4 py-10">
        <div className="max-w-5xl mx-auto">
          {!reports || reports.length === 0 ? (
            <div className="text-center py-24">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tidak ada laporan ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reports.map((report) => {
                const meta = getTargetMeta(report.target_type, report.bank_name);
                const Icon = meta.icon;
                const logoSrc = getPlatformLogo(report.target_type, report.bank_name);
                const isVerified = report.status === 'verified';

                return (
                  <Link
                    key={report.id}
                    href={`/check/${report.target_number}`}
                    className="block bg-white border border-slate-200 p-5 rounded-lg hover:border-slate-300 hover:shadow-md transition-all group"
                  >
                    {/* Top row */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded border ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isVerified ? 'Verified' : 'Pending'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDateID(report.created_at)}
                      </span>
                    </div>

                    {/* Nomor & Nama */}
                    <div className="mb-4">
                      <p className="text-lg font-black font-mono tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
                        {report.target_number}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        A.N. {report.target_name || 'Anonymous'}
                      </p>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bg} ${meta.color} ${meta.border}`}>
                          {logoSrc ? (
                            <Image
                              src={logoSrc}
                              alt={meta.label}
                              width={14}
                              height={14}
                              className="object-contain rounded-sm"
                            />
                          ) : (
                            <Icon className="w-3 h-3" />
                          )}
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{report.category}</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border border-slate-200 rounded-lg hover:border-slate-400 transition-colors"
                >
                  ← Prev
                </Link>
              )}
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border border-slate-200 rounded-lg hover:border-slate-400 transition-colors"
                >
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