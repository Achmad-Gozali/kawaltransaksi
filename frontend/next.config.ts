import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy — dijalankan REPORT-ONLY dulu: browser hanya
// melaporkan pelanggaran (console devtools), TIDAK memblokir apa pun. Tujuannya
// mengumpulkan dulu apa saja yang sebenarnya dimuat halaman sebelum diubah jadi
// enforcing (ganti header jadi "Content-Security-Policy" tanpa "-Report-Only").
//
// Sumber yang sudah diketahui sah:
//  - 'unsafe-inline' script/style : Next.js App Router menyuntik <script>/<style>
//    inline tanpa nonce (belum ada setup nonce di app ini).
//  - 'unsafe-eval' (dev saja)     : react-refresh / HMR next dev.
//  - googletagmanager + google-analytics : GA4 gtag di app/layout.tsx.
//  - challenges.cloudflare.com    : widget Turnstile (script + iframe).
//  - img.kawaltransaksi.com       : foto bukti / thumbnail (R2).
//  - api.kawaltransaksi.com       : fetch client-side ke backend.
// Font next/font/google di-self-host saat build -> cukup 'self'.
//
// Belum ada report-uri/report-to: pelanggaran baru terlihat di devtools tiap
// browser. Kalau mau agregasi, tambah endpoint kolektor lalu "report-to".
const cspReportOnly = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.kawaltransaksi.com https://www.googletagmanager.com https://*.google-analytics.com",
  "font-src 'self' data:",
  `connect-src 'self' https://api.kawaltransaksi.com https://challenges.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com${isDev ? " ws:" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    // Semua gambar user-generated (foto bukti laporan, thumbnail artikel)
    // di-serve dari Cloudflare R2 lewat img.kawaltransaksi.com (lihat
    // backend R2_PUBLIC_URL). Tanpa entri ini, next/image menolak optimasi
    // domain eksternal sehingga terpaksa pakai unoptimized.
    remotePatterns: [
      { protocol: "https", hostname: "img.kawaltransaksi.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // HSTS: situs sudah HTTPS-only (nginx redirect 80 -> 443), jadi ini
          // hanya menutup celah request pertama via HTTP yang bisa di-MITM.
          //
          // Sengaja TANPA includeSubDomains & preload: keduanya sulit dibatalkan
          // (preload butuh proses penghapusan berbulan-bulan di daftar browser)
          // dan includeSubDomains akan memaksa HTTPS di SEMUA subdomain --
          // aman hanya kalau benar-benar tidak ada subdomain internal yang
          // masih HTTP. Tambahkan setelah itu diverifikasi.
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          // REPORT-ONLY — tidak memblokir, hanya melaporkan. Lihat catatan di
          // atas `cspReportOnly`.
          { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
        ],
      },
    ];
  },
};

export default nextConfig;