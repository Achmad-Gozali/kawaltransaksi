import { MetadataRoute } from 'next';

const BASE_URL = 'https://kawaltransaksi.com/';

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
          '/edukasi',
        ],
        disallow: [
          '/admin',
          '/database',    // login-only, tidak perlu diindex
          '/profil',
          '/report',      // form, tidak perlu diindex
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