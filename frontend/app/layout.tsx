import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

const inter = Inter({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-inter',
  weight:   ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Cek Nomor Penipu Online, Rekening & E-Wallet | KawalTransaksi',
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
    // -- Cek nomor HP / WA --
    'cek nomor penipu', 'cek nomor hp penipu', 'cek nomor telepon penipu',
    'nomor hp penipu', 'nomor penipu indonesia', 'cek nomor penipuan',
    'lacak nomor penipu', 'cek nomor wa penipu', 'cek nomor whatsapp penipu',
    'nomor wa penipu', 'apakah nomor ini penipu', 'nomor ini penipu atau bukan',

    // -- Cek rekening bank (umum) --
    'cek rekening penipu', 'cek rekening bank penipu', 'rekening penipuan',
    'nomor rekening penipu', 'rekening bank penipu', 'cek nomor rekening',
    'cara cek rekening penipu', 'cek rekening sebelum transfer',
    'verifikasi rekening sebelum bayar',

    // -- Cek rekening per bank --
    'cek rekening BCA penipu', 'cek rekening BRI penipu', 'cek rekening BNI penipu',
    'cek rekening Mandiri penipu', 'cek rekening BSI penipu', 'cek rekening CIMB penipu',
    'cek rekening SeaBank penipu', 'cek rekening Allo Bank penipu',
    'cek rekening Aladin penipu', 'cek rekening Maybank penipu',
    'cek rekening BJB penipu',

    // -- Cek e-wallet --
    'cek ewallet penipu', 'cek GoPay penipu', 'cek OVO penipu', 'cek Dana penipu',
    'cek ShopeePay penipu', 'cek LinkAja penipu', 'gopay penipu', 'ovo penipu',
    'dana penipu', 'shopeepay penipu', 'dompet digital penipu',

    // -- Lapor penipuan --
    'lapor penipuan online', 'laporkan penipu', 'laporan penipuan online indonesia',
    'cara lapor penipuan online', 'lapor rekening penipu', 'lapor nomor penipu',
    'lapor penipuan jual beli online', 'lapor investasi bodong',

    // -- Modus & jenis penipuan --
    'modus penipuan online', 'penipuan jual beli online', 'investasi bodong',
    'pinjaman online ilegal', 'pinjol ilegal', 'phishing indonesia',
    'social engineering', 'penipuan transfer dana', 'penipuan COD',
    'penipuan segitiga', 'penipuan marketplace', 'penipuan tokopedia',
    'penipuan shopee', 'penipuan olx', 'penipuan facebook marketplace',
    'cek penjual online terpercaya',

    // -- Brand & database --
    'anti penipuan indonesia', 'database penipu indonesia', 'database nomor penipu',
    'database rekening penipu', 'cek penipuan online', 'hindari penipuan online',
    'waspada penipuan online', 'komunitas anti penipuan', 'blacklist penipu',
    'blacklist rekening penipu', 'kawaltransaksi', 'kawal transaksi',
    'kawaltransaksi.com',
  ],
  authors:   [{ name: 'KawalTransaksi' }],
  creator:   'KawalTransaksi',
  publisher: 'KawalTransaksi',
  openGraph: {
    title:       'Cek Nomor Penipu Online, Rekening & E-Wallet | KawalTransaksi',
    description: 'Cek nomor HP, rekening bank, dan e-wallet terindikasi penipuan secara gratis. Database laporan komunitas anti-penipuan Indonesia.',
    type:        'website',
    locale:      'id_ID',
    siteName:    'KawalTransaksi',
    url:         'https://kawaltransaksi.com',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Cek Nomor Penipu Online, Rekening & E-Wallet | KawalTransaksi',
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

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BBFDTC3WQX"
          strategy="lazyOnload"
        />
        <Script id="ga-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BBFDTC3WQX');
          `}
        </Script>
      </body>
    </html>
  );
}