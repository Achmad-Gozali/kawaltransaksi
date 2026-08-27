import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — KawalTransaksi',
};

export default function KebijakanPrivasiPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Kebijakan Privasi</h1>
          <p className="text-slate-500 text-sm">Terakhir diperbarui: 28 Agustus 2026</p>
        </div>

        <div className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-li:leading-relaxed">
          <p>
            Kebijakan Privasi ini menjelaskan bagaimana KawalTransaksi (&ldquo;kami&rdquo;)
            mengumpulkan, menggunakan, menyimpan, dan membagikan data ketika Anda
            mengakses situs kawaltransaksi.com beserta seluruh layanannya. Dengan
            menggunakan layanan kami, Anda menyatakan telah membaca dan memahami
            ketentuan dalam kebijakan ini.
          </p>

          <h2>1. Data yang Kami Kumpulkan</h2>

          <h3>a. Data yang Anda berikan saat membuat akun</h3>
          <p>
            Ketika Anda mendaftar, kami mengumpulkan <strong>nama</strong> dan
            <strong> alamat email</strong>. Apabila Anda mendaftar menggunakan kata
            sandi, kata sandi tersebut tidak pernah kami simpan dalam bentuk asli,
            melainkan hanya sebagai nilai acak hasil fungsi hash (algoritma Argon2).
            Apabila Anda mendaftar atau masuk melalui akun Google, kami menerima
            nama dan alamat email dari profil Google Anda. Untuk memverifikasi
            kepemilikan email, kami mengirimkan kode OTP ke alamat email Anda.
          </p>

          <h3>b. Data yang Anda berikan saat membuat laporan</h3>
          <p>
            Formulir laporan dapat memuat data berikut, sesuai yang Anda isi:
          </p>
          <ul>
            <li>Data pihak yang dilaporkan: nomor telepon, nomor rekening dan nama bank, akun e-wallet, atau data merchant QRIS (NMID, nama, dan kota merchant yang dibaca otomatis dari kode QR);</li>
            <li>Nama atau identitas terduga pelaku, dugaan kota/lokasi, nama toko atau lapak, serta akun media sosial dan tautan terkait;</li>
            <li>Kronologi kejadian, kategori penipuan, platform tempat kejadian, tanggal kejadian, dan estimasi nilai kerugian;</li>
            <li>Informasi apakah terdapat korban lain dan pihak lain yang sudah menerima laporan serupa;</li>
            <li>Berkas bukti yang Anda unggah, termasuk tangkapan layar, bukti transfer, foto kode QRIS, dan (bila Anda sertakan) foto terduga pelaku.</li>
          </ul>
          <p>
            Laporan pada dasarnya berisi data mengenai <strong>pihak ketiga</strong>
            (orang atau usaha yang Anda duga melakukan penipuan). Anda bertanggung
            jawab untuk hanya mengirimkan data yang benar, relevan, dan Anda peroleh
            secara sah.
          </p>

          <h3>c. Data yang terkumpul secara otomatis</h3>
          <p>
            Server kami mencatat <strong>alamat IP</strong>, jenis peramban, serta
            waktu dan alamat halaman yang diakses di dalam log teknis. Data ini
            digunakan untuk keamanan, pembatasan laju permintaan (rate limiting),
            dan pemecahan masalah. Kami tidak menggunakan layanan analitik pihak
            ketiga yang melacak perilaku Anda antar situs.
          </p>

          <h2>2. Cara Kami Menggunakan Data</h2>
          <ul>
            <li>Menyediakan, mengoperasikan, dan memelihara layanan verifikasi dan pelaporan;</li>
            <li>Mengautentikasi akun Anda dan menjaga sesi masuk tetap aktif;</li>
            <li>Meninjau, memverifikasi, dan memoderasi laporan sebelum dan sesudah dipublikasikan;</li>
            <li>Mengirimkan email transaksional yang berkaitan dengan akun dan laporan Anda (kode verifikasi, tautan pengaturan ulang kata sandi, serta pemberitahuan terkait);</li>
            <li>Mencegah penyalahgunaan, spam, aktivitas otomatis, dan upaya peretasan terhadap platform.</li>
          </ul>

          <h2>3. Publikasi Data Laporan</h2>
          <p>
            Isi laporan yang telah <strong>diverifikasi</strong>, dan sebagian
            informasi dari laporan yang <strong>masih dalam proses verifikasi</strong>,
            ditampilkan kepada publik. Informasi yang dapat tampil meliputi data
            pihak yang dilaporkan, kategori, kronologi, estimasi kerugian, berkas
            bukti, foto terduga pelaku, akun media sosial, dan tautan terkait.
          </p>
          <p>
            <strong>Identitas pelapor tidak pernah ditampilkan kepada publik.</strong>
            Nama dan email pelapor hanya dapat dilihat oleh tim moderator internal
            untuk keperluan verifikasi dan penanganan penyalahgunaan. Pihak yang
            merasa datanya dilaporkan secara keliru dapat mengajukan banding melalui
            halaman detail laporan.
          </p>

          <h2>4. Penyimpanan Data dan Layanan Pihak Ketiga</h2>
          <p>
            Data akun dan laporan disimpan pada basis data di server yang kami
            kelola. Berkas bukti dan gambar disimpan pada layanan penyimpanan objek
            Cloudflare R2 dan disajikan melalui jaringan Cloudflare. Untuk
            menjalankan layanan, kami menggunakan penyedia pihak ketiga berikut
            sebagai pemroses data:
          </p>
          <ul>
            <li><strong>Cloudflare</strong> — jaringan pengiriman konten, penyimpanan berkas (R2), dan perlindungan anti-bot (Turnstile) pada halaman pendaftaran, masuk, dan pelaporan;</li>
            <li><strong>Google</strong> — apabila Anda memilih masuk menggunakan akun Google;</li>
            <li><strong>Penyedia layanan email</strong> — untuk pengiriman email transaksional;</li>
            <li><strong>Have I Been Pwned</strong> — untuk memeriksa apakah kata sandi Anda pernah bocor; hanya lima karakter pertama dari nilai hash kata sandi yang dikirim, sehingga kata sandi Anda tidak dapat direkonstruksi oleh pihak mana pun.</li>
          </ul>
          <p>
            Kami tidak menjual atau menyewakan data pribadi Anda. Data hanya
            dibagikan kepada pihak lain apabila diwajibkan oleh hukum, perintah
            pengadilan, atau permintaan resmi dari aparat penegak hukum, atau
            apabila diperlukan untuk melindungi keselamatan dan hak pengguna lain.
          </p>

          <h2>5. Keamanan</h2>
          <p>
            Kami menerapkan sejumlah langkah pengamanan, antara lain enkripsi
            koneksi (HTTPS), penyimpanan kata sandi dalam bentuk hash, token sesi
            yang disimpan pada cookie <em>httpOnly</em>, pembatasan laju permintaan,
            serta validasi berkas yang diunggah. Meski demikian, tidak ada sistem
            yang sepenuhnya bebas risiko, dan kami tidak dapat menjamin keamanan
            mutlak atas data yang dikirimkan melalui internet.
          </p>

          <h2>6. Retensi Data</h2>
          <p>
            Kode OTP, token pengaturan ulang kata sandi, dan sesi masuk memiliki
            masa berlaku terbatas dan terhapus otomatis setelah kedaluwarsa. Data
            akun dan laporan disimpan selama diperlukan untuk tujuan layanan, atau
            hingga Anda mengajukan permintaan penghapusan. Data laporan yang telah
            dipublikasikan dapat tetap tersimpan sebagai catatan komunitas
            sepanjang masih relevan untuk kepentingan pencegahan penipuan.
          </p>

          <h2>7. Hak Anda</h2>
          <p>
            Anda berhak mengakses dan memperbarui data akun Anda melalui halaman
            dasbor. Anda juga dapat meminta penghapusan akun beserta data pribadi
            Anda, atau mengajukan keberatan atas suatu laporan, dengan menghubungi
            kami melalui halaman Kontak. Kami akan menindaklanjuti permintaan yang
            sah dalam waktu yang wajar.
          </p>

          <h2>8. Cookie dan Penyimpanan Lokal</h2>
          <p>
            Kami menggunakan cookie yang bersifat teknis dan diperlukan, yaitu
            cookie sesi untuk menjaga status masuk Anda dan cookie sementara untuk
            mengamankan proses masuk melalui Google. Perlindungan anti-bot
            Cloudflare Turnstile dapat menyetel cookie-nya sendiri. Peramban Anda
            juga menyimpan data ringan secara lokal (misalnya penghitung waktu
            tunggu setelah beberapa kali gagal masuk) yang tidak pernah dikirimkan
            ke server kami. Kami tidak menggunakan cookie untuk iklan atau
            pelacakan lintas situs.
          </p>

          <h2>9. Privasi Anak</h2>
          <p>
            Layanan ini ditujukan untuk pengguna berusia 17 tahun ke atas. Kami
            tidak dengan sengaja mengumpulkan data dari anak di bawah umur tersebut.
          </p>

          <h2>10. Perubahan Kebijakan</h2>
          <p>
            Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu.
            Tanggal &ldquo;terakhir diperbarui&rdquo; di atas akan mencerminkan
            revisi terbaru. Perubahan yang bersifat material akan kami informasikan
            melalui email atau pemberitahuan di platform.
          </p>

          <h2>11. Hubungi Kami</h2>
          <p>
            Pertanyaan atau permintaan terkait privasi dapat dikirimkan ke
            <a href="mailto:kawaltransaksi@gmail.com"> kawaltransaksi@gmail.com</a>
            {' '}atau melalui halaman Kontak.
          </p>
        </div>
      </div>
    </div>
  );
}
