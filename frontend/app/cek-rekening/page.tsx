import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import RekeningSearchForm from '@/components/RekeningSearchForm';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Cek Rekening - KawalTransaksi',
  description: 'Verifikasi keamanan nomor rekening bank secara real-time.',
};

export const revalidate = 60;

const banks = [
  { id: 'bca',     name: 'Bank Central Asia',     logo: '/banks/bca.png',     description: 'Verifikasi rekening BCA dan identifikasi potensi penipuan sebelum transfer.' },
  { id: 'bri',     name: 'Bank Rakyat Indonesia',  logo: '/banks/bri.png',     description: 'Verifikasi rekening BRI dan identifikasi potensi penipuan sebelum transfer.' },
  { id: 'bni',     name: 'Bank Negara Indonesia',  logo: '/banks/bni.png',     description: 'Verifikasi rekening BNI dan identifikasi potensi penipuan sebelum transfer.' },
  { id: 'mandiri', name: 'Bank Mandiri',           logo: '/banks/mandiri.png', description: 'Verifikasi rekening Mandiri dan identifikasi potensi penipuan sebelum transfer.' },
  { id: 'cimb',    name: 'Bank CIMB Niaga',        logo: '/banks/cimb.png',    description: 'Verifikasi rekening CIMB Niaga dan identifikasi potensi penipuan sebelum transfer.' },
  { id: 'bsi',     name: 'Bank Syariah Indonesia', logo: '/banks/bsi.png',     description: 'Verifikasi rekening BSI dan identifikasi potensi penipuan sebelum transfer.' },
];

const articles = [
  { title: 'Cek Rekening Penjual Online', desc: 'Jadilah smart shopper dengan melakukan pengecekan apakah seorang penjual berpotensi melakukan penipuan atau tidak sebelum berbelanja online.' },
  { title: 'Rekening Bank Mencurigakan', desc: 'Temukan riwayat laporan dari rekening bank yang mencurigakan. Kunjungi halaman database kami untuk mengetahui kredibilitas sebuah rekening.' },
  { title: 'Cek Rekening Bank Terlengkap', desc: 'KawalTransaksi merupakan platform pengecekan rekening penipu terlengkap. Cek nomor rekening BCA, BRI, BNI, Mandiri, CIMB Niaga, BSI, dan lainnya.' },
  { title: 'Cara Cek Nomor Rekening', desc: 'Masukkan nomor rekening yang ingin dicek pada kolom pencarian di atas untuk mendapatkan hasil pengecekan.' },
  { title: 'Laporkan Rekening Penipu', desc: 'Semua laporan yang masuk akan kami tinjau dari kronologis kejadian hingga bukti transfer sebelum dipublikasikan.' },
  { title: 'Sudah Terlanjur Transfer ke Penipu?', desc: 'Segera hubungi bank Anda untuk memblokir transaksi dan laporkan nomor rekening tersebut ke KawalTransaksi.' },
];

function formatRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000;
    return `Rp${val % 1 === 0 ? val : val.toFixed(1)} M`.replace('.', ',');
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `Rp${val % 1 === 0 ? val : val.toFixed(1)} Jt`.replace('.', ',');
  }
  return `Rp${amount.toLocaleString('id-ID')}`;
}

async function getStats() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
          },
        },
      }
    );

    const { count: totalLaporan } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified')
      .eq('target_type', 'bank_account');

    const { count: totalRekening } = await supabase
      .from('reports')
      .select('target_number', { count: 'exact', head: true })
      .eq('target_type', 'bank_account')
      .not('target_number', 'is', null);

    const { data: kerugianData } = await supabase
      .from('reports')
      .select('loss_amount')
      .eq('target_type', 'bank_account')
      .gte('created_at', '2018-01-01')
      .not('loss_amount', 'is', null);

    const totalKerugian = (kerugianData ?? []).reduce<number>(
      (sum, row) => sum + (Number(row.loss_amount) || 0), 0
    );

    return { totalLaporan: totalLaporan ?? 0, totalRekening: totalRekening ?? 0, totalKerugian };
  } catch {
    return { totalLaporan: 0, totalRekening: 0, totalKerugian: 0 };
  }
}

