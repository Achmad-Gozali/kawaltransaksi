import { MetadataRoute } from 'next';

const BASE_URL = 'https://kawaltransaksi.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/cek-nomor',
          '/cek-rekening',
          '/cek-ewallet',
          '/check/',
          '/laporan-publik',
          '/edukasi',
          '/artikel',
          '/artikel/',
          '/faq',
          '/kontak',
          '/kebijakan-privasi',
          '/syarat-ketentuan',
          '/login',
          '/register',
          '/report',
        ],
        disallow: [
          '/admin',
          '/dashboard',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}