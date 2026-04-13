import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase-server';
import { encodeSlug } from '@/lib/utils';

const BASE_URL = 'https://kawaltransaksi.com/';

export const revalidate = 3600; // regenerate sitemap tiap 1 jam

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/cek-nomor`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/cek-rekening`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/cek-rekening/bca`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening/bri`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening/bni`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening/mandiri`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening/bsi`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-rekening/cimb`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-ewallet/gopay`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-ewallet/dana`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-ewallet/ovo`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-ewallet/shopee`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cek-ewallet/linkaja`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/edukasi`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/report`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Dynamic pages — semua nomor yang sudah verified
  try {
    const supabase = await createClient();
    const { data: reports } = await supabase
      .from('reports')
      .select('target_number, created_at, status')
      .eq('status', 'verified')
      .order('created_at', { ascending: false })
      .limit(1000); // max 1000 nomor verified di sitemap

    const dynamicPages: MetadataRoute.Sitemap = (reports ?? []).map((r) => ({
      url: `${BASE_URL}/check/${encodeSlug(r.target_number)}`,
      lastModified: new Date(r.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...dynamicPages];
  } catch {
    // Kalau gagal fetch, return static pages saja
    return staticPages;
  }
}