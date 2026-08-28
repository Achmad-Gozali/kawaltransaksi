import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - KawalTransaksi',
  description: 'Kebijakan privasi KawalTransaksi: bagaimana kami mengumpulkan, memakai, dan melindungi data Anda saat menggunakan layanan cek rekening dan nomor penipu.',
  alternates: { canonical: 'https://kawaltransaksi.com/kebijakan-privasi' },
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
            Halaman ini menjelaskan data apa saja yang kami kumpulkan, untuk apa
            data itu dipakai, di mana disimpan, dan kapan dibagikan, saat Anda
            memakai situs kawaltransaksi.com dan layanannya. Dengan memakai
            layanan kami, Anda dianggap sudah membaca dan memahami kebijakan ini.
          </p>

          <h2>1. Data yang Kami Kumpulkan</h2>

          <h3>a. Data yang Anda isi saat membuat akun</h3>
          <p>
            Saat mendaftar, kami mengumpulkan <strong>nama</strong> dan
            <strong> alamat email</strong> Anda. Kalau Anda mendaftar dengan kata
            sandi, kata sandi itu tidak pernah kami simpan dalam bentuk aslinya.
            Yang kami simpan hanya versi teracak (hash dengan algoritma Argon2)
            yang tidak bisa dikembalikan menjadi kata sandi asli. Kalau Anda
            mendaftar atau masuk lewat akun Google, kami menerima nama dan email
            dari profil Google Anda. Untuk memastikan email itu benar milik Anda,
            kami mengirim kode OTP ke email tersebut.
          </p>

          <h3>b. Data yang Anda isi saat membuat laporan</h3>
          <p>Formulir laporan bisa memuat data berikut, sesuai yang Anda isi:</p>
          <ul>
            <li>Data pihak yang dilaporkan: nomor telepon, nomor rekening dan nama bank, akun e-wallet, atau data merchant QRIS (NMID, nama, dan kota merchant yang terbaca otomatis dari kode QR).</li>
            <li>Nama atau identitas terduga pelaku, dugaan lokasi, nama toko atau lapak, serta akun media sosial dan tautan terkait.</li>
            <li>Kronologi kejadian, kategori penipuan, tempat kejadian, tanggal kejadian, dan perkiraan nilai kerugian.</li>
            <li>Informasi apakah ada korban lain dan pihak lain yang sudah menerima laporan serupa.</li>
            <li>File bukti yang Anda unggah, misalnya tangkapan layar, bukti transfer, foto kode QRIS, dan foto terduga pelaku kalau Anda sertakan.</li>
          </ul>
          <p>
            Perlu diketahui, isi laporan pada dasarnya adalah data tentang
            <strong> orang atau usaha lain</strong> yang Anda duga menipu. Anda
            bertanggung jawab untuk hanya mengirim data yang benar, relevan, dan
            Anda peroleh secara sah.
          </p>

          <h3>c. Data yang terkumpul otomatis</h3>
          <p>
            Server kami mencatat <strong>alamat IP</strong>, jenis peramban, serta
            waktu dan alamat halaman yang Anda buka, di dalam log teknis. Data ini
            dipakai untuk keamanan, membatasi permintaan yang berlebihan, dan
            menelusuri masalah. Kami tidak memakai layanan analitik pihak ketiga
            yang melacak perilaku Anda antar situs.
          </p>

          <h2>2. Untuk Apa Data Dipakai</h2>
          <ul>
            <li>Menjalankan dan memelihara layanan pengecekan dan pelaporan.</li>
            <li>Memverifikasi akun Anda dan menjaga sesi masuk tetap aktif.</li>
            <li>Meninjau dan memoderasi laporan, sebelum maupun sesudah tampil ke publik.</li>
            <li>Mengirim email penting terkait akun dan laporan Anda (kode verifikasi, tautan atur ulang kata sandi, dan pemberitahuan terkait).</li>
            <li>Mencegah penyalahgunaan, spam, aktivitas bot, dan upaya peretasan terhadap platform.</li>
          </ul>

          <h2>3. Data Laporan yang Ditampilkan ke Publik</h2>
          <p>
            Isi laporan yang sudah <strong>diverifikasi</strong>, dan sebagian
            data dari laporan yang <strong>masih diproses</strong>, akan tampil ke
            publik. Data yang bisa tampil antara lain: data pihak yang dilaporkan,
            kategori, kronologi, perkiraan kerugian, file bukti, foto terduga
            pelaku, akun media sosial, dan tautan terkait.
          </p>
          <p>
            <strong>Identitas pelapor tidak pernah ditampilkan ke publik.</strong>
            {' '}Nama dan email pelapor hanya bisa dilihat oleh tim moderator
            internal untuk keperluan verifikasi dan menangani penyalahgunaan.
            Pihak yang merasa datanya dilaporkan secara keliru bisa mengajukan
            banding lewat halaman detail laporan.
          </p>

          <h2>4. Penyimpanan Data dan Layanan Pihak Ketiga</h2>
          <p>
            Data akun dan laporan disimpan di basis data pada server yang kami
            kelola. File bukti dan gambar disimpan di layanan penyimpanan
            Cloudflare R2 dan disajikan lewat jaringan Cloudflare. Untuk
            menjalankan layanan, kami memakai beberapa penyedia pihak ketiga
            berikut untuk mengolah data:
          </p>
          <ul>
            <li><strong>Cloudflare</strong>: jaringan pengiriman konten, penyimpanan file (R2), dan perlindungan anti-bot (Turnstile) di halaman daftar, masuk, dan lapor.</li>
            <li><strong>Google</strong>: kalau Anda memilih masuk dengan akun Google.</li>
            <li><strong>Penyedia layanan email</strong>: untuk mengirim email dari sistem.</li>
            <li><strong>Have I Been Pwned</strong>: untuk mengecek apakah kata sandi Anda pernah bocor. Yang dikirim ke layanan ini hanya 5 karakter pertama dari hash kata sandi, jadi kata sandi Anda tidak bisa disusun ulang oleh siapa pun.</li>
          </ul>
          <p>
            Kami tidak menjual atau menyewakan data pribadi Anda. Data hanya
            dibagikan ke pihak lain kalau diwajibkan oleh hukum, perintah
            pengadilan, atau permintaan resmi dari aparat penegak hukum, atau
            kalau memang perlu untuk melindungi keselamatan dan hak pengguna lain.
          </p>

          <h2>5. Keamanan</h2>
          <p>
            Kami menerapkan beberapa langkah pengamanan, antara lain koneksi
            terenkripsi (HTTPS), penyimpanan kata sandi dalam bentuk hash, token
            sesi yang disimpan di cookie <em>httpOnly</em>, pembatasan jumlah
            permintaan, dan pemeriksaan file yang diunggah. Meski begitu, tidak
            ada sistem yang sepenuhnya bebas risiko, jadi kami tidak bisa menjamin
            keamanan yang mutlak atas data yang dikirim lewat internet.
          </p>

          <h2>6. Berapa Lama Data Disimpan</h2>
          <p>
            Kode OTP, token atur ulang kata sandi, dan sesi masuk punya masa
            berlaku singkat dan terhapus otomatis setelah kedaluwarsa. Data akun
            dan laporan disimpan selama masih dibutuhkan untuk layanan, atau
            sampai Anda meminta penghapusan. Laporan yang sudah tampil ke publik
            bisa tetap tersimpan sebagai catatan komunitas selama masih relevan
            untuk mencegah penipuan.
          </p>

          <h2>7. Hak Anda</h2>
          <p>
            Anda bisa melihat dan memperbarui data akun Anda lewat halaman dasbor.
            Anda juga bisa meminta akun beserta data pribadi Anda dihapus, atau
            mengajukan keberatan atas sebuah laporan, dengan menghubungi kami
            lewat halaman Kontak. Kami akan menindaklanjuti permintaan yang sah
            dalam waktu yang wajar.
          </p>

          <h2>8. Cookie dan Penyimpanan di Peramban</h2>
          <p>
            Kami hanya memakai cookie yang bersifat teknis dan memang diperlukan,
            yaitu cookie sesi untuk menjaga Anda tetap masuk, dan cookie sementara
            untuk mengamankan proses masuk lewat Google. Perlindungan anti-bot
            Cloudflare Turnstile juga bisa menyetel cookie-nya sendiri. Selain
            itu, peramban Anda menyimpan data ringan secara lokal (misalnya
            penghitung waktu tunggu setelah beberapa kali gagal masuk) yang tidak
            pernah dikirim ke server kami. Kami tidak memakai cookie untuk iklan
            atau pelacakan lintas situs.
          </p>

          <h2>9. Privasi Anak</h2>
          <p>
            Layanan ini ditujukan untuk pengguna berusia 17 tahun ke atas. Kami
            tidak dengan sengaja mengumpulkan data dari anak di bawah usia
            tersebut.
          </p>

          <h2>10. Perubahan Kebijakan</h2>
          <p>
            Kami bisa memperbarui Kebijakan Privasi ini sewaktu-waktu. Tanggal
            &ldquo;terakhir diperbarui&rdquo; di atas menunjukkan versi terbaru.
            Kalau ada perubahan yang cukup besar, kami akan memberi tahu lewat
            email atau pemberitahuan di platform.
          </p>

          <h2>11. Hubungi Kami</h2>
          <p>
            Pertanyaan atau permintaan soal privasi bisa dikirim ke
            <a href="mailto:kawaltransaksi@gmail.com"> kawaltransaksi@gmail.com</a>
            {' '}atau lewat halaman Kontak.
          </p>
        </div>
      </div>
    </div>
  );
}
