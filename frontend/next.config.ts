import type { NextConfig } from 'next';
import withSerwist from '@serwist/next';
import { withSentryConfig } from '@sentry/nextjs';

// ✅ Polyfill `self` untuk Node.js saat build (dibutuhkan oleh Serwist)
if (typeof globalThis.self === 'undefined') {
  (globalThis as unknown as { self: typeof globalThis }).self = globalThis;
}

// ─────────────────────────────────────────────
// Core Next.js Config
// ─────────────────────────────────────────────
const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  serverExternalPackages: ['@sentry/nextjs', '@sentry/core', '@sentry/node'],

  // ✅ FIX: Gunakan commit SHA agar stabil di Cloud Run.
  // Date.now() berubah setiap restart → Service Worker lama crash
  // karena precache chunk-nya sudah tidak ada di build baru.
  generateBuildId: async () => {
    return (
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
      process.env.K_REVISION || // Cloud Run revision
      `build-${new Date().toISOString().slice(0, 10)}` // fallback: stable per hari
    );
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // ─────────────────────────────────────────────
  // Image Optimization
  // ─────────────────────────────────────────────
  images: {
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
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.kawaltransaksi.com',
        port: '',
        pathname: '/**',
      },
    ],
    // ✅ FIX: Hapus 'image/avif' — encoding AVIF sangat lambat di server
    // (penyebab /_next/image melambat dari 1.78s → 6.70s).
    // WebP sudah cukup: kompresi bagus, encoding jauh lebih cepat.
    formats: ['image/webp'],
    minimumCacheTTL: 86400,
  },

  // ─────────────────────────────────────────────
  // Experimental
  // ─────────────────────────────────────────────
  experimental: {
    optimisticClientCache: true,
    optimizePackageImports: ['lucide-react', 'motion'],
  },

  // ─────────────────────────────────────────────
  // Rewrites
  // ─────────────────────────────────────────────
  async rewrites() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return [];

    return [
      {
        source: '/api/sb/:path*',
        destination: `${supabaseUrl}/:path*`,
      },
    ];
  },

  // ─────────────────────────────────────────────
  // Security & Cache Headers
  // ─────────────────────────────────────────────
  async headers() {
    return [
      // Global security headers
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'xr-spatial-tracking=(self "https://challenges.cloudflare.com")',
            ].join(', '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Expect-CT', value: 'max-age=86400, enforce' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "worker-src 'self' blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.challenges.cloudflare.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://picsum.photos https://cdn.kawaltransaksi.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.cloudflare.com https://challenges.cloudflare.com https://*.challenges.cloudflare.com https://api.kawaltransaksi.com http://localhost:8787 https://static.cloudflareinsights.com https://*.sentry.io",
              "frame-src https://challenges.cloudflare.com https://*.challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'X-Powered-By', value: '' },
          { key: 'server', value: '' },
        ],
      },

      // Static assets — immutable, cache 1 tahun
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // Next image — cache 1 hari, stale-while-revalidate 7 hari
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },

      // Font files
      {
        source: '/fonts/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // Bank / e-wallet / icon images
      {
        source: '/(banks|ewallets|icons)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },

      // Service Worker — selalu fresh, jangan di-cache browser
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },

  output: 'standalone',
  transpilePackages: ['motion'],

  // ─────────────────────────────────────────────
  // Webpack Customization
  // ─────────────────────────────────────────────
  webpack: (config, { dev, isServer, webpack }) => {
    // Disable HMR jika perlu (untuk debugging)
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }

    // ✅ FIX: Hanya pasang DefinePlugin di server build.
    // Jangan override config.target di client build — Next.js manage sendiri.
    // Override target manual → webpack chunk loading corrupt →
    // "Cannot read properties of undefined (reading 'call')".
    if (isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          self: 'globalThis',
        }),
      );
    }

    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: 'all',
          cacheGroups: {
            // React core — pisah chunk sendiri, di-cache browser lebih lama
            framework: {
              name: 'framework',
              chunks: 'all' as const,
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Lucide icons — besar tapi jarang berubah
            lucide: {
              name: 'lucide',
              chunks: 'all' as const,
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              priority: 30,
              enforce: true,
            },
          },
        },
      };

      // Buang locale moment.js yang tidak dipakai
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        }),
      );
    }

    return config;
  },
};

// ─────────────────────────────────────────────
// Serwist (PWA / Service Worker)
// ─────────────────────────────────────────────
const withSerwistConfig = withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

// ─────────────────────────────────────────────
// Sentry
// ─────────────────────────────────────────────
export default withSentryConfig(withSerwistConfig(nextConfig), {
  org: 'kawaltransaksi',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});