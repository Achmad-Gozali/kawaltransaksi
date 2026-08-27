import type { MetadataRoute } from "next";

const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "CCBot",
  "ClaudeBot",
  "Google-Extended",
  "Bytespider",
  "FacebookBot",
  "Meta-ExternalAgent",
  "Applebot-Extended",
  "Omgilibot",
  "Omgili",
  "webzio-extended",
  "Diffbot",
  "img2dataset",
  "cohere-training-data-crawler",
];

export default function robots(): MetadataRoute.Robots {
  const disallowPaths = [
    "/dashboard/",
    // Tanpa trailing slash (beda dari /dashboard/ di atas) -- robots.txt
    // pakai prefix match literal, "/admin/" TIDAK menutup "/admin" itu
    // sendiri (bare page, app/admin/page.tsx), cuma subpath-nya.
    "/admin",
    "/login",
    "/register",
    "/lupa-kata-sandi",
    "/reset-kata-sandi/",
    "/verifikasi-email",
    "/auth/callback",
    "/maintenance",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowPaths,
      },
      ...AI_TRAINING_CRAWLERS.map((agent) => ({
        userAgent: agent,
        disallow: "/",
      })),
    ],
    sitemap: "https://kawaltransaksi.com/sitemap.xml",
  };
}