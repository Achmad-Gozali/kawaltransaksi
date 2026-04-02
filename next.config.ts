import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ Aktifkan gzip/brotli compression
  compress: true,

  // ✅ Hapus X-Powered-By header (security + sedikit lebih kecil)
  poweredByHeader: false,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    // ✅ Tambahan ini supaya eror /logo.png?v=2 hilang
    localPatterns: [
      {
        pathname: '/**',
        search: '',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    // ✅ Tambah format modern → browser yang support dapat AVIF/WebP (lebih kecil)
    formats: ['image/avif', 'image/webp'],
    // ✅ Cache gambar lebih lama di CDN
    minimumCacheTTL: 3600,
  },

  // ✅ Tambah security & caching headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // ✅ Cache static assets agresif (JS, CSS, font)
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // ✅ Cache gambar
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

  output: 'standalone',
  transpilePackages: ['motion'],

  webpack: (config, { dev }) => {
    // HMR disabled in AI Studio via DISABLE_HMR env var
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;