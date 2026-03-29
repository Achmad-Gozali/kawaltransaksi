// ============================================
// 📁 LOKASI: app/syarat-ketentuan/page.tsx
// 📝 BARU — bikin folder syarat-ketentuan di dalam app/
// ============================================

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan - CekNoScam',
  description: 'Syarat dan ketentuan penggunaan platform CekNoScam.',
};

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight mb-2">Syarat & Ketentuan</h1>
        <p className="text-sm text-zinc-400 mb-10">Terakhir diperbarui: 29 Maret 2026</p>

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-10 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">1. Penerimaan Ketentuan</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Dengan mengakses dan menggunakan platform CekNoScam, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak menyetujui salah satu ketentuan, harap tidak menggunakan layanan kami.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">2. Deskripsi Layanan</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">CekNoScam menyediakan platform bagi komunitas untuk mengecek dan melaporkan nomor telepon atau rekening bank yang terindikasi penipuan. Kami berfungsi sebagai penyedia informasi berdasarkan laporan pengguna dan tidak bertanggung jawab atas keakuratan absolut dari setiap laporan.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">3. Akun Pengguna</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Untuk membuat laporan, Anda wajib mendaftar akun dengan email yang valid. Anda bertanggung jawab untuk menjaga kerahasiaan akun dan password Anda. Setiap aktivitas yang dilakukan melalui akun Anda menjadi tanggung jawab Anda sepenuhnya.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">4. Ketentuan Pelaporan</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Dengan membuat laporan di CekNoScam, Anda menyatakan bahwa:</p>
              <p className="pl-4">a. Informasi yang Anda berikan adalah benar dan akurat sesuai pengalaman Anda.</p>
              <p className="pl-4">b. Anda memiliki bukti yang mendukung laporan tersebut.</p>
              <p className="pl-4">c. Laporan tidak dibuat dengan niat untuk memfitnah atau mencemarkan nama baik seseorang.</p>
              <p className="pl-4">d. Anda bersedia bertanggung jawab secara hukum atas isi laporan yang Anda buat.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">5. Larangan</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Pengguna dilarang untuk:</p>
              <p className="pl-4">a. Membuat laporan palsu atau menyesatkan.</p>
              <p className="pl-4">b. Menggunakan platform untuk pencemaran nama baik.</p>
              <p className="pl-4">c. Melakukan spam atau penyalahgunaan fitur laporan.</p>
              <p className="pl-4">d. Mencoba meretas atau mengganggu sistem platform.</p>
              <p className="pl-4">e. Menggunakan bot atau otomasi untuk mengakses layanan.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">6. Moderasi Konten</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">CekNoScam berhak untuk meninjau, mengedit, atau menghapus laporan yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya. Kami juga berhak memblokir akun pengguna yang melakukan pelanggaran berulang.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">7. Batasan Tanggung Jawab</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">CekNoScam menyediakan informasi berdasarkan laporan komunitas dan analisis AI. Kami tidak menjamin keakuratan 100% dari setiap data yang ditampilkan. Keputusan yang Anda ambil berdasarkan informasi di platform ini sepenuhnya menjadi tanggung jawab Anda.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">8. Hukum yang Berlaku</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan melalui musyawarah terlebih dahulu, dan jika tidak tercapai kesepakatan, akan diselesaikan melalui pengadilan yang berwenang di Indonesia.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">9. Perubahan Ketentuan</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diumumkan melalui platform dan berlaku efektif sejak tanggal publikasi. Penggunaan berkelanjutan atas layanan kami dianggap sebagai persetujuan terhadap perubahan tersebut.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">10. Kontak</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami melalui halaman <Link href="/kontak" className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2">Kontak</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}