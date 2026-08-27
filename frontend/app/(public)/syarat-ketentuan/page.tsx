import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — KawalTransaksi',
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
            Syarat dan Ketentuan ini mengatur penggunaan situs kawaltransaksi.com
            beserta seluruh layanannya (&ldquo;Layanan&rdquo;). Dengan mengakses
            atau menggunakan Layanan, Anda menyatakan setuju untuk terikat pada
            ketentuan di bawah ini. Apabila Anda tidak menyetujuinya, mohon
            hentikan penggunaan Layanan.
          </p>

          <h2>1. Deskripsi Layanan</h2>
          <p>
            KawalTransaksi adalah platform berbasis komunitas yang menghimpun
            laporan dugaan penipuan dan menampilkannya agar pengguna dapat
            memeriksa nomor telepon, nomor rekening, akun e-wallet, atau kode QRIS
            sebelum bertransaksi. Layanan pemeriksaan dapat digunakan tanpa
            mendaftar, sedangkan pengiriman laporan mensyaratkan akun terverifikasi.
          </p>
          <p>
            Data pada platform bersumber dari laporan pengguna dan tinjauan
            moderator. Kami <strong>tidak menjamin keakuratan, kelengkapan, atau
            kemutakhiran</strong> seluruh data. Tidak adanya laporan atas suatu
            nomor bukan merupakan jaminan bahwa pihak tersebut aman.
          </p>

          <h2>2. Akun Pengguna</h2>
          <ul>
            <li>Anda wajib memberikan data yang benar saat mendaftar dan menjaga kerahasiaan kredensial akun Anda;</li>
            <li>Anda bertanggung jawab atas seluruh aktivitas yang terjadi melalui akun Anda;</li>
            <li>Layanan ditujukan untuk pengguna berusia 17 tahun ke atas;</li>
            <li>Satu orang tidak diperkenankan membuat banyak akun untuk tujuan menghindari pembatasan atau moderasi.</li>
          </ul>

          <h2>3. Kewajiban Pelapor</h2>
          <p>Dengan mengirimkan laporan, Anda menyatakan dan menjamin bahwa:</p>
          <ul>
            <li>Informasi yang Anda sampaikan benar, Anda yakini kebenarannya berdasarkan pengalaman atau bukti yang Anda miliki, dan tidak menyesatkan;</li>
            <li>Bukti yang Anda unggah Anda peroleh secara sah dan tidak melanggar hak pihak lain;</li>
            <li>Laporan tidak diajukan dengan itikad buruk, untuk memfitnah, memeras, membalas dendam, atau merugikan pihak lain secara tidak sah;</li>
            <li>Anda memahami bahwa laporan palsu atau fitnah dapat memiliki konsekuensi hukum berdasarkan peraturan perundang-undangan yang berlaku, dan menjadi tanggung jawab Anda sepenuhnya.</li>
          </ul>

          <h2>4. Lisensi atas Konten Laporan</h2>
          <p>
            Dengan mengirimkan laporan beserta lampirannya, Anda memberikan
            KawalTransaksi lisensi non-eksklusif, bebas royalti, dan berlaku di
            seluruh dunia untuk menyimpan, meninjau, menyunting seperlunya,
            menampilkan, dan menghapus konten tersebut dalam rangka
            menyelenggarakan Layanan. Anda tetap merupakan pihak yang bertanggung
            jawab atas konten yang Anda kirimkan.
          </p>

          <h2>5. Publikasi dan Moderasi</h2>
          <p>
            Setiap laporan ditinjau oleh sistem otomatis dan/atau moderator. Kami
            berhak untuk menampilkan, menahan, menyunting, menolak, atau menghapus
            laporan tanpa pemberitahuan terlebih dahulu, khususnya bila laporan
            diduga tidak akurat, melanggar ketentuan ini, atau melanggar hukum.
            Isi laporan yang telah diverifikasi, serta sebagian informasi dari
            laporan yang masih diproses, akan ditampilkan kepada publik. Identitas
            pelapor tidak ditampilkan kepada publik.
          </p>

          <h2>6. Hak Sanggah (Banding)</h2>
          <p>
            Pihak yang merasa dirugikan oleh sebuah laporan dapat mengajukan
            banding melalui halaman detail laporan atau menghubungi kami melalui
            halaman Kontak. Tim moderator akan meninjau ulang laporan yang
            disanggah dalam waktu yang wajar, umumnya paling lama 3 hari kerja, dan
            dapat mempertahankan, menyunting, atau menghapus laporan tersebut
            berdasarkan hasil tinjauan.
          </p>

          <h2>7. Larangan Penggunaan</h2>
          <p>Anda dilarang:</p>
          <ul>
            <li>Menggunakan Layanan untuk tujuan melanggar hukum atau merugikan orang lain;</li>
            <li>Mengunggah konten yang mengandung malware, tautan berbahaya, ujaran kebencian, atau materi yang melanggar hukum;</li>
            <li>Mengakses Layanan secara otomatis (scraping, bot) di luar yang diizinkan, atau berupaya membebani, merusak, atau menembus sistem kami;</li>
            <li>Menyalahgunakan data yang ditampilkan di platform untuk melakukan pelecehan, intimidasi, atau tindakan main hakim sendiri terhadap pihak yang dilaporkan.</li>
          </ul>

          <h2>8. Penangguhan dan Penghentian Akun</h2>
          <p>
            Kami berhak menangguhkan atau menghapus akun yang melanggar ketentuan
            ini, mengirimkan laporan palsu secara berulang, atau menyalahgunakan
            Layanan. Anda dapat berhenti menggunakan Layanan kapan saja dan meminta
            penghapusan akun melalui halaman Kontak.
          </p>

          <h2>9. Batasan Tanggung Jawab</h2>
          <p>
            Layanan disediakan &ldquo;sebagaimana adanya&rdquo;. Sepanjang
            diizinkan oleh hukum, KawalTransaksi tidak bertanggung jawab atas
            kerugian, kehilangan, atau kerusakan yang timbul dari penggunaan atau
            ketidakmampuan menggunakan Layanan, termasuk kerugian akibat keputusan
            bertransaksi yang Anda ambil berdasarkan data pada platform. Data pada
            platform merupakan salah satu bahan pertimbangan, bukan pengganti
            kehati-hatian dan verifikasi mandiri Anda.
          </p>

          <h2>10. Layanan Pihak Ketiga</h2>
          <p>
            Layanan menggunakan infrastruktur dan layanan pihak ketiga (antara lain
            Cloudflare, Google, dan penyedia email) sebagaimana dijelaskan dalam
            Kebijakan Privasi. Penggunaan Layanan berarti Anda juga tunduk pada
            ketentuan pihak ketiga terkait sepanjang relevan.
          </p>

          <h2>11. Perubahan Ketentuan</h2>
          <p>
            Kami dapat memperbarui Syarat dan Ketentuan ini sewaktu-waktu. Tanggal
            &ldquo;terakhir diperbarui&rdquo; di atas akan diperbarui pada setiap
            revisi. Dengan tetap menggunakan Layanan setelah perubahan berlaku,
            Anda dianggap menyetujui ketentuan yang baru.
          </p>

          <h2>12. Hukum yang Berlaku</h2>
          <p>
            Syarat dan Ketentuan ini tunduk pada hukum Republik Indonesia. Segala
            sengketa yang timbul akan diupayakan diselesaikan secara musyawarah,
            dan apabila tidak tercapai, diselesaikan melalui jalur hukum yang
            berlaku di Indonesia.
          </p>

          <h2>13. Hubungi Kami</h2>
          <p>
            Pertanyaan mengenai Syarat dan Ketentuan ini dapat dikirimkan ke
            <a href="mailto:kawaltransaksi@gmail.com"> kawaltransaksi@gmail.com</a>
            {' '}atau melalui halaman Kontak.
          </p>
        </div>
      </div>
    </div>
  );
}
