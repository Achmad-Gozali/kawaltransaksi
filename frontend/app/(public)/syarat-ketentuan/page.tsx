import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan - KawalTransaksi',
  description: 'Syarat dan ketentuan penggunaan KawalTransaksi, platform komunitas untuk cek rekening penipu, cek nomor penipu, dan pelaporan penipuan online di Indonesia.',
  alternates: { canonical: 'https://kawaltransaksi.com/syarat-ketentuan' },
};

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Syarat &amp; Ketentuan</h1>
          <p className="text-slate-500 text-sm">Terakhir diperbarui: 28 Agustus 2026</p>
        </div>

        <div className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-li:leading-relaxed">
          <p>
            Halaman ini menjelaskan aturan pakai situs kawaltransaksi.com dan
            semua layanannya. Dengan memakai layanan kami, Anda dianggap setuju
            dengan aturan di bawah ini. Kalau Anda tidak setuju, sebaiknya
            berhenti menggunakan layanan ini.
          </p>

          <h2>1. Tentang Layanan</h2>
          <p>
            KawalTransaksi adalah platform berbasis komunitas yang mengumpulkan
            laporan dugaan penipuan, lalu menampilkannya supaya orang lain bisa
            mengecek sebuah nomor telepon, nomor rekening, akun e-wallet, atau
            kode QRIS sebelum bertransaksi. Fitur pengecekan bisa dipakai tanpa
            mendaftar. Untuk mengirim laporan, Anda perlu punya akun yang sudah
            terverifikasi.
          </p>
          <p>
            Data di platform ini berasal dari laporan pengguna dan hasil tinjauan
            tim moderator. Kami <strong>tidak menjamin semua data akurat, lengkap,
            atau selalu terbaru</strong>. Tidak adanya laporan atas sebuah nomor
            juga bukan jaminan bahwa pihak itu aman.
          </p>

          <h2>2. Akun Pengguna</h2>
          <ul>
            <li>Isi data yang benar saat mendaftar, dan jaga kerahasiaan kata sandi akun Anda.</li>
            <li>Semua aktivitas yang terjadi lewat akun Anda menjadi tanggung jawab Anda.</li>
            <li>Layanan ini ditujukan untuk pengguna berusia 17 tahun ke atas.</li>
            <li>Jangan membuat banyak akun untuk menghindari pembatasan atau moderasi.</li>
          </ul>

          <h2>3. Kewajiban Saat Melapor</h2>
          <p>Dengan mengirim laporan, Anda menyatakan bahwa:</p>
          <ul>
            <li>Informasi yang Anda sampaikan benar, Anda yakini kebenarannya berdasarkan pengalaman atau bukti yang Anda punya, dan tidak menyesatkan.</li>
            <li>Bukti yang Anda unggah Anda peroleh secara sah dan tidak melanggar hak orang lain.</li>
            <li>Laporan tidak dibuat dengan niat buruk, untuk memfitnah, memeras, membalas dendam, atau merugikan orang lain secara tidak sah.</li>
            <li>Anda paham bahwa laporan palsu atau fitnah bisa berujung pada tuntutan hukum, dan itu menjadi tanggung jawab Anda sepenuhnya.</li>
          </ul>

          <h2>4. Hak Kami atas Isi Laporan</h2>
          <p>
            Dengan mengirim laporan beserta lampirannya, Anda mengizinkan
            KawalTransaksi untuk menyimpan, meninjau, merapikan seperlunya,
            menampilkan, dan menghapus isi laporan tersebut demi menjalankan
            layanan. Izin ini tidak berbayar dan tidak eksklusif. Tanggung jawab
            atas isi laporan tetap ada pada Anda sebagai pelapor.
          </p>

          <h2>5. Publikasi dan Moderasi</h2>
          <p>
            Setiap laporan ditinjau oleh sistem otomatis dan/atau tim moderator.
            Kami berhak menampilkan, menahan, menyunting, menolak, atau menghapus
            laporan tanpa pemberitahuan lebih dulu, terutama kalau laporan itu
            diduga tidak akurat, melanggar ketentuan ini, atau melanggar hukum.
            Isi laporan yang sudah diverifikasi, dan sebagian data dari laporan
            yang masih diproses, akan ditampilkan ke publik. Identitas pelapor
            tidak pernah ditampilkan ke publik.
          </p>

          <h2>6. Hak Sanggah (Banding)</h2>
          <p>
            Kalau Anda merasa dirugikan oleh sebuah laporan, Anda bisa mengajukan
            banding lewat halaman detail laporan atau menghubungi kami lewat
            halaman Kontak. Tim moderator akan meninjau ulang laporan yang
            disanggah, umumnya paling lama 3 hari kerja, lalu bisa
            mempertahankan, menyunting, atau menghapus laporan itu sesuai hasil
            tinjauan.
          </p>

          <h2>7. Hal yang Dilarang</h2>
          <p>Anda dilarang:</p>
          <ul>
            <li>Memakai layanan ini untuk tujuan yang melanggar hukum atau merugikan orang lain.</li>
            <li>Mengunggah konten yang berisi malware, tautan berbahaya, ujaran kebencian, atau materi yang melanggar hukum.</li>
            <li>Mengakses layanan secara otomatis (scraping, bot) di luar yang diizinkan, atau mencoba membebani, merusak, dan menembus sistem kami.</li>
            <li>Menyalahgunakan data di platform untuk melecehkan, mengintimidasi, atau main hakim sendiri terhadap pihak yang dilaporkan.</li>
          </ul>

          <h2>8. Penangguhan dan Penutupan Akun</h2>
          <p>
            Kami berhak menangguhkan atau menghapus akun yang melanggar ketentuan
            ini, mengirim laporan palsu berulang kali, atau menyalahgunakan
            layanan. Anda juga bisa berhenti memakai layanan kapan saja dan
            meminta akun Anda dihapus lewat halaman Kontak.
          </p>

          <h2>9. Batasan Tanggung Jawab</h2>
          <p>
            Layanan ini disediakan apa adanya. Sejauh diizinkan oleh hukum,
            KawalTransaksi tidak bertanggung jawab atas kerugian atau kerusakan
            yang muncul karena penggunaan atau tidak berfungsinya layanan,
            termasuk kerugian akibat keputusan transaksi yang Anda ambil
            berdasarkan data di platform. Data di sini adalah salah satu bahan
            pertimbangan, bukan pengganti kehati-hatian dan pengecekan mandiri
            Anda.
          </p>

          <h2>10. Layanan Pihak Ketiga</h2>
          <p>
            Layanan ini memakai infrastruktur dan layanan pihak ketiga (antara
            lain Cloudflare, Google, dan penyedia email) seperti dijelaskan di
            Kebijakan Privasi. Dengan memakai layanan kami, Anda juga tunduk pada
            ketentuan pihak ketiga tersebut sejauh relevan.
          </p>

          <h2>11. Perubahan Ketentuan</h2>
          <p>
            Kami bisa memperbarui Syarat &amp; Ketentuan ini sewaktu-waktu.
            Tanggal &ldquo;terakhir diperbarui&rdquo; di atas akan menunjukkan
            versi terbaru. Kalau Anda tetap memakai layanan setelah perubahan
            berlaku, Anda dianggap setuju dengan ketentuan yang baru.
          </p>

          <h2>12. Hukum yang Berlaku</h2>
          <p>
            Syarat &amp; Ketentuan ini tunduk pada hukum Republik Indonesia.
            Kalau ada perselisihan, kami akan mengupayakan penyelesaian secara
            musyawarah lebih dulu. Kalau tidak tercapai, penyelesaian ditempuh
            lewat jalur hukum yang berlaku di Indonesia.
          </p>

          <h2>13. Hubungi Kami</h2>
          <p>
            Pertanyaan soal Syarat &amp; Ketentuan ini bisa dikirim ke
            <a href="mailto:kawaltransaksi@gmail.com"> kawaltransaksi@gmail.com</a>
            {' '}atau lewat halaman Kontak.
          </p>
        </div>
      </div>
    </div>
  );
}
