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
          '/database',
          '/edukasi',
          '/artikel',
          '/artikel/',
          '/faq',
          '/kontak',
          '/kebijakan-privasi',
          '/syarat-ketentuan',
        ],
        disallow: [
          '/admin',
          '/dashboard',
          '/report',
          '/login',
          '/register',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}