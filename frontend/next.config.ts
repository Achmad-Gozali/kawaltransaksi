import type { NextConfig } from "next";

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
        ],
      },
    ];
  },
};

export default nextConfig;