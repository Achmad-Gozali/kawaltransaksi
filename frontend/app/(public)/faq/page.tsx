import Link from "next/link";
import { ArrowLeft, HelpCircle, ClipboardList, ChevronDown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - KawalTransaksi",
  description:
    "Pertanyaan yang sering diajukan tentang KawalTransaksi, platform anti-penipuan komunitas.",
};

type FAQ = { q: string; a: string | React.ReactNode };

const faqGeneral: FAQ[] = [
  {
    q: "Apa itu KawalTransaksi?",
    a: "KawalTransaksi adalah platform komunitas yang memungkinkan siapa saja untuk mengecek dan melaporkan nomor telepon, rekening bank, atau e-wallet yang terindikasi penipuan. Database kami dibangun dan diverifikasi oleh komunitas pengguna.",
  },
  {
    q: "Apakah KawalTransaksi gratis?",
    a: "Ya, sepenuhnya gratis. Siapa saja bisa mengecek nomor tanpa perlu daftar akun. Untuk membuat laporan, Anda perlu mendaftar akun terlebih dahulu.",
  },
  {
    q: "Apakah identitas pelapor dijaga kerahasiaannya?",
    a: "Ya. Identitas pelapor seperti email dan nama tidak pernah ditampilkan di halaman publik. Yang tampil hanya kronologi, kategori, dan status laporan.",
  },
  {
    q: "Apakah data di KawalTransaksi akurat?",
    a: "Data kami berasal dari laporan komunitas yang telah melalui proses verifikasi otomatis oleh scoring engine. Akurasi meningkat seiring bertambahnya jumlah pelapor untuk satu nomor — satu laporan tunggal memiliki bobot lebih rendah dibanding laporan dari banyak orang berbeda. Meski demikian, kami tetap menyarankan Anda melakukan verifikasi mandiri sebelum mengambil keputusan penting.",
  },
  {
    q: "Dari mana artikel edukasi di KawalTransaksi berasal?",
    a: "Artikel edukasi kami dihasilkan secara otomatis oleh sistem AI yang menganalisis tren dan pola penipuan terbaru dari database laporan. Artikel ini diperbarui secara berkala agar selalu relevan dengan modus penipuan yang sedang beredar.",
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

const faqRobot: FAQ[] = [
  {
    q: "Bagaimana cara melaporkan nomor penipu?",
    a: 'Daftar akun atau login, lalu klik "Laporkan" di menu navigasi. Isi formulir dengan nomor target, kategori penipuan, kronologi kejadian, dan lampirkan bukti jika ada. Laporan Anda akan langsung dianalisis secara otomatis oleh sistem robot kami.',
  },
  {
    q: "Bagaimana proses verifikasi laporan?",
    a: (
      <>
        Setiap laporan masuk langsung dianalisis oleh <strong>scoring engine</strong> — sistem robot yang memberikan skor 0–100 berdasarkan 10 faktor berbeda. Hasil akhirnya:{" "}
        <ul className="mt-2 space-y-1.5 text-sm text-zinc-500">
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" /><span><strong className="text-zinc-700">Skor ≥60</strong> — laporan otomatis terverifikasi</span></li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" /><span><strong className="text-zinc-700">Skor 30–59</strong> — masuk antrean pending, perlu review lebih lanjut</span></li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 shrink-0" /><span><strong className="text-zinc-700">Skor &lt;30</strong> — laporan ditolak</span></li>
        </ul>
      </>
    ),
  },
  {
    q: "Faktor apa saja yang memengaruhi hasil verifikasi laporan saya?",
    a: (
      <>
        Ada 10 faktor yang dinilai sistem, dari yang terbesar pengaruhnya:
        <ol className="mt-3 space-y-2 text-sm text-zinc-500 list-decimal list-inside">
          <li><strong className="text-zinc-700">Jumlah pelapor unik</strong> — semakin banyak orang berbeda melaporkan nomor yang sama, skor semakin tinggi.</li>
          <li><strong className="text-zinc-700">Jumlah bukti foto</strong> — setiap foto yang dilampirkan menambah poin.</li>
          <li><strong className="text-zinc-700">Panjang kronologi</strong> — ada gradasi poin: &lt;100 karakter (-5 poin), 100–199 (+5), 200–499 (+10), dan ≥500 karakter (+15).</li>
          <li><strong className="text-zinc-700">Deteksi spam pada kronologi</strong> — kronologi yang terindikasi spam akan dikurangi poinnya.</li>
          <li><strong className="text-zinc-700">Usia akun pelapor</strong> — akun yang lebih tua (terutama &gt;90 hari) mendapat bobot lebih tinggi.</li>
          <li><strong className="text-zinc-700">Riwayat laporan sebelumnya</strong> — rekam jejak laporan Anda yang telah diverifikasi sebelumnya.</li>
          <li><strong className="text-zinc-700">Kewajaran nominal kerugian</strong> — nilai yang sangat tidak wajar dapat menurunkan skor.</li>
          <li><strong className="text-zinc-700">Jarak waktu kejadian</strong> — laporan yang dibuat jauh dari tanggal kejadian memiliki bobot lebih rendah.</li>
          <li><strong className="text-zinc-700">Status trending</strong> — nomor yang sedang banyak dilaporkan (≥10 laporan dalam 24 jam) mendapat poin tambahan.</li>
          <li><strong className="text-zinc-700">Adanya korban lain</strong> — jika Anda menyatakan ada korban lain selain Anda.</li>
        </ol>
      </>
    ),
  },
  {
    q: "Laporan saya ditolak, apa yang bisa saya lakukan?",
    a: (
      <>
        Anda bisa mengajukan <strong>banding</strong> dalam 7 hari sejak laporan ditolak. Saat banding:
        <ul className="mt-2 space-y-1 text-sm text-zinc-500">
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" /><span>Tambahkan alasan banding (minimal 50 karakter)</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" /><span>Lampirkan bukti foto tambahan (maksimal 5 file dari storage KawalTransaksi)</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" /><span>Perbarui kronologi agar lebih detail</span></li>
        </ul>
        <p className="mt-2 text-sm text-zinc-500">Laporan yang dibanding dievaluasi ulang dengan ambang batas yang lebih rendah — <strong className="text-zinc-700">skor ≥45 sudah cukup</strong> untuk diverifikasi.</p>
      </>
    ),
  },
  {
    q: "Apa itu Blacklist dan bagaimana nomor bisa masuk ke sana?",
    a: (
      <>
        Blacklist adalah daftar nomor yang sudah terbukti berbahaya berdasarkan laporan komunitas. Sebuah nomor masuk blacklist secara otomatis ketika <strong>minimal 2 orang berbeda</strong> melaporkannya dan laporan mereka terverifikasi.
        <br /><br />
        Level blacklist ditentukan berdasarkan jumlah pelapor unik:
        <ul className="mt-2 space-y-1 text-sm text-zinc-500">
          <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600">MEDIUM</span><span>2–9 pelapor unik</span></li>
          <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">HIGH</span><span>10–19 pelapor unik</span></li>
          <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">CRITICAL</span><span>≥20 pelapor unik</span></li>
        </ul>
        <p className="mt-3 text-sm text-zinc-500">Jika tidak ada laporan baru dalam 6 bulan, level blacklist akan turun secara otomatis: <strong className="text-zinc-700">critical → high</strong>, <strong className="text-zinc-700">high → medium</strong>, dan <strong className="text-zinc-700">medium → dihapus dari blacklist</strong>.</p>
      </>
    ),
  },
  {
    q: "Apa yang terjadi jika seseorang membuat laporan palsu berulang kali?",
    a: (
      <>
        Sistem <strong>auto-blocker</strong> kami mendeteksi pola laporan yang berulang kali ditolak dan menerapkan sanksi bertingkat:
        <ul className="mt-2 space-y-2 text-sm text-zinc-500">
          <li className="flex items-start gap-2"><span className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 shrink-0">24 JAM</span><span>3× laporan ditolak dalam 1 jam</span></li>
          <li className="flex items-start gap-2"><span className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 shrink-0">7 HARI</span><span>10× laporan ditolak dalam 1 hari, <em>atau</em> sudah terkena blokir 24 jam sebanyak 3 kali</span></li>
          <li className="flex items-start gap-2"><span className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 shrink-0">PERMANEN</span><span>20× laporan ditolak dalam 7 hari, <em>atau</em> sudah terkena blokir 7 hari sebanyak 2 kali</span></li>
        </ul>
        <p className="mt-3 text-sm text-zinc-500">Laporan palsu atau pencemaran nama baik juga dapat dikenakan konsekuensi hukum sesuai UU ITE.</p>
      </>
    ),
  },
  {
    q: "Apa itu fitur Trending dan bagaimana cara kerjanya?",
    a: "Sistem trend detector kami memantau lonjakan laporan secara real-time setiap hari. Jika sebuah nomor menerima 10 laporan atau lebih dalam 24 jam, nomor tersebut dianggap viral dan mendapat penanda khusus. Status viral otomatis direset jika tidak ada laporan aktif terhadap nomor tersebut dalam 24 jam terakhir.",
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
      mainEntity: [...faqGeneral, ...faqRobot].map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: typeof faq.a === "string" ? faq.a : faq.q,
        },
      })),
    },
  ],
};

function FAQItem({ faq }: { faq: FAQ }) {
  return (
    <details className="group bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 transition-colors">
      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none">
        <h3 className="text-sm font-semibold text-zinc-900 leading-snug">{faq.q}</h3>
        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-6 pb-5 text-sm text-zinc-500 leading-relaxed border-t border-zinc-100 pt-4">
        {faq.a}
      </div>
    </details>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Mobile back nav */}
      <div className="border-b border-zinc-200 bg-white sm:hidden">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
            <HelpCircle className="w-3 h-3" />
            FAQ
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">
            Pertanyaan Umum
          </h1>
          <p className="text-zinc-500 text-base max-w-md mx-auto">
            Jawaban untuk pertanyaan yang paling sering diajukan tentang KawalTransaksi.
          </p>
        </div>

        {/* General FAQs */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Umum</h2>
          </div>
          <div className="space-y-2">
            {faqGeneral.map((faq, i) => (
              <FAQItem key={i} faq={faq} />
            ))}
          </div>
        </section>

        {/* Robot System FAQs */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Laporan & Verifikasi</h2>
          </div>
          <div className="space-y-2">
            {faqRobot.map((faq, i) => (
              <FAQItem key={i} faq={faq} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
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