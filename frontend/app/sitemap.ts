import type { MetadataRoute } from "next";

const BASE_URL = "https://kawaltransaksi.com";
const API_URL  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const BANKS = ["bca", "bni", "bri", "bsi", "cimb", "mandiri"];
const EWALLETS = ["dana", "gopay", "linkaja", "ovo", "shopeepay"];

interface SitemapTarget {
  target_value: string;
  last_reported: string;
}

interface SitemapArticle {
  slug: string;
  updated_at: string;
}

async function fetchReportedTargets(): Promise<SitemapTarget[]> {
  try {
    const res = await fetch(`${API_URL}/api/reports/public/sitemap-targets`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchArticles(): Promise<SitemapArticle[]> {
  try {
    const res = await fetch(`${API_URL}/api/admin/articles/sitemap`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,               lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/cek-nomor`,       lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/cek-rekening`,    lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/laporan-publik`,  lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE_URL}/report`,          lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/artikel`,         lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/tentang-kami`,    lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/faq`,             lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/kontak`,          lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/kebijakan-privasi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/syarat-ketentuan`,  lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const bankPages: MetadataRoute.Sitemap = BANKS.map((bank) => ({
    url: `${BASE_URL}/cek-rekening/${bank}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const ewalletPages: MetadataRoute.Sitemap = EWALLETS.map((wallet) => ({
    url: `${BASE_URL}/cek-nomor/cek-ewallet/${wallet}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const [reportedTargets, articles] = await Promise.all([
    fetchReportedTargets(),
    fetchArticles(),
  ]);

  const checkPages: MetadataRoute.Sitemap = reportedTargets.map((t) => ({
    url: `${BASE_URL}/check/${t.target_value}`,
    lastModified: new Date(t.last_reported),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/artikel/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...bankPages, ...ewalletPages, ...checkPages, ...articlePages];
}