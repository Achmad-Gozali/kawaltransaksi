import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan - KawalTransaksi',
  description: 'Syarat dan ketentuan penggunaan platform KawalTransaksi.',
};

const sections = [
  {
    title: '1. Penerimaan Ketentuan',
    content: (
      <p>
        Dengan mengakses dan menggunakan platform KawalTransaksi, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh syarat dan ketentuan ini secara penuh. Apabila Anda tidak menyetujui salah satu ketentuan yang tercantum, kami mohon Anda menghentikan penggunaan layanan kami.
      </p>
    ),
  },
  {
    title: '2. Deskripsi Layanan',
    content: (
      <p>
        KawalTransaksi menyediakan platform berbasis komunitas untuk mengecek dan melaporkan nomor telepon, rekening bank, serta dompet digital (e-wallet) yang terindikasi tindak penipuan. Kami berperan sebagai fasilitator informasi berdasarkan laporan pengguna dan tidak bertanggung jawab atas keakuratan absolut setiap data yang ditampilkan di platform.
      </p>
    ),
  },
  {
    title: '3. Akun Pengguna',
    content: (
      <p>
        Untuk membuat laporan, Anda diwajibkan mendaftarkan akun menggunakan alamat email yang valid dan aktif. Anda sepenuhnya bertanggung jawab atas kerahasiaan kredensial akun Anda. Segala aktivitas yang dilakukan melalui akun Anda merupakan tanggung jawab pribadi Anda sepenuhnya.
      </p>
    ),
  },
  {
    title: '4. Ketentuan Pelaporan',
    content: (
      <div className="space-y-2">
        <p>Dengan membuat laporan di KawalTransaksi, Anda menyatakan dan menjamin bahwa:</p>
        <p className="pl-4">a. Seluruh informasi yang Anda sampaikan adalah benar, akurat, dan berdasarkan pengalaman nyata yang dapat dipertanggungjawabkan.</p>
        <p className="pl-4">b. Anda memiliki bukti yang memadai untuk mendukung setiap laporan yang dibuat.</p>
        <p className="pl-4">c. Laporan tidak dibuat dengan maksud untuk memfitnah, mencemarkan nama baik, atau merugikan pihak lain secara tidak sah.</p>
        <p className="pl-4">d. Anda bersedia bertanggung jawab secara hukum atas seluruh konten laporan yang Anda publikasikan melalui platform ini.</p>
      </div>
    ),
  },
  {
    title: '5. Larangan Penggunaan',
    content: (
      <div className="space-y-2">
        <p>Pengguna dilarang untuk melakukan hal-hal berikut:</p>
        <p className="pl-4">a. Membuat laporan palsu, fiktif, atau yang bertujuan menyesatkan pihak lain.</p>
        <p className="pl-4">b. Menggunakan platform sebagai sarana pencemaran nama baik, intimidasi, atau pelecehan terhadap individu maupun kelompok.</p>
        <p className="pl-4">c. Melakukan penyalahgunaan fitur pelaporan secara berulang atau dalam bentuk spam.</p>
        <p className="pl-4">d. Berupaya meretas, memanipulasi, atau mengganggu sistem, infrastruktur, maupun keamanan platform dengan cara apapun.</p>
        <p className="pl-4">e. Menggunakan skrip otomatis atau alat otomasi pihak ketiga yang tidak mendapat izin resmi dari KawalTransaksi untuk mengakses layanan.</p>
      </div>
    ),
  },
  {
    title: '6. Moderasi Konten',
    content: (
      <p>
        KawalTransaksi berhak untuk meninjau, mengedit, menangguhkan, atau menghapus laporan yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya. Kami juga berhak menonaktifkan atau memblokir akun pengguna yang terbukti melakukan pelanggaran, baik secara berulang maupun dalam satu kejadian yang dinilai berat.
      </p>
    ),
  },
  {
    title: '7. Batasan Tanggung Jawab',
    content: (
      <p>
        KawalTransaksi menyajikan informasi berdasarkan laporan komunitas yang telah melalui proses verifikasi otomatis oleh sistem verifikasi otomatis kami. Meskipun kami senantiasa berupaya menjaga kualitas dan akurasi data, kami tidak memberikan jaminan mutlak atas kebenaran setiap informasi yang ditampilkan. Setiap keputusan yang Anda ambil berdasarkan informasi di platform ini sepenuhnya menjadi tanggung jawab Anda sendiri.
      </p>
    ),
  },
  {
    title: '8. Hukum yang Berlaku',
    content: (
      <p>
        Syarat dan ketentuan ini tunduk pada dan diatur oleh hukum yang berlaku di Republik Indonesia. Setiap perselisihan yang timbul akan diupayakan untuk diselesaikan secara musyawarah mufakat. Apabila tidak tercapai kesepakatan, penyelesaian akan dilakukan melalui lembaga peradilan yang berwenang di wilayah hukum Republik Indonesia.
      </p>
    ),
  },
  {
    title: '9. Perubahan Ketentuan',
    content: (
      <p>
        KawalTransaksi berhak mengubah syarat dan ketentuan ini sewaktu-waktu sesuai dengan perkembangan layanan dan ketentuan hukum yang berlaku. Setiap perubahan akan diumumkan melalui platform dan berlaku efektif sejak tanggal publikasi. Kelanjutan penggunaan layanan kami setelah perubahan diterbitkan dianggap sebagai bentuk persetujuan Anda terhadap ketentuan yang telah diperbarui.
      </p>
    ),
  },
  {
    title: '10. Hubungi Kami',
    content: (
      <p>
        Apabila Anda memiliki pertanyaan atau memerlukan klarifikasi terkait syarat dan ketentuan ini, silakan menghubungi kami melalui halaman{' '}
        <Link href="/kontak" className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2">Kontak</Link>
        {' '}atau melalui email di{' '}
        <a
          href="https://mail.google.com/mail/?view=cm&to=kawaltransaksi@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2"
        >
          kawaltransaksi@gmail.com
        </a>.
      </p>
    ),
  },
];

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mb-2">
          Syarat &amp; Ketentuan
        </h1>
        <p className="text-sm text-zinc-400 mb-8 sm:mb-10">Terakhir diperbarui: 10 Juni 2026</p>

        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          {sections.map((section, i) => (
            <div
              key={i}
              className={`px-6 sm:px-10 py-7 text-sm text-zinc-500 leading-relaxed ${
                i !== sections.length - 1 ? 'border-b border-zinc-100' : ''
              }`}
            >
              <h2 className="text-sm font-bold text-zinc-900 mb-3">{section.title}</h2>
              {section.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}