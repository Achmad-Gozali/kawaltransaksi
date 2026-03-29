// ============================================
// 📁 LOKASI: app/kebijakan-privasi/page.tsx
// 📝 BARU — bikin folder kebijakan-privasi di dalam app/
// ============================================

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - CekNoScam',
  description: 'Kebijakan privasi platform CekNoScam mengenai pengumpulan dan perlindungan data pengguna.',
};

export default function KebijakanPrivasiPage() {
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
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight mb-2">Kebijakan Privasi</h1>
        <p className="text-sm text-zinc-400 mb-10">Terakhir diperbarui: 29 Maret 2026</p>

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-10 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">1. Informasi yang Kami Kumpulkan</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Kami mengumpulkan informasi berikut saat Anda menggunakan CekNoScam:</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">Data Akun:</span> Email dan nama lengkap saat pendaftaran.</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">Data Laporan:</span> Nomor target, kronologi, kategori, dan bukti yang Anda upload.</p>
              <p className="pl-4"><span className="font-semibold text-zinc-700">Data Teknis:</span> Alamat IP, jenis browser, dan informasi perangkat untuk keamanan platform.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">2. Penggunaan Informasi</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Informasi yang kami kumpulkan digunakan untuk:</p>
              <p className="pl-4">a. Memproses dan menampilkan laporan penipuan di database publik.</p>
              <p className="pl-4">b. Memverifikasi identitas pelapor untuk mencegah penyalahgunaan.</p>
              <p className="pl-4">c. Menganalisis laporan menggunakan teknologi AI untuk deteksi penipuan.</p>
              <p className="pl-4">d. Meningkatkan kualitas dan keamanan platform.</p>
              <p className="pl-4">e. Menghubungi Anda terkait akun atau laporan Anda jika diperlukan.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">3. Perlindungan Data Pelapor</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Kami berkomitmen melindungi privasi pelapor:</p>
              <p className="pl-4">a. <span className="font-semibold text-zinc-700">Email dan identitas pelapor tidak pernah ditampilkan</span> di halaman publik.</p>
              <p className="pl-4">b. Data pelapor disimpan secara terenkripsi di server yang aman.</p>
              <p className="pl-4">c. Hanya tim moderator yang memiliki akses ke identitas pelapor untuk keperluan verifikasi.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">4. Penyimpanan Data</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Data Anda disimpan di server Supabase yang berlokasi di data center dengan standar keamanan tinggi. Bukti screenshot yang di-upload disimpan di cloud storage terenkripsi. Kami menyimpan data selama akun Anda aktif atau selama diperlukan untuk tujuan platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">5. Pembagian Data ke Pihak Ketiga</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Kami <span className="font-semibold text-zinc-700">tidak menjual</span> data pribadi Anda. Data hanya dibagikan dalam kondisi berikut:</p>
              <p className="pl-4">a. Kronologi dan bukti laporan ditampilkan secara publik (tanpa identitas pelapor).</p>
              <p className="pl-4">b. Jika diwajibkan oleh hukum atau perintah pengadilan.</p>
              <p className="pl-4">c. Untuk analisis AI melalui layanan Groq (hanya konten laporan, bukan data pribadi).</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">6. Hak Pengguna</h2>
            <div className="text-sm text-zinc-500 leading-relaxed space-y-2">
              <p>Anda memiliki hak untuk:</p>
              <p className="pl-4">a. Mengakses data pribadi yang kami simpan tentang Anda.</p>
              <p className="pl-4">b. Meminta koreksi data yang tidak akurat.</p>
              <p className="pl-4">c. Meminta penghapusan akun dan data terkait.</p>
              <p className="pl-4">d. Menarik persetujuan atas penggunaan data Anda.</p>
              <p>Untuk menggunakan hak-hak ini, hubungi kami melalui halaman <Link href="/kontak" className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2">Kontak</Link>.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">7. Cookies</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Kami menggunakan cookies yang diperlukan untuk autentikasi dan sesi pengguna. Kami tidak menggunakan cookies untuk pelacakan iklan atau analitik pihak ketiga.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">8. Keamanan</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang wajar untuk melindungi data Anda, termasuk enkripsi, Row Level Security di database, dan autentikasi yang aman. Namun, tidak ada sistem yang 100% aman, dan kami tidak dapat menjamin keamanan absolut.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">9. Perubahan Kebijakan</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan signifikan akan diumumkan melalui platform. Tanggal pembaruan terakhir tercantum di bagian atas halaman ini.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">10. Kontak</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Untuk pertanyaan tentang kebijakan privasi ini, hubungi kami di <a href="mailto:support@ceknoscam.id" className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2">support@ceknoscam.id</a> atau melalui halaman <Link href="/kontak" className="font-semibold text-zinc-900 hover:text-red-600 transition-colors underline underline-offset-2">Kontak</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}