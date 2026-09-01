import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import * as motion from "motion/react-client";

export const metadata: Metadata = {
  title: "Tentang Kami - KawalTransaksi",
  description:
    "KawalTransaksi adalah platform komunitas anti-penipuan digital Indonesia. Kenali cerita dan misi di balik layanan verifikasi nomor HP, rekening bank, e-wallet, dan QRIS.",
  alternates: { canonical: "https://kawaltransaksi.com/tentang-kami" },
};

export default function AboutPage() {
  return (
    <main className="bg-white text-slate-900 font-sans overflow-x-hidden">
      {/* HERO */}
      <section className="relative bg-slate-100 pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-5 leading-snug">
            Berkomitmen Melawan
            <br className="hidden sm:block" /> Penipuan Digital
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            KawalTransaksi membantu masyarakat memverifikasi nomor HP,
            rekening bank, e-wallet, dan QRIS sebelum bertransaksi, sehingga
            kepercayaan tidak lagi menjadi celah yang dimanfaatkan pelaku
            penipuan.
          </p>
        </div>
        <svg
          viewBox="0 0 1440 80"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-10 sm:h-20 block absolute bottom-0 left-0"
        >
          <path d="M0,20 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#ffffff" />
        </svg>
      </section>

      {/* ABOUT KAWALTRANSAKSI */}
      <section className="relative bg-white pt-14 pb-14 sm:pt-24 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                Tentang <span className="text-emerald-600">KawalTransaksi</span>
              </h2>
              <p className="text-slate-500 font-medium mb-6">
                Dibangun dari Kepedulian
              </p>
              <div className="flex items-center gap-2 mb-10">
                <span className="w-8 h-1 rounded-full bg-emerald-500" />
                <span className="w-4 h-1 rounded-full bg-slate-300" />
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="/hero-tentang-kami.png"
                  alt="Ilustrasi keamanan transaksi digital"
                  width={384}
                  height={384}
                  className="w-full max-w-xs sm:max-w-sm h-auto object-contain"
                  style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.10))" }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="flex flex-col justify-center space-y-6 text-gray-600 leading-relaxed"
            >
              <p className="text-justify text-base sm:text-lg">
                <strong className="text-slate-900">kawaltransaksi.com</strong>{" "}
                adalah platform komunitas anti-penipuan digital Indonesia
                yang membantu masyarakat memverifikasi nomor HP, rekening
                bank, e-wallet, dan QRIS sebelum bertransaksi. Kami berperan
                sebagai garis pertahanan pertama sebelum dana berpindah
                tangan kepada pihak yang tidak bertanggung jawab.
              </p>
              <p className="text-justify text-base sm:text-lg">
                Kami percaya bahwa penipuan digital hanya dapat dilawan
                secara kolektif. Setiap laporan yang masuk dari pengguna,
                lengkap dengan bukti pendukung, ditinjau melalui proses
                verifikasi sebelum dipublikasikan. Dengan begitu, data yang
                ditampilkan dapat dipertanggungjawabkan dan bukan sekadar
                tuduhan sepihak.
              </p>
              <p className="text-justify text-base sm:text-lg">
                Seluruh proses kami dilandasi oleh prinsip keterbukaan.
                Laporan yang telah terverifikasi dapat diakses publik secara
                gratis dan real-time, tanpa biaya tersembunyi dan tanpa
                batasan bagi siapa pun yang ingin memeriksa sebelum
                bertransaksi.
              </p>
            </motion.div>
          </div>
        </div>
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-8 sm:h-14 block pointer-events-none"
        >
          <path d="M0,0 C480,60 960,0 1440,40 L1440,60 L0,60 Z" fill="#f1f5f9" />
        </svg>
      </section>

      {/* SEJARAH + VISI MISI */}
      <section className="relative bg-slate-100 py-16 sm:py-28 overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-10">
              Sejarah
            </h2>
            <div className="space-y-6 text-slate-600 text-base sm:text-lg leading-relaxed">
              <p className="text-justify">
                KawalTransaksi didirikan pada tahun 2026 di Jakarta Utara,
                lahir dari kegelisahan yang sama dirasakan banyak orang:
                sulitnya memastikan keamanan sebuah transaksi sebelum dana
                benar-benar berpindah tangan. Nomor HP asing yang meminta
                transfer, rekening baru yang belum pernah terdengar,
                e-wallet yang tiba-tiba meminta kepercayaan, atau kode QRIS
                merchant yang tidak jelas menjadi celah yang kerap
                dimanfaatkan pelaku penipuan.
              </p>
              <p className="text-justify">
                Dari kegelisahan tersebut, KawalTransaksi dibangun sebagai
                tempat pertama yang dapat diakses sebelum transaksi
                dilakukan, bukan sesudahnya. Setiap fitur yang kami
                kembangkan selalu berangkat dari satu tujuan yang sama:
                menjadikan proses verifikasi sebagai kebiasaan yang cepat,
                gratis, dan dapat diandalkan oleh siapa saja, baik pengguna
                perorangan maupun pelaku usaha.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-8 gap-y-10">
              <p className="text-emerald-600 font-semibold text-base sm:text-lg">
                Visi
              </p>
              <p className="text-slate-900 text-xl sm:text-2xl font-semibold leading-snug">
                Menciptakan ekosistem transaksi digital yang aman bagi
                seluruh masyarakat Indonesia.
              </p>

              <p className="text-emerald-600 font-semibold text-base sm:text-lg">
                Misi
              </p>
              <p className="text-slate-900 text-xl sm:text-2xl font-semibold leading-snug">
                Membantu masyarakat terhindar dari penipuan melalui layanan
                verifikasi yang mudah, gratis, dan terbuka bagi siapa saja.
              </p>
            </div>
          </motion.div>
        </div>
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-8 sm:h-14 block pointer-events-none"
        >
          <path d="M0,40 C360,0 1080,60 1440,20 L1440,60 L0,60 Z" fill="#ffffff" />
        </svg>
      </section>

      {/* KENALAN DENGAN FOUNDER */}
      <section className="relative bg-white py-14 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">
              Kenalan dengan Pendiri Kami
            </h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Sosok di balik pengembangan KawalTransaksi, yang bertanggung
              jawab langsung atas setiap proses teknis dan keakuratan data
              yang Anda akses.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl bg-slate-50 overflow-hidden p-6 sm:p-16 border border-slate-200"
          >
            {/* Blob dekoratif */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />

            <div className="relative grid grid-cols-1 sm:grid-cols-[360px_1fr] gap-10 sm:gap-14 items-center">
              <div className="flex justify-center sm:justify-start">
                <div className="relative w-72 h-96 sm:w-full sm:h-[26rem] rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200">
                  <Image
                    src="/founder-about.png"
                    alt="Achmad Gozali, Pendiri KawalTransaksi"
                    fill
                    priority
                    className="object-cover object-top"
                  />
                </div>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-semibold text-slate-800 leading-snug mb-8">
                  &ldquo;Setiap laporan yang kami verifikasi bukan sekadar
                  data, melainkan satu potensi kerugian yang berhasil
                  dicegah sebelum terjadi.&rdquo;
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Achmad Gozali
                    </h3>
                    <p className="text-emerald-600 text-base font-semibold">
                      Pendiri &amp; Pengelola
                    </p>
                  </div>
                  <Link
                    href="/kontak"
                    className="inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold px-5 py-2.5 rounded-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors flex-shrink-0 self-center sm:self-auto"
                  >
                    Hubungi Kami <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <p className="mt-8 text-slate-600 text-base sm:text-lg leading-relaxed text-justify">
                  Berawal dari keresahan pribadi setelah melihat banyak
                  orang di sekitarnya menjadi korban penipuan digital,
                  Achmad membangun dan mengelola KawalTransaksi secara
                  mandiri, mulai dari sistem verifikasi laporan, basis data
                  komunitas, hingga infrastruktur yang menjaga situs ini
                  tetap aman dan dapat diakses kapan saja. Baginya, keamanan
                  digital seharusnya dapat diakses oleh semua orang, bukan
                  hanya mereka yang memahami teknologi.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-8 sm:h-14 block pointer-events-none"
        >
          <path d="M0,20 C360,60 1080,0 1440,50 L1440,60 L0,60 Z" fill="#f1f5f9" />
        </svg>
      </section>

      {/* CLOSING */}
      <section className="relative bg-slate-100 py-14 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="order-2 lg:order-1 text-slate-600 text-base sm:text-lg leading-relaxed text-justify"
            >
              KawalTransaksi bukan sekadar basis data, melainkan upaya
              bersama komunitas untuk membangun ekosistem transaksi digital
              yang lebih aman di Indonesia. Kami terus mengembangkan sistem
              verifikasi dan memperkuat infrastruktur, sehingga setiap
              laporan yang masuk dapat ditindaklanjuti secara cepat dan
              akurat, menjadikan proses pemeriksaan sebelum transaksi
              sebagai kebiasaan yang mudah bagi siapa saja.
            </motion.p>
            <div className="order-1 lg:order-2 flex items-center justify-center">
              <Image
                src="/ilustrasi-hero.png"
                alt="Ilustrasi komunitas menjaga transaksi digital"
                width={384}
                height={384}
                className="w-full max-w-xs sm:max-w-sm h-auto object-contain"
                style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.10))" }}
              />
            </div>
          </div>
        </div>
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-8 sm:h-14 block pointer-events-none"
        >
          <path d="M0,20 C360,60 1080,0 1440,50 L1440,60 L0,60 Z" fill="#ffffff" />
        </svg>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Bergabunglah Menjaga Ekosistem Digital yang Lebih Aman
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto mb-9 leading-relaxed">
            Laporkan nomor mencurigakan yang Anda temui, atau periksa
            terlebih dahulu sebelum bertransaksi. Setiap kontribusi
            membantu pengguna lain terhindar dari kerugian.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/report"
              className="w-full sm:w-auto px-7 py-3 bg-emerald-600 text-white font-bold text-sm tracking-wide rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              Buat Laporan Baru <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cek-nomor"
              className="w-full sm:w-auto px-7 py-3 border-2 border-slate-300 bg-white text-slate-900 font-bold text-sm tracking-wide rounded-xl hover:border-slate-900 transition-colors"
            >
              Cek Nomor Sekarang
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}