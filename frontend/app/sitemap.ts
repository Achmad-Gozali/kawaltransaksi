import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase-server';
import { encodeSlug } from '@/lib/utils';

const BASE_URL = 'https://kawaltransaksi.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                    lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/cek-nomor`,                     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/cek-rekening`,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/cek-rekening/bca`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cek-rekening/bri`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cek-rekening/bni`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cek-rekening/mandiri`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cek-rekening/bsi`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cek-rekening/cimb`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cek-nomor/cek-ewallet/gopay`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cek-nomor/cek-ewallet/dana`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cek-nomor/cek-ewallet/ovo`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cek-nomor/cek-ewallet/shopee`,  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cek-nomor/cek-ewallet/linkaja`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/artikel`,                       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/laporan-publik`,                lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/developer`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/edukasi`,                       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/faq`,                           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/kontak`,                        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/kebijakan-privasi`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/syarat-ketentuan`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/login`,                         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/register`,                      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/report`,                        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  try {
    const supabase = await createClient();

    const { data: reports } = await supabase
      .from('reports')
      .select('target_number, created_at')
      .eq('status', 'verified')
      .order('created_at', { ascending: false })
      .limit(50000);

    const dynamicPages: MetadataRoute.Sitemap = (reports ?? []).map((r) => ({
      url: `${BASE_URL}/check/${encodeSlug(r.target_number)}`,
      lastModified: new Date(r.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const { data: articles } = await supabase
      .from('articles')
      .select('slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500);

    const articlePages: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
      url: `${BASE_URL}/artikel/${a.slug}`,
      lastModified: new Date(a.published_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...dynamicPages, ...articlePages];
  } catch {
    return staticPages;
  }
}