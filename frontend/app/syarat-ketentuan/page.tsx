import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan - KawalTransaksi',
  description: 'Syarat dan ketentuan penggunaan platform KawalTransaksi.',
};

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mb-2">Syarat &amp; Ketentuan</h1>
        <p className="text-sm text-zinc-400 mb-8 sm:mb-10">Terakhir diperbarui: 29 Maret 2026</p>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-10 space-y-8">
          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">1. Penerimaan Ketentuan</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Dengan mengakses dan menggunakan platform KawalTransaksi, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh syarat dan ketentuan ini. Apabila Anda tidak menyetujui salah satu ketentuan yang berlaku, harap menghentikan penggunaan layanan kami.</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">2. Deskripsi Layanan</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">KawalTransaksi menyediakan platform berbasis komunitas untuk mengecek dan melaporkan nomor telepon atau rekening bank yang terindikasi penipuan. Kami bertindak sebagai fasilitator informasi berdasarkan laporan pengguna dan tidak bertanggung jawab atas keakuratan absolut setiap data yang ditampilkan.</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">3. Akun Pengguna</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Untuk membuat laporan, Anda wajib mendaftarkan akun menggunakan alamat email yang valid. Anda sepenuhnya bertanggung jawab atas kerahasiaan kredensial akun Anda. Segala aktivitas yang dilakukan melalui akun Anda menjadi tanggung jawab pribadi Anda.</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">4. Ketentuan Pelaporan</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Dengan membuat laporan di KawalTransaksi, Anda menyatakan dan menjamin bahwa:</p>
              <p className="pl-4">a. Seluruh informasi yang Anda berikan adalah benar, akurat, dan sesuai dengan pengalaman nyata Anda.</p>
              <p className="pl-4">b. Anda memiliki bukti yang memadai untuk mendukung laporan yang dibuat.</p>
              <p className="pl-4">c. Laporan tidak dibuat dengan niat untuk memfitnah, mencemarkan nama baik, atau merugikan pihak lain secara tidak sah.</p>
              <p className="pl-4">d. Anda bersedia bertanggung jawab secara hukum atas seluruh konten laporan yang Anda buat.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">5. Larangan Penggunaan</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Pengguna dilarang keras untuk:</p>
              <p className="pl-4">a. Membuat laporan palsu, fiktif, atau yang bertujuan menyesatkan.</p>
              <p className="pl-4">b. Menggunakan platform sebagai sarana pencemaran nama baik atau intimidasi.</p>
              <p className="pl-4">c. Melakukan spam atau penyalahgunaan fitur pelaporan secara berulang.</p>
              <p className="pl-4">d. Mencoba meretas, memanipulasi, atau mengganggu sistem dan infrastruktur platform.</p>
              <p className="pl-4">e. Menggunakan skrip otomatis, bot, atau alat otomasi lainnya untuk mengakses layanan.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">6. Moderasi Konten</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">KawalTransaksi berhak untuk meninjau, mengedit, menangguhkan, atau menghapus laporan yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya. Kami juga berhak menonaktifkan atau memblokir akun pengguna yang terbukti melakukan pelanggaran berulang.</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">7. Batasan Tanggung Jawab</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">KawalTransaksi menyajikan informasi berdasarkan laporan komunitas dan analisis teknologi AI. Kami tidak memberikan jaminan atas keakuratan mutlak dari setiap data yang ditampilkan. Keputusan yang Anda ambil berdasarkan informasi di platform ini sepenuhnya menjadi tanggung jawab Anda sendiri.</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">8. Hukum yang Berlaku</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Syarat dan ketentuan ini tunduk pada dan diatur oleh hukum yang berlaku di Republik Indonesia. Setiap perselisihan yang timbul akan diupayakan diselesaikan secara musyawarah. Apabila tidak tercapai kesepakatan, penyelesaian akan dilakukan melalui lembaga peradilan yang berwenang di Indonesia.</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">9. Perubahan Ketentuan</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">KawalTransaksi berhak mengubah syarat dan ketentuan ini sewaktu-waktu sesuai kebutuhan. Setiap perubahan akan diumumkan melalui platform dan berlaku efektif sejak tanggal publikasi. Kelanjutan penggunaan layanan kami setelah perubahan dianggap sebagai persetujuan Anda terhadap ketentuan yang diperbarui.</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">10. Hubungi Kami</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Apabila Anda memiliki pertanyaan terkait syarat dan ketentuan ini, silakan hubungi kami melalui halaman <Link href="/kontak" className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2">Kontak</Link> atau kirim email ke <a href="mailto:support@kawaltransaksi.id" className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2">support@kawaltransaksi.id</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}