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
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 8H4C1.8 8 0 9.8 0 12v24c0 2.2 1.8 4 4 4h40c2.2 0 4-1.8 4-4V12c0-2.2-1.8-4-4-4z" fill="#fff"/>
                <path d="M44 8L24 28 4 8" stroke="#EA4335" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M0 12l16 14M48 12L32 26" stroke="#EA4335" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M4 8h40L24 28 4 8z" fill="#EA4335" fillOpacity="0.15"/>
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
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4C12.95 4 4 12.95 4 24c0 3.6 1 6.97 2.73 9.86L4 44l10.4-2.7A19.93 19.93 0 0024 44c11.05 0 20-8.95 20-20S35.05 4 24 4z" fill="#25D366"/>
                <path d="M34.5 29.1c-.5-.25-2.93-1.44-3.38-1.61-.46-.16-.79-.24-1.12.25-.33.5-1.29 1.61-1.58 1.94-.29.33-.58.37-1.08.12-.5-.25-2.1-.77-4-2.46-1.48-1.32-2.48-2.94-2.77-3.44-.29-.5-.03-.77.22-1.02.22-.22.5-.58.74-.87.25-.29.33-.5.5-.83.16-.33.08-.62-.04-.87-.12-.25-1.12-2.7-1.54-3.7-.4-.97-.82-.84-1.12-.85h-.96c-.33 0-.87.12-1.33.62-.46.5-1.75 1.71-1.75 4.16s1.79 4.83 2.04 5.16c.25.33 3.5 5.35 8.5 7.5 1.18.51 2.1.82 2.82 1.05 1.19.37 2.27.32 3.12.19.95-.14 2.93-1.2 3.35-2.35.41-1.16.41-2.15.29-2.35-.12-.2-.45-.33-.95-.58z" fill="#fff"/>
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