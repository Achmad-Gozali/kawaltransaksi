import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import RekeningSearchForm from '@/components/RekeningSearchForm';

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
  {
    title: 'Cek Rekening Penjual Online',
    desc: 'Jadilah smart shopper dengan melakukan pengecekan apakah seorang penjual berpotensi melakukan penipuan atau tidak sebelum berbelanja online. Dengan begitu Anda dapat meminimalisir peluang tertipu ketika berbelanja online.',
  },
  {
    title: 'Rekening Bank Mencurigakan',
    desc: 'Temukan riwayat laporan dari rekening bank yang mencurigakan. Kunjungi halaman database kami untuk mengetahui kredibilitas sebuah rekening dan melihat laporan yang telah diverifikasi oleh komunitas.',
  },
  {
    title: 'Cek Rekening Bank Terlengkap',
    desc: 'KawalTransaksi merupakan platform pengecekan rekening penipu terlengkap. Anda dapat mengecek nomor rekening bank seperti BCA, BRI, BNI, Mandiri, CIMB Niaga, BSI, dan masih banyak lagi.',
  },
  {
    title: 'Cara Cek Nomor Rekening',
    desc: 'Untuk mengecek nomor rekening apakah seseorang berpotensi melakukan penipuan atau tidak, Anda hanya perlu memasukkan nomor rekening yang ingin dicek pada kolom pencarian di atas. Kemudian Anda akan mendapatkan hasilnya.',
  },
  {
    title: 'Laporkan Rekening Penipu',
    desc: 'Semua laporan yang masuk pada database KawalTransaksi akan kami tinjau terlebih dahulu mulai dari kronologis kejadian hingga bukti berupa cuplikan percakapan maupun bukti transfer sebelum dipublikasikan.',
  },
  {
    title: 'Sudah Terlanjur Transfer ke Penipu?',
    desc: 'Jika Anda sudah terlanjur transfer ke rekening penipu, segera hubungi bank Anda untuk memblokir transaksi. Laporkan juga nomor rekening tersebut ke KawalTransaksi agar korban lain dapat terhindar.',
  },
];

export default async function CekRekeningPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">

      {/* SECTION 1: HERO */}
      <section className="relative pt-16 sm:pt-24 pb-0 overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10 pb-16 sm:pb-24">

            {/* KIRI: Teks + Form */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-4 sm:mb-6 leading-tight uppercase">
                Cek Rekening Bank. <br />
                <span className="text-emerald-600 italic">Amankan Transaksi.</span>
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mb-8 sm:mb-12 max-w-xl font-medium leading-relaxed">
                Verifikasi kredibilitas nomor rekening tujuan sebelum melakukan transfer dana. Hindari risiko penipuan finansial dalam satu klik.
              </p>
              <RekeningSearchForm />
            </div>

            {/* KANAN: Foto Hero */}
            <div className="flex-1 flex justify-center md:justify-end">
              <div className="relative w-full max-w-sm md:max-w-md aspect-square">
                <Image
                  src="/hero.png"
                  alt="Ilustrasi penipuan online"
                  fill
                  className="object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </div>

          </div>
        </div>

        {/* WAVE SEPARATOR */}
        <div className="w-full overflow-hidden leading-none -mb-1">
          <svg
            viewBox="0 0 1440 80"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-16 sm:h-20 block"
          >
            <path d="M0,20 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* SECTION 2: CEK REKENING PER BANK */}
      <section className="max-w-5xl mx-auto px-6 pt-14 mb-20">
        <div className="flex items-end justify-between mb-6 px-1 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Cek Rekening Per Bank</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Pilih bank untuk mulai verifikasi</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((bank) => (
            <Link
              key={bank.id}
              href={`/cek-rekening/${bank.id}`}
              className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-16 h-10 relative mb-4">
                  <Image src={bank.logo} alt={`Logo ${bank.name}`} fill className="object-contain object-left" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1 tracking-tight">{bank.name}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{bank.description}</p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 group-hover:text-emerald-700 uppercase tracking-wider transition-colors">
                  Cek Selengkapnya
                </span>
                <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 3: ARTIKEL */}
      <section className="max-w-5xl mx-auto px-6 pb-16 sm:pb-24 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-12">
          {articles.map((article, i) => (
            <div key={i}>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3">{article.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{article.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}