import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

type SitemapChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: SitemapChangeFrequency;
  priority?: number;
};

type SitemapIndexEntry = {
  url: string;
  lastModified?: string | Date;
};

const normalizeDate = (value?: string | Date): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const buildSitemapXml = (entries: SitemapEntry[]): string => {
  const urls = entries
    .map((entry) => {
      const lastModified = normalizeDate(entry.lastModified);
      return [
        '<url>',
        `<loc>${escapeXml(entry.url)}</loc>`,
        lastModified ? `<lastmod>${lastModified}</lastmod>` : '',
        entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : '',
        typeof entry.priority === 'number' ? `<priority>${entry.priority.toFixed(1)}</priority>` : '',
        '</url>',
      ]
        .filter(Boolean)
        .join('');
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
  ].join('');
};

export const buildSitemapIndexXml = (entries: SitemapIndexEntry[]): string => {
  const urls = entries
    .map((entry) => {
      const lastModified = normalizeDate(entry.lastModified);
      return [
        '<sitemap>',
        `<loc>${escapeXml(entry.url)}</loc>`,
        lastModified ? `<lastmod>${lastModified}</lastmod>` : '',
        '</sitemap>',
      ]
        .filter(Boolean)
        .join('');
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</sitemapindex>',
  ].join('');
};

export const resolveBaseUrl = async (): Promise<string> => {
  const client = getConvexClient();
  const siteUrlSetting = await client.query(api.settings.getByKey, { key: 'site_url' });
  const baseUrl = ((siteUrlSetting?.value as string) || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  if (!baseUrl || baseUrl === 'https://example.com') {
    return '';
  }
  return baseUrl;
};
