import path from 'path';
import type { NextConfig } from 'next';
import withSerwist from '@serwist/next';
import { withSentryConfig } from '@sentry/nextjs';

if (typeof globalThis.self === 'undefined') {
  (globalThis as unknown as { self: typeof globalThis }).self = globalThis;
}

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  outputFileTracingRoot: path.join(__dirname, '../'),

  serverExternalPackages: ['@sentry/nextjs', '@sentry/core', '@sentry/node'],

  generateBuildId: async () =>
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
    process.env.K_REVISION ||
    `build-${new Date().toISOString().slice(0, 10)}`,

  eslint:     { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  images: {
    localPatterns: [{ pathname: '/**', search: '' }],
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos',          port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.supabase.co',          port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.kawaltransaksi.com', port: '', pathname: '/**' },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 86400,
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'motion'],
    optimizeCss: true,
  },

  async rewrites() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return [];
    return [{ source: '/api/sb/:path*', destination: `${supabaseUrl}/:path*` }];
  },

  async redirects() {
    return [
      { source: '/developer/docs', destination: '/developer/docs/overview', permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()', 'microphone=()', 'geolocation=()', 'payment=()',
              'xr-spatial-tracking=(self "https://challenges.cloudflare.com")',
            ].join(', '),
          },
          { key: 'Strict-Transport-Security',    value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "worker-src 'self' blob:",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com https://*.challenges.cloudflare.com https://static.cloudflareinsights.com https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms https://us-assets.i.posthog.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://picsum.photos https://cdn.kawaltransaksi.com https://www.google-analytics.com https://www.clarity.ms https://c.clarity.ms",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.cloudflare.com https://challenges.cloudflare.com https://*.challenges.cloudflare.com https://api.kawaltransaksi.com https://static.cloudflareinsights.com https://*.sentry.io https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://*.clarity.ms https://c.clarity.ms https://us.i.posthog.com https://us-assets.i.posthog.com",
              "frame-src https://challenges.cloudflare.com https://*.challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'X-Powered-By', value: '' },
          { key: 'server',       value: '' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/image(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/fonts/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(banks|ewallets|icons)/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control',          value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },

  transpilePackages: ['motion'],

  webpack: (config, { dev, isServer, webpack }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = { ignored: /.*/ };
    }

    if (isServer) {
      config.plugins.push(new webpack.DefinePlugin({ self: 'globalThis' }));
    }

    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: 'all',
          cacheGroups: {
            framework: {
              name: 'framework',
              chunks: 'all' as const,
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
              enforce: true,
            },
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

const withSerwistConfig = withSerwist({
  swSrc:   'app/sw.ts',
  swDest:  'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

export default withSentryConfig(withSerwistConfig(nextConfig), {
  org:     'kawaltransaksi',
  project: 'javascript-nextjs',
  silent:  !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: { removeDebugLogging: true },
  },
});