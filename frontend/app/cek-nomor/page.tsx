import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import NomorSearchForm from "@/components/NomorSearchForm";
import { createClient } from "@/core/supabase/server";
import { formatRupiah } from "@/core/utils";

export const metadata: Metadata = {
  title: "Cek Nomor HP - KawalTransaksi",
  description: "Cek nomor HP atau WhatsApp terindikasi penipuan secara gratis.",
};

export const revalidate = 60;

const ewallets = [
  {
    id: "gopay",
    name: "GoPay",
    logo: "/ewallets/gopay.png",
    description:
      "Verifikasi akun GoPay dan identifikasi potensi penipuan sebelum transfer.",
  },
  {
    id: "dana",
    name: "DANA",
    logo: "/ewallets/dana.png",
    description:
      "Verifikasi akun DANA dan identifikasi potensi penipuan sebelum transfer.",
  },
  {
    id: "ovo",
    name: "OVO",
    logo: "/ewallets/ovo.png",
    description:
      "Verifikasi akun OVO dan identifikasi potensi penipuan sebelum transfer.",
  },
  {
    id: "shopee",
    name: "ShopeePay",
    logo: "/ewallets/shopeepay.png",
    description:
      "Verifikasi akun ShopeePay dan identifikasi potensi penipuan sebelum transfer.",
  },
  {
    id: "linkaja",
    name: "LinkAja",
    logo: "/ewallets/linkaja.png",
    description:
      "Verifikasi akun LinkAja dan identifikasi potensi penipuan sebelum transfer.",
  },
];

const articles = [
  {
    title: "Cek Nomor HP Penipu Online",
    desc: "Jadilah pengguna yang cerdas dengan melakukan pengecekan apakah sebuah nomor HP berpotensi melakukan penipuan sebelum melakukan transaksi.",
  },
  {
    title: "Nomor HP Mencurigakan",
    desc: "Temukan riwayat laporan dari nomor HP yang mencurigakan. Kunjungi halaman database kami untuk mengetahui kredibilitas sebuah nomor.",
  },
  {
    title: "Database Nomor Penipu Terlengkap",
    desc: "KawalTransaksi merupakan platform pengecekan nomor HP penipu terlengkap di Indonesia.",
  },
  {
    title: "Cara Cek Nomor HP",
    desc: "Masukkan nomor yang ingin dicek pada kolom pencarian di atas. Kemudian Anda akan mendapatkan hasilnya secara instan.",
  },
  {
    title: "Laporkan Nomor Penipu",
    desc: "Semua laporan yang masuk akan kami tinjau mulai dari kronologis kejadian hingga bukti sebelum dipublikasikan.",
  },
  {
    title: "Nomor HP Penipu Sosial Media",
    desc: "KawalTransaksi menerima laporan nomor HP untuk modus phishing, soceng, investasi bodong, dan penipuan berkedok hadiah.",
  },
];

// ✅ OPTIMIZED: 3 query → 1 RPC call
async function getStats() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_stats_nomor");
    if (!data) return { totalLaporan: 0, totalNomor: 0, totalKerugian: 0 };
    return {
      totalLaporan: data.total_laporan ?? 0,
      totalNomor: data.total_nomor ?? 0,
      totalKerugian: Number(data.total_kerugian) ?? 0,
    };
  } catch {
    return { totalLaporan: 0, totalNomor: 0, totalKerugian: 0 };
  }
}

