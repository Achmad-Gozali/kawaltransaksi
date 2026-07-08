import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-inter',
  weight:   ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'KawalTransaksi - Cek & Laporkan Nomor Penipu',
  description: 'Cek nomor HP, rekening bank, dan e-wallet terindikasi penipuan secara gratis. Database laporan komunitas anti-penipuan Indonesia terlengkap.',
  metadataBase: new URL('https://kawaltransaksi.com'),
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png',  sizes: '32x32',   type: 'image/png' },
      { url: '/icons/icon-192x192.png',   sizes: '192x192', type: 'image/png' },
    ],
    apple:    [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/icons/favicon-32x32.png',
  },
  keywords: [
    'cek nomor penipu', 'cek rekening penipu', 'cek ewallet penipu',
    'lapor penipuan online', 'database penipu indonesia', 'kawaltransaksi',
  ],
  authors:   [{ name: 'KawalTransaksi' }],
  openGraph: {
    title:       'KawalTransaksi - Cek & Laporkan Nomor Penipu',
    description: 'Cek nomor HP, rekening bank, dan e-wallet terindikasi penipuan secara gratis.',
    type:        'website',
    locale:      'id_ID',
    siteName:    'KawalTransaksi',
    url:         'https://kawaltransaksi.com',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'KawalTransaksi - Cek & Laporkan Nomor Penipu',
    description: 'Cek nomor HP, rekening bank, dan e-wallet terindikasi penipuan secara gratis.',
  },
  robots:     { index: true, follow: true },
  alternates: { canonical: 'https://kawaltransaksi.com' },
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'black-translucent',
    title:          'KawalTransaksi',
  },
};

export const viewport: Viewport = {
  themeColor:   '#0f172a',
  width:        'device-width',
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
        {children}
      </body>
    </html>
  );
}