export default async function CekRekeningPage() {
  const { totalLaporan, totalRekening, totalKerugian } = await getStats();

  const stats = [
    {
      icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>),
      value: totalLaporan > 0 ? `${totalLaporan.toLocaleString('id-ID')}+` : 'Belum ada data',
      desc: 'Laporan rekening penipu yang telah diverifikasi komunitas',
    },
    {
      icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
      value: totalRekening > 0 ? `${totalRekening.toLocaleString('id-ID')}+` : 'Belum ada data',
      desc: 'Nomor rekening penipu dalam database kami',
    },
    {
      icon: (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>),
      value: Number(totalKerugian) > 0 ? `${formatRupiah(Number(totalKerugian))}+` : 'Belum ada data',
      desc: 'Total kerugian yang dilaporkan sejak 1 Maret 2026',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10 sm:pb-20 text-center font-sans">

      <section className="relative pt-14 sm:pt-24 pb-0 overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-10 pb-14 sm:pb-24">
            <div className="flex-1 text-center md:text-left w-full">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-3 sm:mb-6 uppercase leading-tight">
                Cek Rekening Bank. <br />
                <span className="text-emerald-600 italic">Amankan Transaksi.</span>
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mb-7 sm:mb-12 max-w-xl mx-auto md:mx-0 font-medium leading-relaxed">
                Verifikasi kredibilitas nomor rekening tujuan sebelum melakukan transfer dana. Hindari risiko penipuan finansial dalam satu klik.
              </p>
              <RekeningSearchForm />
            </div>
            <div className="hidden sm:flex flex-1 justify-center md:justify-end">
              <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square">
                <Image src="/hero.png" alt="Ilustrasi penipuan online" fill className="object-contain drop-shadow-lg" priority />
              </div>
            </div>
          </div>
        </div>
        <div className="w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 sm:h-20 block">
            <path d="M0,20 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      <section className="bg-slate-50 pb-10 sm:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-14 relative z-10">
          <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-start gap-4 px-6 sm:px-8 py-7 sm:py-8 text-left">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">{stat.icon}</div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 mb-1">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{stat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-10 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center text-left">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-3">Apa itu Cek Rekening?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Cek Rekening adalah layanan dari KawalTransaksi yang dapat mengidentifikasi apakah sebuah nomor rekening bank berpotensi digunakan untuk penipuan atau tidak, berdasarkan keluhan dan laporan pengguna yang pernah bertransaksi dengan rekening tersebut.
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-6 sm:px-8 py-6 sm:py-7">
              <p className="text-slate-800 text-sm sm:text-base font-bold leading-relaxed text-center">
                &quot;Sebelum transfer, selalu verifikasi rekening tujuan. Satu langkah kecil yang bisa menyelamatkan uang Anda dari tangan penipu.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-14 mb-14 sm:mb-20 text-left">
        <div className="flex items-end justify-between mb-5 sm:mb-6 px-1 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight">Cek Rekening Per Bank</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Pilih bank untuk mulai verifikasi</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {banks.map((bank) => (
            <Link key={bank.id} href={`/cek-rekening/${bank.id}`}
              className="group bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-16 h-10 relative mb-4">
                  <Image src={bank.logo} alt={`Logo ${bank.name}`} fill className="object-contain object-left" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1 tracking-tight">{bank.name}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{bank.description}</p>
              </div>
              <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 group-hover:text-emerald-700 uppercase tracking-wider transition-colors">Cek Selengkapnya</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-14 sm:pb-24 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 sm:gap-x-16 gap-y-8 sm:gap-y-12">
          {articles.map((article, i) => (
            <div key={i}>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3">{article.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{article.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}