export default async function CekNomorPage() {
  const { totalLaporan, totalNomor, totalKerugian } = await getStats();

  const stats = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      value:
        totalLaporan > 0 ? `${totalLaporan.toLocaleString("id-ID")}+` : "0",
      desc: "Laporan terverifikasi",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      value: totalNomor > 0 ? `${totalNomor.toLocaleString("id-ID")}+` : "0",
      desc: "Nomor HP penipu",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
          <polyline points="17 18 23 18 23 12" />
        </svg>
      ),
      value:
        Number(totalKerugian) > 0 ? formatRupiah(Number(totalKerugian)) : "Rp0",
      desc: "Total kerugian dilaporkan",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <section className="relative pt-10 sm:pt-24 pb-0 overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-10 pb-10 sm:pb-24">
            <div className="flex-1 text-center md:text-left w-full">
              <h1 className="text-2xl sm:text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-3 sm:mb-6 uppercase leading-tight">
                Cek Nomor Telepon. <br />
                <span className="text-emerald-600 italic">
                  Hindari Spammer.
                </span>
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mb-6 sm:mb-12 max-w-xl mx-auto md:mx-0 leading-relaxed">
                Periksa nomor HP atau WhatsApp sebelum merespon pesan dan
                tawaran yang tidak dikenal. Lindungi diri dari potensi penipuan
                digital.
              </p>
              <NomorSearchForm />
            </div>
            <div className="hidden md:flex flex-1 justify-center md:justify-end">
              <div className="relative w-full max-w-sm md:max-w-md aspect-square">
                <Image
                  src="/hero1.png"
                  alt="Ilustrasi penipuan online"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        <svg
          viewBox="0 0 1440 80"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-10 sm:h-20 block"
        >
          <path
            d="M0,20 C360,80 1080,0 1440,60 L1440,80 L0,80 Z"
            fill="#f8fafc"
          />
        </svg>
      </section>

      <section className="bg-slate-50 pb-8 sm:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-14 relative z-10">
          <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
            <div className="grid grid-cols-3 sm:hidden divide-x divide-slate-100">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center py-4 px-2 text-center"
                >
                  <div className="text-emerald-600 mb-1.5">{stat.icon}</div>
                  <p className="text-base font-black text-emerald-600 leading-none mb-1">
                    {stat.value}
                  </p>
                  <p className="text-[9px] text-slate-400 leading-tight">
                    {stat.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="hidden sm:grid grid-cols-3 divide-x divide-slate-100">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 px-8 py-8 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-600 mb-1">
                      {stat.value}
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {stat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-center text-left">
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 mb-2 sm:mb-3">
                Apa itu Cek Nomor HP?
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Layanan verifikasi nomor HP KawalTransaksi membantu Anda
                mengidentifikasi potensi risiko penipuan pada nomor yang tidak
                dikenal, berdasarkan laporan dan keluhan pengguna yang telah
                berinteraksi sebelumnya.
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-5 sm:px-8 py-5 sm:py-7">
              <p className="text-slate-800 text-sm font-bold leading-relaxed text-center">
                &quot;KawalTransaksi hadir untuk melindungi masyarakat Indonesia
                dari ancaman penipuan digital yang terus berkembang setiap
                harinya.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 mb-10 sm:mb-20 text-left">
        <div className="flex items-end justify-between mb-4 sm:mb-6 border-b border-slate-200 pb-3 sm:pb-4">
          <div>
            <h2 className="text-sm sm:text-xl font-black text-slate-900 uppercase tracking-tight">
              Cek Per E-Wallet
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Pilih platform untuk mulai verifikasi
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {ewallets.map((wallet) => (
            <Link
              key={wallet.id}
              href={`/cek-nomor/cek-ewallet/${wallet.id}`}
              className="group bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-8 sm:w-16 sm:h-10 relative mb-3 sm:mb-4">
                  <Image
                    src={wallet.logo}
                    alt={`Logo ${wallet.name}`}
                    fill
                    className="object-contain object-left"
                  />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 mb-1 tracking-tight">
                  {wallet.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed hidden sm:block">
                  {wallet.description}
                </p>
              </div>
              <div className="mt-3 sm:mt-5 pt-2 sm:pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Cek Selengkapnya
                </span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-24 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 sm:gap-x-16 gap-y-6 sm:gap-y-12">
          {articles.map((article, i) => (
            <div key={i}>
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 mb-1.5 sm:mb-3">
                {article.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {article.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
