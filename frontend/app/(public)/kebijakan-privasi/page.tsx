import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - KawalTransaksi',
  description: 'Kebijakan privasi platform KawalTransaksi mengenai pengumpulan dan perlindungan data pengguna.',
};

export default function KebijakanPrivasiPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mb-2">Kebijakan Privasi</h1>
        <p className="text-sm text-zinc-400 mb-8 sm:mb-10">Terakhir diperbarui: 10 Juni 2026</p>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-10 space-y-8">
          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">1. Informasi yang Kami Kumpulkan</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Kami mengumpulkan informasi berikut saat Anda menggunakan KawalTransaksi:</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">Data Akun:</span> Alamat email dan nama lengkap yang Anda daftarkan.</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">Data Laporan:</span> Nomor target, kronologi kejadian, kategori penipuan, dan bukti yang Anda unggah.</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">Data Teknis:</span> Alamat IP, jenis peramban, dan informasi perangkat untuk keperluan keamanan dan pemantauan kinerja platform.</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">Data Penggunaan:</span> Halaman yang dikunjungi, durasi kunjungan, dan interaksi di platform yang dikumpulkan melalui layanan analitik untuk keperluan peningkatan layanan.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">2. Penggunaan Informasi</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Informasi yang kami kumpulkan digunakan untuk:</p>
              <p className="pl-4">a. Memproses dan menampilkan laporan penipuan di database publik.</p>
              <p className="pl-4">b. Memverifikasi identitas pelapor guna mencegah penyalahgunaan platform.</p>
              <p className="pl-4">c. Memproses laporan secara otomatis melalui sistem robot kami untuk deteksi pola dan penilaian tingkat risiko.</p>
              <p className="pl-4">d. Meningkatkan kualitas, keandalan, dan keamanan platform secara berkelanjutan.</p>
              <p className="pl-4">e. Menghubungi Anda terkait akun atau laporan yang Anda buat apabila diperlukan.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">3. Perlindungan Data Pelapor</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>KawalTransaksi berkomitmen penuh untuk melindungi privasi setiap pelapor:</p>
              <p className="pl-4">a. <span className="font-semibold text-zinc-700">Identitas pelapor tidak pernah ditampilkan</span> di halaman publik dalam bentuk apapun.</p>
              <p className="pl-4">b. Data pelapor disimpan dalam format terenkripsi di infrastruktur server yang aman.</p>
              <p className="pl-4">c. Akses ke identitas pelapor hanya diberikan kepada tim moderator yang berwenang untuk keperluan verifikasi laporan.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">4. Penyimpanan Data</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Seluruh data disimpan di infrastruktur Supabase yang memenuhi standar keamanan tinggi. Bukti foto atau tangkapan layar yang diunggah disimpan di layanan cloud storage terenkripsi. Data Anda akan kami simpan selama akun Anda aktif atau selama masih diperlukan untuk tujuan operasional platform.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">5. Pembagian Data ke Pihak Ketiga</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>KawalTransaksi <span className="font-semibold text-zinc-700">tidak menjual</span> data pribadi Anda kepada pihak manapun. Data hanya dapat dibagikan dalam kondisi berikut:</p>
              <p className="pl-4">a. Kronologi dan bukti laporan ditampilkan secara publik tanpa mencantumkan identitas pelapor.</p>
              <p className="pl-4">b. Apabila diwajibkan oleh ketentuan hukum yang berlaku atau perintah pengadilan yang sah.</p>
              <p className="pl-4">c. Untuk keperluan generate artikel edukasi otomatis melalui layanan Groq, yang hanya memproses data tren laporan secara agregat — bukan data pribadi pengguna.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">6. Hak Pengguna</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Sebagai pengguna, Anda memiliki hak untuk:</p>
              <p className="pl-4">a. Mengakses data pribadi yang kami simpan terkait akun Anda.</p>
              <p className="pl-4">b. Meminta koreksi atas data yang tidak akurat atau tidak relevan.</p>
              <p className="pl-4">c. Meminta penghapusan akun beserta seluruh data yang terkait.</p>
              <p className="pl-4">d. Menarik persetujuan atas penggunaan data Anda sewaktu-waktu.</p>
              <p>Untuk menggunakan hak-hak tersebut, silakan hubungi kami melalui halaman <Link href="/kontak" className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2">Kontak</Link>.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">7. Penggunaan Cookies dan Analitik</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Kami menggunakan cookies yang diperlukan untuk keperluan autentikasi dan pengelolaan sesi pengguna. Selain itu, platform ini menggunakan beberapa layanan analitik pihak ketiga guna memahami pola penggunaan dan meningkatkan kualitas layanan:</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">Google Analytics 4 (GA4):</span> Mengumpulkan data penggunaan anonim seperti jumlah pengunjung, halaman yang dikunjungi, dan sumber trafik. Data dikelola oleh Google sesuai kebijakan privasi mereka.</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">Vercel Analytics:</span> Mengumpulkan metrik performa halaman dan data penggunaan secara anonim untuk keperluan optimasi teknis platform.</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">PostHog:</span> Digunakan untuk analisis perilaku pengguna secara agregat guna memahami bagaimana fitur platform digunakan.</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">Microsoft Clarity:</span> Merekam interaksi pengguna secara anonim seperti klik dan scroll untuk keperluan analisis pengalaman pengguna (UX).</p>
              <p>Seluruh layanan analitik tersebut tidak digunakan untuk keperluan iklan bertarget. Data yang dikumpulkan bersifat anonim dan tidak dapat digunakan untuk mengidentifikasi Anda secara pribadi.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">8. Keamanan Data</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang memadai untuk melindungi data Anda, mencakup enkripsi data, Row Level Security pada database, dan mekanisme autentikasi yang aman. Meskipun demikian, tidak ada sistem yang sepenuhnya kebal terhadap ancaman, dan kami tidak dapat menjamin keamanan absolut.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">9. Perubahan Kebijakan</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu sesuai kebutuhan operasional dan regulasi yang berlaku. Perubahan signifikan akan diumumkan melalui platform. Tanggal pembaruan terakhir selalu tercantum di bagian atas halaman ini.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">10. Hubungi Kami</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Untuk pertanyaan seputar kebijakan privasi ini, silakan hubungi kami di{' '}
              <a
                href="https://mail.google.com/mail/?view=cm&to=kawaltransaksi@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2"
              >
                kawaltransaksi@gmail.com
              </a>
              {' '}atau melalui halaman{' '}
              <Link href="/kontak" className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2">Kontak</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}