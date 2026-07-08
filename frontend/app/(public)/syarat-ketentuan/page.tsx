import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — KawalTransaksi',
};

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Syarat & Ketentuan</h1>
          <p className="text-slate-500 text-sm">Terakhir diperbarui: Juli 2026</p>
        </div>

        <div className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed">
          <h2>1. Penerimaan Ketentuan</h2>
          <p>Dengan mengakses dan menggunakan KawalTransaksi, Anda menyetujui syarat dan ketentuan ini. Jika tidak setuju, harap hentikan penggunaan layanan kami.</p>

          <h2>2. Deskripsi Layanan</h2>
          <p>KawalTransaksi adalah platform verifikasi berbasis komunitas yang membantu pengguna mengidentifikasi potensi penipuan dalam transaksi online. Kami tidak menjamin keakuratan 100% dari seluruh data yang tersedia.</p>

          <h2>3. Kewajiban Pengguna</h2>
          <p>Pengguna wajib memberikan informasi yang akurat dan jujur saat melaporkan. Laporan palsu, fitnah, atau yang bertujuan merugikan pihak lain secara tidak sah merupakan pelanggaran serius dan dapat dikenakan sanksi hukum.</p>
          <p>Pengguna dilarang menggunakan platform ini untuk tujuan yang melanggar hukum, menyebarkan informasi menyesatkan, atau melakukan tindakan yang merugikan pengguna lain.</p>

          <h2>4. Konten yang Dilaporkan</h2>
          <p>Dengan mengirimkan laporan, Anda memberikan KawalTransaksi hak untuk mempublikasikan, memverifikasi, dan mengelola informasi tersebut demi kepentingan komunitas. Anda bertanggung jawab penuh atas keakuratan laporan yang Anda kirimkan.</p>

          <h2>5. Batasan Tanggung Jawab</h2>
          <p>KawalTransaksi tidak bertanggung jawab atas kerugian finansial yang terjadi akibat kepercayaan berlebihan pada data di platform ini. Selalu lakukan verifikasi tambahan sebelum melakukan transaksi bernilai besar.</p>

          <h2>6. Moderasi Konten</h2>
          <p>Kami berhak meninjau, mengedit, atau menghapus laporan yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya. Laporan yang diajukan banding akan ditinjau oleh tim moderator dalam 3 hari kerja.</p>

          <h2>7. Penangguhan Akun</h2>
          <p>Kami berhak menangguhkan atau menghapus akun yang terbukti menyalahgunakan platform, mengirimkan laporan palsu berulang kali, atau melanggar ketentuan penggunaan.</p>

          <h2>8. Hukum yang Berlaku</h2>
          <p>Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Segala sengketa akan diselesaikan melalui jalur hukum yang berlaku di Indonesia.</p>

          <h2>9. Perubahan Ketentuan</h2>
          <p>Kami dapat memperbarui syarat dan ketentuan ini sewaktu-waktu. Penggunaan layanan setelah perubahan dianggap sebagai penerimaan atas ketentuan yang baru.</p>
        </div>
      </div>
    </div>
  );
}