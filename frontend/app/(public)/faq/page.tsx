import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - KawalTransaksi",
  description:
    "Pertanyaan yang sering diajukan tentang KawalTransaksi, platform anti-penipuan komunitas.",
};

const faqs = [
  {
    q: "Apa itu KawalTransaksi?",
    a: "KawalTransaksi adalah platform komunitas yang memungkinkan siapa saja untuk mengecek dan melaporkan nomor telepon, rekening bank, atau e-wallet yang terindikasi penipuan. Database kami dibangun dan diverifikasi oleh komunitas pengguna.",
  },
  {
    q: "Apakah KawalTransaksi gratis?",
    a: "Ya, sepenuhnya gratis. Siapa saja bisa mengecek nomor tanpa perlu daftar akun. Untuk membuat laporan, Anda perlu mendaftar akun terlebih dahulu.",
  },
  {
    q: "Bagaimana cara melaporkan nomor penipu?",
    a: 'Daftar akun atau login, lalu klik "Laporkan" di menu navigasi. Isi formulir dengan nomor target, kategori penipuan, kronologi kejadian, dan lampirkan bukti jika ada. Laporan Anda akan langsung diproses secara otomatis oleh sistem robot kami.',
  },
  {
    q: "Bagaimana proses verifikasi laporan?",
    a: "Setiap laporan masuk langsung dianalisis oleh scoring engine kami. Sistem memberikan skor 0–100 berdasarkan sejumlah faktor: jumlah pelapor unik untuk nomor yang sama, kelengkapan dan jumlah bukti foto, detail kronologi, usia akun pelapor, riwayat laporan sebelumnya, nominal kerugian, hingga tanggal kejadian. Laporan dengan skor ≥60 otomatis terverifikasi, skor 30–59 masuk antrean pending, dan skor di bawah 30 ditolak.",
  },
  {
    q: "Faktor apa saja yang memengaruhi hasil verifikasi laporan saya?",
    a: "Ada 10 faktor utama yang dinilai sistem: (1) jumlah orang berbeda yang melaporkan nomor yang sama — semakin banyak semakin tinggi skornya; (2) jumlah bukti foto yang dilampirkan; (3) panjang dan detail kronologi — minimal 100 karakter, idealnya 200+ karakter; (4) apakah kronologi terdeteksi spam; (5) usia akun pelapor — akun lebih dari 90 hari mendapat poin lebih tinggi; (6) riwayat laporan Anda sebelumnya; (7) kewajaran nominal kerugian yang dilaporkan; (8) jarak antara tanggal kejadian dan tanggal laporan dibuat; (9) apakah nomor sedang trending banyak dilaporkan hari ini; dan (10) apakah Anda menyatakan ada korban lain.",
  },
  {
    q: "Laporan saya ditolak, apa yang bisa saya lakukan?",
    a: "Anda bisa mengajukan banding dalam 7 hari sejak laporan ditolak. Saat banding, Anda dapat menambahkan kronologi yang lebih detail, melampirkan bukti foto tambahan (maksimal 5 file dari storage KawalTransaksi), dan memperbarui nominal kerugian jika keliru. Laporan yang dibanding akan dievaluasi ulang oleh scoring engine dengan ambang batas yang sedikit lebih rendah — skor ≥45 sudah cukup untuk diverifikasi.",
  },
  {
    q: "Apakah identitas pelapor dijaga kerahasiaannya?",
    a: "Ya. Identitas pelapor seperti email dan nama tidak pernah ditampilkan di halaman publik. Yang tampil hanya kronologi, kategori, dan status laporan.",
  },
  {
    q: "Apa yang terjadi jika seseorang membuat laporan palsu berulang kali?",
    a: "Sistem auto-blocker kami akan mendeteksi pola laporan yang berulang kali ditolak. Jika laporan Anda ditolak 3 kali dalam 1 jam, akun akan diblokir sementara 24 jam. Jika 10 kali dalam sehari, blokir diperpanjang 7 hari. Jika 20 kali dalam seminggu atau sudah pernah diblokir berkali-kali, akun akan diblokir permanen. Laporan palsu atau pencemaran nama baik juga dapat dikenakan konsekuensi hukum sesuai UU ITE.",
  },
  {
    q: "Apa itu Blacklist dan bagaimana nomor bisa masuk ke sana?",
    a: "Blacklist adalah daftar nomor yang sudah terbukti berbahaya berdasarkan laporan komunitas. Sebuah nomor masuk blacklist secara otomatis ketika minimal 2 orang berbeda telah melaporkannya dan laporan mereka terverifikasi. Level blacklist ditentukan berdasarkan jumlah pelapor unik: medium (2–9 orang), high (10–19 orang), dan critical (20 orang atau lebih). Level ini juga dapat turun (confidence decay) jika tidak ada laporan baru dalam 6 bulan.",
  },
  {
    q: "Apa itu fitur Trending dan bagaimana cara kerjanya?",
    a: "Sistem trend detector kami memantau lonjakan laporan secara real-time setiap hari. Jika sebuah nomor dilaporkan 10 kali atau lebih dalam 24 jam, nomor tersebut dianggap viral dan mendapat penanda khusus. Status viral akan otomatis direset jika laporan terhadap nomor tersebut sudah tidak aktif dalam 24 jam.",
  },
  {
    q: "Apakah data di KawalTransaksi akurat?",
    a: "Data kami berasal dari laporan komunitas yang telah melalui proses verifikasi otomatis oleh scoring engine. Akurasi meningkat seiring bertambahnya jumlah pelapor untuk satu nomor — satu laporan tunggal memiliki bobot lebih rendah dibanding laporan dari banyak orang berbeda. Meski demikian, kami tetap menyarankan Anda melakukan verifikasi mandiri sebelum mengambil keputusan penting.",
  },
  {
    q: "Dari mana artikel edukasi di KawalTransaksi berasal?",
    a: "Artikel edukasi kami digenerate secara otomatis oleh sistem AI yang menganalisis tren dan pola penipuan terbaru dari database laporan. Artikel ini diperbarui secara berkala agar selalu relevan dengan modus penipuan yang sedang beredar.",
  },
  {
    q: "Saya korban penipuan, apa yang harus dilakukan?",
    a: "Segera laporkan ke pihak kepolisian (buat laporan polisi), hubungi bank atau penyedia e-wallet Anda untuk memblokir transaksi, dan laporkan nomor penipu di KawalTransaksi agar orang lain tidak menjadi korban berikutnya.",
  },
  {
    q: "Bagaimana cara menghapus laporan yang salah?",
    a: 'Jika Anda adalah pelapor dan laporan masih berstatus "pending", Anda bisa menghubungi kami melalui halaman Kontak untuk meminta penghapusan. Laporan yang sudah diverifikasi hanya bisa dihapus oleh tim moderator setelah melalui proses review.',
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://kawaltransaksi.com/faq",
      url: "https://kawaltransaksi.com/faq",
      name: "FAQ - KawalTransaksi",
      isPartOf: { "@id": "https://kawaltransaksi.com/#website" },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ],
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white sm:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <div className="sm:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            <HelpCircle className="w-3 h-3" />
            FAQ
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">
            Pertanyaan Umum
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Jawaban untuk pertanyaan yang paling sering diajukan tentang
            KawalTransaksi.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-md hover:border-zinc-300 transition-all"
            >
              <h3 className="text-base font-bold text-zinc-900 mb-2">
                {faq.q}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-sm text-zinc-400 mb-4">Masih ada pertanyaan?</p>
          <Link
            href="/kontak"
            className="inline-flex px-6 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all active:scale-95"
          >
            Hubungi Kami
          </Link>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  );
}