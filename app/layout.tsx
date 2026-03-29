import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SiteShell from '@/components/SiteShell';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'KawalTransaksi - Platform Anti-Penipuan Komunitas',
  description: 'Cek dan laporkan nomor telepon atau rekening terindikasi penipuan. Gratis, cepat, didukung komunitas.',
  metadataBase: new URL('https://kawaltransaksi-kf68.vercel.app'),
  openGraph: {
    title: 'KawalTransaksi - Platform Anti-Penipuan Komunitas',
    description: 'Cek dan laporkan nomor telepon atau rekening terindikasi penipuan.',
    type: 'website',
    locale: 'id_ID',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

// ✅ Layout ini SELALU render Navbar & Footer
// Admin page punya layout sendiri di app/admin/layout.tsx
// Next.js App Router otomatis pakai layout terdekat — /admin pakai admin/layout.tsx bukan ini
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`scroll-smooth ${inter.variable}`}>
      <body
        className={`${inter.className} bg-zinc-50 text-zinc-900 min-h-screen flex flex-col selection:bg-red-100 selection:text-red-900`}
        suppressHydrationWarning
      >
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}