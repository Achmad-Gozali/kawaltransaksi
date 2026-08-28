import type { Metadata, Viewport } from 'next';
import { Inter, Syne, DM_Mono } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import IdleLogoutWatcher from '@/components/IdleLogoutWatcher';
import { safeJsonLd } from '@/core/utils';

const SITE_URL = 'https://kawaltransaksi.com';

const inter = Inter({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-inter',
  weight:   ['400', '500', '600', '700'],
});

// Dipakai untuk heading tebal di halaman detail bank/e-wallet (--font-syne)
// dan angka/nomor gaya monospace (--font-dm-mono). Sebelumnya cuma ditulis
// di `style={{ fontFamily: "'Syne'..." }}` tanpa pernah di-load.
const syne = Syne({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-syne',
  weight:   ['600', '700'],
});

const dmMono = DM_Mono({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-dm-mono',
  weight:   ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Cek Nomor Penipu Online, Rekening & E-Wallet - KawalTransaksi',
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
  authors:   [{ name: 'KawalTransaksi' }],
  creator:   'KawalTransaksi',
  publisher: 'KawalTransaksi',
  openGraph: {
    title:       'Cek Nomor Penipu Online, Rekening & E-Wallet - KawalTransaksi',
    description: 'Cek nomor HP, rekening bank, dan e-wallet terindikasi penipuan secara gratis. Database laporan komunitas anti-penipuan Indonesia.',
    type:        'website',
    locale:      'id_ID',
    siteName:    'KawalTransaksi',
    url:         'https://kawaltransaksi.com',
    // Gambar OG di-handle file convention app/(public)/opengraph-image.tsx
    // (+ versi dinamis di [bank]/[wallet]); twitter:image otomatis fallback ke situ.
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Cek Nomor Penipu Online, Rekening & E-Wallet - KawalTransaksi',
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

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'KawalTransaksi',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'Platform komunitas anti-penipuan digital Indonesia untuk cek nomor HP, rekening bank, e-wallet, dan QRIS terindikasi penipuan.',
  sameAs: [
    'https://www.tiktok.com/@alieee27_',
    'https://www.instagram.com/achmadgozali27_/',
    'https://www.facebook.com/ali.gntng201',
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'KawalTransaksi',
  url: SITE_URL,
  inLanguage: 'id-ID',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/check/{search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export const viewport: Viewport = {
  themeColor:   '#0f172a',
  width:        'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`scroll-smooth ${inter.variable} ${syne.variable} ${dmMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://api.kawaltransaksi.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body
        className={`${inter.className} bg-zinc-50 text-zinc-900 min-h-screen flex flex-col selection:bg-red-100 selection:text-red-900`}
        suppressHydrationWarning
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd) }} />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
        {children}
        <IdleLogoutWatcher />

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