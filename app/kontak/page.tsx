// ============================================
// 📁 LOKASI: app/kontak/page.tsx
// 📝 BARU — bikin folder kontak di dalam app/
// ============================================

import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, MapPin, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontak - CekNoScam',
  description: 'Hubungi tim CekNoScam untuk pertanyaan, saran, atau laporan masalah.',
};

export default function KontakPage() {
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
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">Hubungi Kami</h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">Punya pertanyaan, saran, atau menemukan masalah? Tim kami siap membantu.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">Email</h3>
            <p className="text-sm text-zinc-400 mb-3">Untuk pertanyaan umum dan bantuan teknis.</p>
            <a href="mailto:support@ceknoscam.id" className="text-sm font-bold text-zinc-900 hover:text-red-600 transition-colors">
              support@ceknoscam.id
            </a>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">WhatsApp</h3>
            <p className="text-sm text-zinc-400 mb-3">Respon cepat di jam kerja.</p>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-zinc-900 hover:text-red-600 transition-colors">
              +62 812-3456-7890
            </a>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">Jam Operasional</h3>
            <p className="text-sm text-zinc-400 mb-3">Tim support kami aktif setiap hari.</p>
            <p className="text-sm font-bold text-zinc-900">Senin - Jumat, 09:00 - 17:00 WIB</p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">Lokasi</h3>
            <p className="text-sm text-zinc-400 mb-3">Kantor pusat kami.</p>
            <p className="text-sm font-bold text-zinc-900">Jakarta, Indonesia</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-bold text-zinc-900 mb-2">Laporkan Penyalahgunaan</h3>
          <p className="text-sm text-zinc-500 max-w-lg mx-auto mb-5 leading-relaxed">
            Jika Anda menemukan laporan palsu, penyalahgunaan platform, atau konten yang tidak pantas, silakan hubungi kami segera melalui email di atas dengan subjek "ABUSE REPORT".
          </p>
          <a href="mailto:support@ceknoscam.id?subject=ABUSE%20REPORT" className="inline-flex px-6 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all active:scale-95">
            Laporkan Penyalahgunaan
          </a>
        </div>
      </div>
    </div>
  );
}