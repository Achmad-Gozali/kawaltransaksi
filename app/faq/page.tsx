// ============================================
// 📁 LOKASI: app/faq/page.tsx
// 📝 BARU — bikin folder faq di dalam app/
// ============================================

import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - CekNoScam',
  description: 'Pertanyaan yang sering diajukan tentang CekNoScam, platform anti-penipuan komunitas.',
};

const faqs = [
  {
    q: 'Apa itu CekNoScam?',
    a: 'CekNoScam adalah platform komunitas yang memungkinkan siapa saja untuk mengecek dan melaporkan nomor telepon atau rekening bank yang terindikasi penipuan. Database kami dibangun dan diverifikasi oleh komunitas pengguna.',
  },
  {
    q: 'Apakah CekNoScam gratis?',
    a: 'Ya, sepenuhnya gratis. Siapa saja bisa mengecek nomor tanpa perlu daftar akun. Untuk membuat laporan, Anda perlu mendaftar akun terlebih dahulu.',
  },
  {
    q: 'Bagaimana cara melaporkan nomor penipu?',
    a: 'Daftar akun atau login, lalu klik "Laporkan" di menu navigasi. Isi formulir dengan nomor target, kategori penipuan, kronologi kejadian, dan lampirkan bukti jika ada. Laporan Anda akan diproses oleh sistem AI dan tim moderator.',
  },
  {
    q: 'Bagaimana proses verifikasi laporan?',
    a: 'Setiap laporan yang masuk dianalisis oleh AI kami untuk mendeteksi pola penipuan. Jika AI yakin laporan valid (risk level tinggi + kronologi detail), laporan akan otomatis diverifikasi. Jika tidak, laporan akan ditinjau manual oleh tim moderator dalam 1x24 jam.',
  },
  {
    q: 'Apakah identitas pelapor dijaga kerahasiaannya?',
    a: 'Ya. Identitas pelapor (email, nama) tidak pernah ditampilkan di halaman publik. Yang ditampilkan hanya kronologi, kategori, dan status laporan.',
  },
  {
    q: 'Apa yang terjadi jika seseorang membuat laporan palsu?',
    a: 'Laporan palsu atau pencemaran nama baik merupakan pelanggaran serius. Akun pelaku akan diblokir permanen, dan dapat dikenakan konsekuensi hukum sesuai UU ITE yang berlaku di Indonesia.',
  },
  {
    q: 'Bagaimana cara kerja fitur AI Analysis?',
    a: 'Fitur AI kami menggunakan teknologi Groq untuk menganalisis dua hal: (1) Kronologi — AI mendeteksi pola penipuan dari cerita Anda dan menentukan tingkat risiko. (2) Bukti screenshot — AI memindai keaslian gambar dan mengidentifikasi red flags.',
  },
  {
    q: 'Apakah data di CekNoScam akurat?',
    a: 'Data kami berasal dari laporan komunitas yang telah melalui proses verifikasi (AI + manual). Meskipun kami berusaha menjaga akurasi, kami menyarankan pengguna untuk tetap melakukan verifikasi mandiri sebelum mengambil keputusan.',
  },
  {
    q: 'Saya korban penipuan, apa yang harus dilakukan?',
    a: 'Segera laporkan ke pihak kepolisian (buat laporan polisi), hubungi bank Anda untuk memblokir transaksi, dan laporkan nomor penipu di CekNoScam agar orang lain tidak menjadi korban yang sama.',
  },
  {
    q: 'Bagaimana cara menghapus laporan yang salah?',
    a: 'Jika Anda adalah pelapor dan laporan masih berstatus "pending", Anda bisa menghubungi kami melalui halaman Kontak untuk meminta penghapusan. Laporan yang sudah diverifikasi hanya bisa dihapus oleh tim moderator setelah review.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            <HelpCircle className="w-3 h-3" />
            FAQ
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">Pertanyaan Umum</h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">Jawaban untuk pertanyaan yang paling sering diajukan tentang CekNoScam.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-md hover:border-zinc-300 transition-all">
              <h3 className="text-base font-bold text-zinc-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-sm text-zinc-400 mb-4">Masih ada pertanyaan?</p>
          <Link href="/kontak" className="inline-flex px-6 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all active:scale-95">
            Hubungi Kami
          </Link>
        </div>
      </div>
    </div>
  );
}