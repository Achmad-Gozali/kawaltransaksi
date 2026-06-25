import { MetadataRoute } from "next";
import { createClient } from "@/core/supabase/server";
import { encodeSlug } from "@/core/utils";
import { DOC_TOPICS } from "@/app/(public)/developer/docs/data";

const BASE_URL = "https://kawaltransaksi.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/cek-nomor`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/cek-nomor/cek-ewallet/gopay`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-nomor/cek-ewallet/dana`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-nomor/cek-ewallet/ovo`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-nomor/cek-ewallet/shopeepay`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-nomor/cek-ewallet/linkaja`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/cek-rekening/bca`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening/bri`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening/bni`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening/mandiri`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening/bsi`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening/cimb`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/artikel`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/laporan-publik`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/edukasi`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/developer`,
      lastModified: new Date("2026-06-25"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/kontak`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/kebijakan-privasi`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/syarat-ketentuan`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/report`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const docsPages: MetadataRoute.Sitemap = DOC_TOPICS.map((topic) => ({
    url: `${BASE_URL}/developer/docs/${topic.slug}`,
    lastModified: new Date("2026-06-25"),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  try {
    const supabase = await createClient();

    const { data: reports } = await supabase
      .from("reports")
      .select("target_number, created_at")
      .eq("status", "verified")
      .order("created_at", { ascending: false })
      .limit(50000);

    const uniqueReports = new Map<string, string>();
    for (const r of reports ?? []) {
      if (!uniqueReports.has(r.target_number)) {
        uniqueReports.set(r.target_number, r.created_at);
      }
    }

    const dynamicPages: MetadataRoute.Sitemap = [
      ...uniqueReports.entries(),
    ].map(([number, date]) => ({
      url: `${BASE_URL}/check/${encodeSlug(number)}`,
      lastModified: new Date(date),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const { data: articles } = await supabase
      .from("articles")
      .select("slug, published_at, cover_image")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500);

    const articlePages: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
      url: `${BASE_URL}/artikel/${a.slug}`,
      lastModified: new Date(a.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(a.cover_image && { images: [a.cover_image] }),
    }));

    return [...staticPages, ...docsPages, ...dynamicPages, ...articlePages];
  } catch {
    return [...staticPages, ...docsPages];
  }
}