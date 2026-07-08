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
          <p className="text-slate-500 text-sm">Terakhir diperbarui: Juli 2026</p>
        </div>

        <div className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed">
          <h2>1. Informasi yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar, melaporkan penipuan, atau menghubungi kami. Informasi ini meliputi nama, alamat email, dan data yang Anda masukkan dalam formulir laporan.</p>
          <p>Kami juga mengumpulkan data penggunaan secara otomatis seperti alamat IP, jenis browser, dan halaman yang dikunjungi untuk keperluan keamanan dan peningkatan layanan.</p>

          <h2>2. Cara Kami Menggunakan Informasi</h2>
          <p>Informasi yang kami kumpulkan digunakan untuk menyediakan dan meningkatkan layanan KawalTransaksi, memverifikasi laporan yang masuk, mengirimkan notifikasi terkait laporan Anda, serta mencegah penyalahgunaan platform.</p>

          <h2>3. Penyimpanan dan Keamanan Data</h2>
          <p>Data Anda disimpan di server yang berlokasi di Indonesia. Kami menerapkan enkripsi dan langkah-langkah keamanan industri standar untuk melindungi data Anda dari akses tidak sah.</p>

          <h2>4. Berbagi Data dengan Pihak Ketiga</h2>
          <p>Kami tidak menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran. Data hanya dibagikan jika diwajibkan oleh hukum atau untuk melindungi keselamatan pengguna.</p>

          <h2>5. Data Laporan yang Dipublikasikan</h2>
          <p>Informasi target laporan (nomor HP, rekening, e-wallet) yang telah diverifikasi akan ditampilkan secara publik. Identitas pelapor tidak pernah dipublikasikan. Anda dapat mengajukan banding jika merasa data Anda dilaporkan secara keliru.</p>

          <h2>6. Cookie</h2>
          <p>Kami menggunakan cookie sesi untuk menjaga status login Anda. Kami tidak menggunakan cookie untuk pelacakan iklan.</p>

          <h2>7. Hak Anda</h2>
          <p>Anda berhak mengakses, memperbarui, atau menghapus data pribadi Anda. Untuk permintaan penghapusan data, hubungi kami melalui halaman Kontak.</p>

          <h2>8. Perubahan Kebijakan</h2>
          <p>Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan signifikan akan diinformasikan melalui email atau notifikasi di platform.</p>

          <h2>9. Hubungi Kami</h2>
          <p>Pertanyaan seputar privasi dapat dikirimkan ke <a href="mailto:kawaltransaksi@gmail.com">kawaltransaksi@gmail.com</a>.</p>
        </div>
      </div>
    </div>
  );
}