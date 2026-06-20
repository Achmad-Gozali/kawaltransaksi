import { MetadataRoute } from "next";

const BASE_URL = "https://kawaltransaksi.com";

const PRIVATE_PATHS = [
  "/_next/",
  "/api/",
  "/admin/",
  "/dashboard/",
  "/auth/",
  "/maintenance",
  "/offline",
  "/login",
  "/register",
  "/lupa-kata-sandi",
  "/reset-kata-sandi",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Search engines
      { userAgent: "Googlebot", allow: ["/"], disallow: PRIVATE_PATHS },
      { userAgent: "Bingbot", allow: ["/"], disallow: PRIVATE_PATHS },

      // AI search (allow — agar bisa dikutip)
      { userAgent: "OAI-SearchBot", allow: ["/"] },
      { userAgent: "Claude-SearchBot", allow: ["/"] },
      { userAgent: "Claude-User", allow: ["/"] },
      { userAgent: "Claude-Web", allow: ["/"] },         // deprecated tapi masih aktif
      { userAgent: "anthropic-ai", allow: ["/"] },       // deprecated tapi masih aktif
      { userAgent: "PerplexityBot", allow: ["/"] },
      { userAgent: "Perplexity-User", allow: ["/"] },
      { userAgent: "DuckAssistBot", allow: ["/"] },
      { userAgent: "YouBot", allow: ["/"] },
      { userAgent: "MistralAI-User", allow: ["/"] },
      { userAgent: "Meta-ExternalFetcher", allow: ["/"] }, // user-triggered, bukan training

      // AI training (block)
      { userAgent: "GPTBot", disallow: ["/"] },
      { userAgent: "ChatGPT-User", disallow: ["/"] },
      { userAgent: "ClaudeBot", disallow: ["/"] },
      { userAgent: "claude-code", disallow: ["/"] },
      { userAgent: "Google-Extended", disallow: ["/"] },
      { userAgent: "Applebot-Extended", disallow: ["/"] },
      { userAgent: "CCBot", disallow: ["/"] },
      { userAgent: "FacebookBot", disallow: ["/"] },
      { userAgent: "Meta-ExternalAgent", disallow: ["/"] },
      { userAgent: "Bytespider", disallow: ["/"] },
      { userAgent: "Amazonbot", disallow: ["/"] },
      { userAgent: "cohere-ai", disallow: ["/"] },
      { userAgent: "Diffbot", disallow: ["/"] },
      { userAgent: "GrokBot", disallow: ["/"] },          // simbolis, Grok sering spoof UA
      { userAgent: "Ai2Bot", disallow: ["/"] },
      { userAgent: "HuggingFaceBot", disallow: ["/"] },

      // Catch-all
      { userAgent: "*", allow: ["/"], disallow: PRIVATE_PATHS },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}