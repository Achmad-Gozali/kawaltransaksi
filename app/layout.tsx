import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ✅ Tambah display: 'swap' → mencegah invisible text saat font loading (CLS fix)
// ✅ Tambah variable → bisa dipakai di CSS jika perlu
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CekNoScam - Platform Anti-Penipuan Komunitas',
  description: 'Cek dan laporkan nomor telepon atau rekening terindikasi penipuan.',
  // ✅ Tambah metaData tambahan untuk SEO & performa
  metadataBase: new URL('https://ceknoscam.vercel.app'), // ganti sesuai domain kamu
  openGraph: {
    title: 'CekNoScam - Platform Anti-Penipuan Komunitas',
    description: 'Cek dan laporkan nomor telepon atau rekening terindikasi penipuan.',
    type: 'website',
    locale: 'id_ID',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ✅ Pisahkan viewport ke export tersendiri (Next.js 14+ best practice)
export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`scroll-smooth ${inter.variable}`}>
      <body
        className={`${inter.className} bg-zinc-50 text-zinc-900 min-h-screen flex flex-col selection:bg-red-100 selection:text-red-900`}
        suppressHydrationWarning
      >
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}