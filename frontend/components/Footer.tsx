import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook } from 'lucide-react';

const layananUtama = [
  { label: 'Cek Nomor',      href: '/cek-nomor' },
  { label: 'Cek Rekening',   href: '/cek-rekening' },
  { label: 'Lapor Penipuan', href: '/report' },
  { label: 'Edukasi',        href: '/edukasi' },
];

const bantuanLegal = [
  { label: 'FAQ',               href: '/faq' },
  { label: 'Kontak Kami',       href: '/kontak' },
  { label: 'Syarat Ketentuan',  href: '/syarat-ketentuan' },
  { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
];

const FOOTER_BG = '#1a2332';

export default function Footer() {
  return (
    <div style={{ backgroundColor: FOOTER_BG }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full block -mt-1 bg-transparent" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z" fill={FOOTER_BG} />
      </svg>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12 sm:pb-16 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-10 mb-12">

          <div className="col-span-2 md:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt="KawalTransaksi" width={36} height={36} className="rounded-lg" />
              <span className="text-sm font-black tracking-tighter text-white uppercase">
                Kawal<span className="text-emerald-400">Transaksi</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Membangun pertahanan komunitas terhadap penipuan digital di Indonesia. Cepat, Terbuka, dan Terpercaya.
            </p>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Layanan Utama</h4>
            <ul className="space-y-3">
              {layananUtama.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-xs font-bold text-slate-300 hover:text-emerald-400 uppercase tracking-wider transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Bantuan & Legal</h4>
            <ul className="space-y-3">
              {bantuanLegal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-xs font-bold text-slate-300 hover:text-emerald-400 uppercase tracking-wider transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-2">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Social</h4>
            <div className="flex md:flex-col gap-3">
              <a href="https://www.tiktok.com/@alieee27_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                <span className="w-8 h-8 border border-slate-600 rounded-lg flex items-center justify-center hover:border-slate-400 transition-colors shrink-0">
                  <svg className="w-3.5 h-3.5 fill-slate-300" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.47-.88-.64-1.61-1.47-2.12-2.44v10.12c-.03 2.13-.8 4.29-2.39 5.73-1.61 1.48-3.9 2.15-6.04 1.83-2.34-.35-4.52-2.11-5.32-4.34-.84-2.34-.14-5.1 1.74-6.72 1.51-1.32 3.65-1.78 5.61-1.3v4.11c-1.2-.34-2.58-.1-3.52.74-.83.74-1.12 1.99-.75 3.03.34 1.02 1.42 1.73 2.49 1.71 1.17-.03 2.22-.92 2.45-2.07.03-.17.04-.34.04-.51V.02z"/>
                  </svg>
                </span>
                TikTok
              </a>
              <a href="https://www.instagram.com/achmadgozali27_/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                <span className="w-8 h-8 border border-slate-600 rounded-lg flex items-center justify-center hover:border-slate-400 transition-colors shrink-0">
                  <Instagram className="w-3.5 h-3.5 text-slate-300" />
                </span>
                Instagram
              </a>
              <a href="https://www.facebook.com/ali.gntng201" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                <span className="w-8 h-8 border border-slate-600 rounded-lg flex items-center justify-center hover:border-slate-400 transition-colors shrink-0">
                  <Facebook className="w-3.5 h-3.5 text-slate-300" />
                </span>
                Facebook
              </a>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-700">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            © 2026 KawalTransaksi
          </p>
        </div>
      </footer>
    </div>
  );
}