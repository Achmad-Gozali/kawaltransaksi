import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SiteShell from '@/components/SiteShell';
import { Analytics } from '@vercel/analytics/next';

// ✅ OPTIMIZED: hapus Roboto_Mono — font ini jarang dipakai tapi tetap load
//    request font Google Fonts. Kalau memang dipakai di beberapa tempat,
//    ganti dengan CSS variable + font-display: optional supaya ga block render.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'KawalTransaksi - Cek & Laporkan Nomor Penipu',
  description: 'Cek nomor HP, rekening bank, dan e-wallet terindikasi penipuan secara gratis. Database laporan komunitas anti-penipuan Indonesia terlengkap.',
  metadataBase: new URL('https://kawaltransaksi.com'),
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/favicon-32x32.png',
  },
  manifest: '/manifest.json',
  keywords: [
    'cek nomor penipu', 'cek nomor hp penipu', 'cek nomor telepon penipu',
    'nomor hp penipu', 'nomor penipu indonesia', 'cek nomor penipuan',
    'lacak nomor penipu', 'cek nomor wa penipu', 'cek nomor whatsapp penipu',
    'nomor wa penipu', 'cek rekening penipu', 'cek rekening bank penipu',
    'rekening penipuan', 'cek rekening BCA penipu', 'cek rekening BRI penipu',
    'cek rekening BNI penipu', 'cek rekening Mandiri penipu', 'cek rekening BSI penipu',
    'cek rekening CIMB penipu', 'nomor rekening penipu', 'rekening bank penipu',
    'cek nomor rekening', 'cek ewallet penipu', 'cek GoPay penipu', 'cek OVO penipu',
    'cek Dana penipu', 'cek ShopeePay penipu', 'cek LinkAja penipu', 'gopay penipu',
    'ovo penipu', 'dana penipu', 'shopeepay penipu', 'dompet digital penipu',
    'lapor penipuan online', 'laporkan penipu', 'laporan penipuan online indonesia',
    'cara lapor penipuan online', 'lapor rekening penipu', 'lapor nomor penipu',
    'lapor penipuan jual beli online', 'lapor investasi bodong', 'modus penipuan online',
    'penipuan jual beli online', 'investasi bodong', 'pinjaman online ilegal', 'pinjol ilegal',
    'phishing indonesia', 'social engineering', 'penipuan transfer dana', 'penipuan COD',
    'penipuan marketplace', 'penipuan tokopedia', 'penipuan shopee', 'penipuan olx',
    'penipuan facebook marketplace', 'anti penipuan indonesia', 'database penipu indonesia',
    'database nomor penipu', 'database rekening penipu', 'cek penipuan online',
    'hindari penipuan online', 'waspada penipuan online', 'komunitas anti penipuan',
    'blacklist penipu', 'blacklist rekening penipu', 'kawaltransaksi', 'kawal transaksi',
    'kawaltransaksi.com',
  ],
  authors: [{ name: 'KawalTransaksi' }],
  creator: 'KawalTransaksi',
  publisher: 'KawalTransaksi',
  openGraph: {
    title: 'KawalTransaksi - Cek & Laporkan Nomor Penipu',
    description: 'Cek nomor HP, rekening bank, dan e-wallet terindikasi penipuan secara gratis. Database laporan komunitas anti-penipuan Indonesia.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'KawalTransaksi',
    url: 'https://kawaltransaksi.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KawalTransaksi - Cek & Laporkan Nomor Penipu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KawalTransaksi - Cek & Laporkan Nomor Penipu',
    description: 'Cek nomor HP, rekening bank, dan e-wallet terindikasi penipuan secara gratis.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://kawaltransaksi.com',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KawalTransaksi',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // ✅ OPTIMIZED: hapus robotoMono.variable dari className
    <html lang="id" className={`scroll-smooth ${inter.variable}`}>
      <body
        className={`${inter.className} bg-zinc-50 text-zinc-900 min-h-screen flex flex-col selection:bg-red-100 selection:text-red-900`}
        suppressHydrationWarning
      >
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
        <SiteShell>{children}</SiteShell>
        <Analytics mode="auto" />
      </body>
    </html>
  );
}