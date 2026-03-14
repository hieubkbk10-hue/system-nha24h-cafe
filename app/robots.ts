import type { MetadataRoute } from 'next';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const client = getConvexClient();
  const siteUrlSetting = await client.query(api.settings.getByKey, { key: 'site_url' });
  const baseUrl = ((siteUrlSetting?.value as string) || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

  // Policy cứng: disallow theo route-policy contract
  const sitemapUrls = baseUrl
    ? [
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/sitemap/static.xml`,
        `${baseUrl}/sitemap/posts.xml`,
        `${baseUrl}/sitemap/products.xml`,
        `${baseUrl}/sitemap/services.xml`,
        `${baseUrl}/sitemap/landings.xml`,
      ]
    : undefined;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/system/',
          '/api/',
          '/account/',
          '/cart/',
          '/checkout/',
          '/wishlist/',
        ],
      },
    ],
    ...(sitemapUrls ? { sitemap: sitemapUrls } : {}),
  };
}
