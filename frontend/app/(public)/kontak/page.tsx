import Link from 'next/link';
import { ArrowLeft, MapPin, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontak - KawalTransaksi',
  description: 'Hubungi tim KawalTransaksi untuk pertanyaan, saran, atau laporan masalah.',
};

export default function KontakPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white sm:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">
            Hubungi Kami
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Punya pertanyaan, saran, atau menemukan masalah? Tim kami siap membantu.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-14">

          {/* Email */}
          <a
            href="https://mail.google.com/mail/?view=cm&to=kawaltransaksi@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer group block"
          >
            <div className="w-10 h-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center mb-4 shadow-sm">
              {/* Gmail logo asli */}
              <svg className="w-6 h-6" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4CAF50" d="M45 16.2l-5 2.75-5 4.75L35 40h7c1.657 0 3-1.343 3-3V16.2z"/>
                <path fill="#1E88E5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z"/>
                <polygon fill="#E53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
                <path fill="#C62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C9.132 8.301 8.228 8 7.298 8 4.924 8 3 9.924 3 12.298z"/>
                <path fill="#FBC02D" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C38.868 8.301 39.772 8 40.702 8 43.076 8 45 9.924 45 12.298z"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">Email</h3>
            <p className="text-sm text-zinc-400 mb-3">Untuk pertanyaan umum dan bantuan teknis.</p>
            <span className="text-sm font-bold text-zinc-900 group-hover:text-red-600 transition-colors">
              kawaltransaksi@gmail.com
            </span>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/6282249244647"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer group block"
          >
            <div className="w-10 h-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center mb-4 shadow-sm">
              {/* WhatsApp logo asli */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">WhatsApp</h3>
            <p className="text-sm text-zinc-400 mb-3">Respon cepat di jam kerja.</p>
            <span className="text-sm font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">
              +62 822-4924-4647
            </span>
          </a>

          {/* Jam Operasional */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">Jam Operasional</h3>
            <p className="text-sm text-zinc-400 mb-3">Tim support kami aktif setiap hari.</p>
            <p className="text-sm font-bold text-zinc-900">Senin - Jumat, 09:00 - 17:00 WIB</p>
          </div>

          {/* Lokasi */}
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
            Jika Anda menemukan laporan palsu, penyalahgunaan platform, atau konten yang tidak pantas,
            silakan hubungi kami segera melalui email di atas dengan subjek &quot;ABUSE REPORT&quot;.
          </p>
          <a
            href="https://mail.google.com/mail/?view=cm&to=kawaltransaksi@gmail.com&su=ABUSE%20REPORT"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex px-6 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all active:scale-95"
          >
            Laporkan Penyalahgunaan
          </a>
        </div>
      </div>
    </div>
  );
}