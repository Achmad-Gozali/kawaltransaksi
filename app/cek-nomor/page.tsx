import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import NomorSearchForm from '@/components/NomorSearchForm';

export const metadata: Metadata = {
  title: 'Cek Nomor HP - KawalTransaksi',
  description: 'Cek nomor HP atau WhatsApp terindikasi penipuan secara gratis.',
};

export const revalidate = 60;

const ewallets = [
  { id: 'gopay',   name: 'GoPay',     logo: '/ewallets/gopay.png',     description: 'Verifikasi akun GoPay dan identifikasi potensi penipuan sebelum transfer.' },
  { id: 'dana',    name: 'DANA',      logo: '/ewallets/dana.png',      description: 'Verifikasi akun DANA dan identifikasi potensi penipuan sebelum transfer.' },
  { id: 'ovo',     name: 'OVO',       logo: '/ewallets/ovo.png',       description: 'Verifikasi akun OVO dan identifikasi potensi penipuan sebelum transfer.' },
  { id: 'shopee',  name: 'ShopeePay', logo: '/ewallets/shopeepay.png', description: 'Verifikasi akun ShopeePay dan identifikasi potensi penipuan sebelum transfer.' },
  { id: 'linkaja', name: 'LinkAja',   logo: '/ewallets/linkaja.png',   description: 'Verifikasi akun LinkAja dan identifikasi potensi penipuan sebelum transfer.' },
];

const articles = [
  {
    title: 'Cek Nomor HP Penipu Online',
    desc: 'Jadilah pengguna yang cerdas dengan melakukan pengecekan apakah sebuah nomor HP berpotensi melakukan penipuan sebelum melakukan transaksi. Dengan begitu Anda dapat meminimalisir peluang tertipu ketika berbelanja online.',
  },
  {
    title: 'Nomor HP Mencurigakan',
    desc: 'Temukan riwayat laporan dari nomor HP yang mencurigakan. Kunjungi halaman database kami untuk mengetahui kredibilitas sebuah nomor dan melihat laporan yang telah diverifikasi oleh komunitas.',
  },
  {
    title: 'Database Nomor Penipu Terlengkap',
    desc: 'KawalTransaksi merupakan platform pengecekan nomor HP penipu terlengkap di Indonesia. Anda dapat mengecek nomor dari berbagai operator seperti Telkomsel, XL Axiata, Indosat, Smartfren, Tri dan masih banyak lagi.',
  },
  {
    title: 'Cara Cek Nomor HP',
    desc: 'Untuk mengecek nomor HP apakah seseorang berpotensi melakukan penipuan atau tidak, Anda hanya perlu memasukkan nomor yang ingin dicek pada kolom pencarian di atas. Kemudian Anda akan mendapatkan hasilnya secara instan.',
  },
  {
    title: 'Laporkan Nomor Penipu',
    desc: 'Semua laporan yang masuk pada database KawalTransaksi akan kami tinjau terlebih dahulu mulai dari kronologis kejadian hingga bukti berupa cuplikan percakapan maupun bukti transfer sebelum dipublikasikan.',
  },
  {
    title: 'Nomor HP Penipu Sosial Media',
    desc: 'Selain penipuan jual beli online, KawalTransaksi juga menerima laporan nomor HP yang digunakan untuk modus phishing, soceng (social engineering), investasi bodong, dan penipuan berkedok hadiah.',
  },
];

export default async function CekNomorPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10 sm:pb-20 text-center font-sans">

      {/* SECTION 1: HERO */}
      <section className="relative pt-16 sm:pt-24 pb-14 sm:pb-20 overflow-hidden border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-4 sm:mb-6 uppercase">
            Cek Nomor Telepon. <br />
            <span className="text-emerald-600 italic">Hindari Spammer.</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mb-8 sm:mb-12 max-w-xl mx-auto font-medium leading-relaxed">
            Identifikasi nomor WhatsApp atau telepon seluler yang mencurigakan sebelum Anda merespon pesan atau tawaran yang tidak dikenal.
          </p>
          <NomorSearchForm />
        </div>
      </section>

      {/* SECTION 2: CEK PER E-WALLET */}
      <section className="max-w-5xl mx-auto px-6 pt-14 mb-16 sm:mb-20 text-left">
        <div className="flex items-end justify-between mb-6 px-1 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Cek Per E-Wallet</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Pilih platform untuk mulai verifikasi</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ewallets.map((wallet) => (
            <Link
              key={wallet.id}
              href={`/cek-nomor/cek-ewallet/${wallet.id}`}
              className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-16 h-10 relative mb-4">
                  <Image src={wallet.logo} alt={`Logo ${wallet.name}`} fill className="object-contain object-left" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1 tracking-tight">{wallet.name}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{wallet.description}</p>
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