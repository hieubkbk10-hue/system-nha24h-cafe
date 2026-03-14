import { JsonLd, generateNavigationSchema } from '@/components/seo/JsonLd';
import { SiteShell } from '@/components/site/SiteShell';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildSeoMetadata } from '@/lib/seo/metadata';
import { buildSiteSchemas } from '@/lib/seo/schema-policy';
import type { Metadata } from 'next';

const resolveUrl = (url: string, baseUrl: string): string => {
  if (!url) {
    return baseUrl;
  }
  if (url.startsWith('http')) {
    return url;
  }
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

export const generateMetadata = (): Promise<Metadata> => {
  return Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
  ]).then(([site, seo, contact]) => {
    return {
      ...buildSeoMetadata({
        contact,
        pathname: '/',
        routeType: 'home',
        seo,
        site,
        titleOverride: seo.seo_title || site.site_name,
        useTitleTemplate: true,
      }),
      icons: { icon: `/api/favicon?v=${encodeURIComponent(site.site_favicon || '')}` },
    };
  });
};

const SiteLayout = ({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> => {
  return Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
  ]).then(async ([site, seo, contact, social]) => {
    const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';
    const client = getConvexClient();
    const headerMenu = await client.query(api.menus.getMenuByLocation, { location: 'header' });
    const headerItems = headerMenu
      ? await client.query(api.menus.listActiveMenuItems, { menuId: headerMenu._id })
      : [];

    // Zero-config: schema engine tự quyết định Organization vs LocalBusiness
    const siteSchemas = buildSiteSchemas({ contact, seo, site, social });

    const navigationSchema = generateNavigationSchema({
      items: headerItems.map((item) => ({
        name: item.label,
        url: resolveUrl(item.url, baseUrl),
      })),
      name: `${site.site_name} Navigation`,
      url: baseUrl,
    });

    return (
      <div data-theme="light" style={{ colorScheme: 'light' }}>
        <SiteShell>
          {siteSchemas.map((schema, index) => (
            <JsonLd key={index} data={schema} />
          ))}
          {headerItems.length > 0 && <JsonLd data={navigationSchema} />}
          {children}
        </SiteShell>
      </div>
    );
  });
};

export default SiteLayout;
