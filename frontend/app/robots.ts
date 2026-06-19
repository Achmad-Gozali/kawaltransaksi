import { MetadataRoute } from "next";

const BASE_URL = "https://kawaltransaksi.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // -------------------------------------------------------
      // 1. GOOGLE -- search engine utama
      // -------------------------------------------------------
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: [
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
        ],
      },

      // -------------------------------------------------------
      // 2. BING -- search engine Microsoft
      // -------------------------------------------------------
      {
        userAgent: "Bingbot",
        allow: ["/"],
        disallow: [
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
        ],
      },

      // -------------------------------------------------------
      // 3. AI SEARCH / RETRIEVAL BOTS
      // Ini bot yang bikin site lo MUNCUL di jawaban AI
      // seperti ChatGPT, Claude, Perplexity
      // Izinkan agar kawaltransaksi bisa dikutip AI
      // -------------------------------------------------------

      // Bot ChatGPT ketika user search di ChatGPT
      { userAgent: "OAI-SearchBot", allow: ["/"] },

      // Bot Claude ketika user tanya sesuatu di Claude.ai
      { userAgent: "Claude-Web", allow: ["/"] },

      // Bot Anthropic untuk public search
      { userAgent: "anthropic-ai", allow: ["/"] },

      // Bot Perplexity AI search engine
      { userAgent: "PerplexityBot", allow: ["/"] },

      // Bot You.com AI search engine
      { userAgent: "YouBot", allow: ["/"] },

      // -------------------------------------------------------
      // 4. AI TRAINING BOTS
      // Ini bot yang harvest konten lo untuk training model AI
      // tanpa izin -- block semua
      // -------------------------------------------------------

      // OpenAI -- bot training GPT-4, GPT-5 dll
      { userAgent: "GPTBot", disallow: ["/"] },

      // OpenAI -- bot ketika user ChatGPT browse web
      // (beda dari OAI-SearchBot, ini lebih ke scraping)
      { userAgent: "ChatGPT-User", disallow: ["/"] },

      // Anthropic -- bot training Claude (beda dari Claude-Web)
      { userAgent: "ClaudeBot", disallow: ["/"] },

      // Google -- bot training Gemini AI
      // PENTING: ini TIDAK mempengaruhi Google Search biasa
      { userAgent: "Google-Extended", disallow: ["/"] },

      // Apple -- bot training Apple Intelligence
      // PENTING: ini TIDAK mempengaruhi Applebot search biasa
      { userAgent: "Applebot-Extended", disallow: ["/"] },

      // Common Crawl -- dataset publik yang dipakai hampir
      // semua perusahaan AI untuk training
      { userAgent: "CCBot", disallow: ["/"] },

      // Meta / Facebook -- bot training LLaMA dll
      { userAgent: "FacebookBot", disallow: ["/"] },
      { userAgent: "Meta-ExternalAgent", disallow: ["/"] },

      // ByteDance / TikTok -- bot training model mereka
      // Catatan: sering ignore robots.txt, block di Cloudflare
      // WAF untuk hasil maksimal
      { userAgent: "Bytespider", disallow: ["/"] },

      // Amazon -- bot training Alexa dan model Amazon
      { userAgent: "Amazonbot", disallow: ["/"] },

      // Cohere -- perusahaan AI enterprise
      { userAgent: "cohere-ai", disallow: ["/"] },

      // Diffbot -- scraper data untuk training AI
      { userAgent: "Diffbot", disallow: ["/"] },

      // -------------------------------------------------------
      // 5. SEMUA BOT LAIN
      // Catch-all untuk bot yang tidak disebutkan di atas
      // Izinkan tapi block halaman non-publik
      // -------------------------------------------------------
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
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
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}