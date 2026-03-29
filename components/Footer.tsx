// ============================================
// 📁 LOKASI: components/Footer.tsx
// 📝 UPDATE — semua link udah ngarah ke halaman yang bener
// ============================================

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-zinc-900">
                CekNo<span className="text-red-600">Scam</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-[200px]">
              Platform komunitas untuk saling melindungi dari penipuan online di Indonesia.
            </p>
          </div>

          {/* Layanan */}
          <div>
            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-4">Layanan</h4>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Cek Nomor</Link></li>
              <li><Link href="/report" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Lapor Penipuan</Link></li>
              <li><Link href="/edukasi" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Edukasi</Link></li>
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-4">Bantuan</h4>
            <ul className="space-y-2.5">
              <li><Link href="/faq" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">FAQ</Link></li>
              <li><Link href="/kontak" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Kontak</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-4">Sosial</h4>
            <div className="flex gap-2">
              <a href="#" className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-200 transition-colors">
                <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-200 transition-colors">
                <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-zinc-400">&copy; {new Date().getFullYear()} CekNoScam. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-5">
            <Link href="/syarat-ketentuan" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Syarat &amp; Ketentuan</Link>
            <Link href="/kebijakan-privasi" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Kebijakan Privasi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}