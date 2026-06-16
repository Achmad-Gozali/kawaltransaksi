import type { Metadata } from "next";
import { ShieldAlert, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Edukasi Modus Penipuan - KawalTransaksi",
  description:
    "Pelajari berbagai modus penipuan online di Indonesia dan cara melindungi diri dari scam, phishing, investasi bodong, dan modus lainnya.",
};

const modusData = [
  {
    slug: "jual-beli-online",
    title: "Penipuan jual beli online",
    summary:
      "Penipu menjual barang di marketplace atau media sosial dengan harga murah. Setelah korban transfer, barang tidak dikirim.",
    redFlags: [
      "Harga jauh di bawah pasaran",
      "Minta transfer ke rekening pribadi, bukan lewat marketplace",
      "Menolak COD atau rekening bersama",
      "Akun baru dengan sedikit review",
      "Memaksa korban untuk cepat transfer",
    ],
    tips: [
      "Selalu gunakan fitur pembayaran resmi marketplace",
      "Cek reputasi dan review penjual",
      "Gunakan rekening bersama untuk transaksi di luar marketplace",
      "Jangan tergiur harga yang terlalu murah",
    ],
  },
  {
    slug: "investasi-bodong",
    title: "Investasi bodong",
    summary:
      "Menjanjikan keuntungan besar dalam waktu singkat. Biasanya menggunakan skema ponzi yang akhirnya kolaps.",
    redFlags: [
      "Menjanjikan return tetap 10–50% per bulan",
      "Tidak terdaftar di OJK",
      "Tekanan untuk mengajak orang lain bergabung",
      "Tidak jelas produk investasinya apa",
      'Testimoni palsu dari "investor sukses"',
    ],
    tips: [
      "Cek legalitas di website OJK (ojk.go.id)",
      "Jika terdengar terlalu menggiurkan, waspadai kemungkinan penipuan",
      "Jangan investasikan dana yang tidak siap Anda tanggung risikonya",
      "Waspadai skema MLM berkedok investasi",
    ],
  },
  {
    slug: "phishing-soceng",
    title: "Phishing & social engineering",
    summary:
      "Penipu berpura-pura menjadi pihak bank atau instansi resmi untuk mencuri data seperti kata sandi, PIN, atau OTP.",
    redFlags: [
      "SMS/email berisi tautan mencurigakan",
      "Mengaku dari bank dan meminta OTP",
      "Situs palsu yang menyerupai situs resmi",
      "Meminta data pribadi melalui telepon",
      "Ancaman akun akan diblokir jika tidak segera ditindaklanjuti",
    ],
    tips: [
      "Bank tidak pernah meminta OTP, PIN, atau kata sandi",
      "Selalu periksa URL — pastikan domain resmi",
      "Jangan klik tautan dari SMS/email yang tidak dikenal",
      "Aktifkan verifikasi dua langkah di semua akun penting",
    ],
  },
  {
    slug: "undian-palsu",
    title: "Undian & hadiah palsu",
    summary:
      'Korban diberitahu memenangkan hadiah besar, lalu diminta membayar "pajak" atau "biaya administrasi" terlebih dahulu.',
    redFlags: [
      "Tidak pernah mengikuti undian yang dimaksud",
      'Diminta transfer uang untuk "pajak hadiah"',
      "Menggunakan nama perusahaan besar (Telkomsel, Shopee, dll.)",
      "Menghubungi melalui WhatsApp, bukan saluran resmi",
      "Memberikan tekanan waktu untuk segera melakukan pembayaran",
    ],
    tips: [
      "Tidak ada undian yang mewajibkan pemenang membayar terlebih dahulu",
      "Verifikasi ke saluran resmi perusahaan yang disebutkan",
      "Blokir dan laporkan nomor pengirim",
      "Jangan bagikan data pribadi ke nomor yang tidak dikenal",
    ],
  },
  {
    slug: "pinjaman-online-ilegal",
    title: "Pinjaman online ilegal",
    summary:
      "Aplikasi pinjaman tidak terdaftar OJK dengan bunga sangat tinggi, lalu melakukan intimidasi kepada peminjam dan seluruh kontaknya.",
    redFlags: [
      "Tidak terdaftar di OJK",
      "Proses pencairan sangat cepat tanpa verifikasi memadai",
      "Bunga harian sangat tinggi (1–2% per hari)",
      "Meminta akses ke seluruh kontak di perangkat peminjam",
      "Melakukan teror dan ancaman melalui telepon",
    ],
    tips: [
      "Cek daftar pinjol legal di website OJK",
      "Baca syarat dan ketentuan sebelum meminjam",
      "Jangan berikan akses kontak dan galeri kepada aplikasi pinjaman",
      "Laporkan ke OJK jika mengalami intimidasi",
    ],
  },
  {
    slug: "penipuan-telepon",
    title: "Penipuan via telepon",
    summary:
      "Penipu menelepon mengaku sebagai polisi atau petugas bank, mengklaim korban terlibat kasus hukum lalu meminta transfer uang.",
    redFlags: [
      "Mengaku dari kepolisian atau kejaksaan",
      "Menyebut korban terlibat kasus pencucian uang",
      "Meminta transfer ke rekening pribadi",
      "Memberikan tekanan dan ancaman",
      "Melarang korban menghubungi pihak lain",
    ],
    tips: [
      "Polisi dan jaksa tidak pernah meminta uang melalui telepon",
      "Tutup telepon dan verifikasi ke kantor polisi terdekat",
      "Jangan panik — penipu memanfaatkan rasa takut korban",
      "Catat nomor penelepon dan laporkan ke pihak berwenang",
    ],
  },
  {
    slug: "love-scam",
    title: "Romance scam",
    summary:
      "Penipu membangun hubungan romantis secara daring selama berminggu-minggu, lalu meminta uang dengan berbagai dalih darurat.",
    redFlags: [
      "Profil terlalu sempurna (foto model, karier sukses)",
      "Selalu menolak video call",
      "Mulai meminta uang setelah hubungan terasa dekat",
      "Alasan darurat: sakit, kecelakaan, bisnis merugi",
    ],
    tips: [
      "Jangan pernah mengirim uang kepada seseorang yang belum pernah Anda temui langsung",
      "Lakukan pencarian gambar terbalik (reverse image search) pada foto profil",
      "Waspadai hubungan daring yang berkembang terlalu cepat",
      "Ceritakan kepada teman atau keluarga untuk mendapat perspektif yang lebih objektif",
    ],
  },
  {
    slug: "modus-apk",
    title: "Modus file APK",
    summary:
      "Penipu mengirim file APK berbahaya melalui WhatsApp yang disamarkan sebagai resi kurir atau undangan. Jika dipasang, saldo rekening dapat terkuras.",
    redFlags: [
      "File berekstensi .apk dari nomor yang tidak dikenal",
      'Mengaku sebagai kurir dan meminta "konfirmasi paket"',
      "Undangan pernikahan digital dari orang yang tidak dikenal",
      "Surat tilang elektronik palsu",
    ],
    tips: [
      "Jangan pernah memasang file APK yang diterima melalui WhatsApp",
      "Foto asli berakhiran .jpg atau .png, bukan .apk",
      'Nonaktifkan opsi "instal dari sumber tidak dikenal" di perangkat Anda',
      "Jika terlanjur memasang, segera lakukan factory reset pada perangkat",
    ],
  },
];

const edukasiSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://kawaltransaksi.com/edukasi",
      url: "https://kawaltransaksi.com/edukasi",
      name: "Edukasi Modus Penipuan - KawalTransaksi",
      isPartOf: { "@id": "https://kawaltransaksi.com/#website" },
    },
    {
      "@type": "FAQPage",
      mainEntity: modusData.map((modus) => ({
        "@type": "Question",
        name: modus.title,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${modus.summary} Tanda bahaya: ${modus.redFlags.join(", ")}. Tips: ${modus.tips.join(", ")}.`,
        },
      })),
    },
  ],
};

export default function EdukasiPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Hero */}
      <section className="px-4 pt-14 pb-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
            <ShieldAlert className="w-3 h-3" />
            Edukasi
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 mb-3">
            Kenali Modus Penipuan
          </h1>
          <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            {modusData.length} modus penipuan yang paling marak di Indonesia — lengkap dengan tanda bahaya dan cara melindungi diri Anda serta keluarga.
          </p>
        </div>
      </section>

      {/* Modus list */}
      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto space-y-3">
          {modusData.map((modus, i) => (
            <div
              key={modus.slug}
              id={modus.slug}
              className="bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-300 transition-colors"
            >
              {/* Card header */}
              <div className="px-6 py-5 border-b border-zinc-100">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">
                  #{String(i + 1).padStart(2, "0")}
                </p>
                <p className="text-sm font-bold text-zinc-900 mb-1.5">
                  {modus.title}
                </p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {modus.summary}
                </p>
              </div>

              {/* Red flags + tips */}
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
                <div className="px-6 py-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                      Tanda bahaya
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {modus.redFlags.map((flag, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-sm text-zinc-500 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                      Cara melindungi diri
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {modus.tips.map((tip, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-sm text-zinc-500 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(edukasiSchema) }}
      />
    </main>
  );
}