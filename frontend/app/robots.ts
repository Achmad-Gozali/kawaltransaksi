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
    "/admin/",
    "/login",
    "/register",
    "/lupa-kata-sandi",
    "/reset-kata-sandi/",
    "/verifikasi-email",
    "/auth/callback",
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