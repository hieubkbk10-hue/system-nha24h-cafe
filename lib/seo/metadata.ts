/**
 * SEO Metadata Builder
 * Refactored: sử dụng resolver + route-policy để zero-config
 */

import type { Metadata } from 'next';
import type { ContactSettings, SEOSettings, SiteSettings } from '@/lib/get-settings';
import {
  type EntitySeoData,
  resolveCanonicalUrl,
  resolveSeoDescription,
  resolveSeoImage,
  resolveSeoKeywords,
  resolveSeoTitle,
} from './resolver';
import { type RouteType, getRoutePolicy, shouldIndex } from './route-policy';

export type SeoContext = {
  baseUrl: string;
  description: string;
  image: string;
  keywords: string[];
  locale: string;
  siteName: string;
  title: string;
};

const resolveBaseUrl = (siteUrl?: string): string => {
  const baseUrl = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com').replace(/\/$/, '');
  return baseUrl || 'https://example.com';
};

const buildMetadataBase = (baseUrl: string): URL | undefined => {
  if (!baseUrl) {
    return undefined;
  }
  return new URL(baseUrl);
};

const resolveLocale = (language: string): string => {
  if (language === 'vi') {
    return 'vi_VN';
  }
  return 'en_US';
};

// Legacy: giữ để backward compatibility
export const buildSeoContext = (site: SiteSettings, seo: SEOSettings): SeoContext => {
  const baseUrl = resolveBaseUrl(site.site_url);
  const siteName = site.site_name || 'Website';
  const title = seo.seo_title || siteName;
  const description = seo.seo_description || site.site_tagline || '';
  const keywords = seo.seo_keywords
    ? seo.seo_keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean)
    : [];

  return {
    baseUrl,
    description,
    image: seo.seo_og_image || site.site_logo || '',
    keywords,
    locale: resolveLocale(site.site_language || 'vi'),
    siteName,
    title,
  };
};

// Legacy: giữ để backward compatibility
export const buildCanonicalUrl = (baseUrl: string, path = ''): string | undefined => {
  if (!baseUrl) {
    return undefined;
  }
  if (!path) {
    return baseUrl;
  }
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

// Legacy: giữ để backward compatibility
export const buildMetadata = (params: {
  canonical?: string;
  context: SeoContext;
  description: string;
  image?: string;
  indexable: boolean;
  keywords?: string[];
  openGraphType?: 'website' | 'article';
  openGraph?: Partial<NonNullable<Metadata['openGraph']>>;
  title: string;
  useTitleTemplate?: boolean;
}): Metadata => {
  const resolvedImage = params.image || params.context.image;
  const resolvedKeywords = params.keywords ?? params.context.keywords;
  const openGraphTitle = params.useTitleTemplate
    ? params.title
    : `${params.title} | ${params.context.siteName}`;

  return {
    alternates: params.canonical ? { canonical: params.canonical } : undefined,
    description: params.description,
    keywords: resolvedKeywords.length > 0 ? resolvedKeywords : undefined,
    metadataBase: buildMetadataBase(params.context.baseUrl),
    openGraph: {
      description: params.description,
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
      locale: params.context.locale,
      siteName: params.context.siteName,
      title: openGraphTitle,
      type: params.openGraphType ?? 'website',
      url: params.canonical,
      ...params.openGraph,
    },
    robots: {
      follow: params.indexable,
      index: params.indexable,
    },
    title: params.useTitleTemplate
      ? { default: params.title, template: `%s | ${params.context.siteName}` }
      : params.title,
    twitter: {
      card: 'summary_large_image',
      description: params.description,
      images: resolvedImage ? [resolvedImage] : undefined,
      title: openGraphTitle,
    },
  };
};

// =================== NEW: Zero-Config Metadata Builder ===================

export const buildSeoMetadata = (params: {
  routeType: RouteType;
  pathname: string;
  site: SiteSettings;
  seo: SEOSettings;
  contact: ContactSettings;
  entity?: EntitySeoData;
  moduleEnabled?: boolean;
  entityExists?: boolean;
  titleOverride?: string;
  descriptionOverride?: string;
  openGraphType?: 'website' | 'article';
  useTitleTemplate?: boolean;
}): Metadata => {
  const baseUrl = resolveBaseUrl(params.site.site_url);
  const locale = resolveLocale(params.site.site_language || 'vi');
  const siteName = params.site.site_name || 'Website';

  // Resolve indexability theo policy
  const indexable = shouldIndex({
    entityExists: params.entityExists,
    moduleEnabled: params.moduleEnabled,
    routeType: params.routeType,
  });

  // Resolve canonical theo policy
  const policy = getRoutePolicy(params.routeType);
  const canonical =
    policy.canonicalRule === 'noindex'
      ? undefined
      : resolveCanonicalUrl({
          baseUrl,
          cleanQueryParams: policy.canonicalRule === 'clean',
          pathname: params.pathname,
        });

  // Resolve SEO fields từ entity + site settings
  const title = params.titleOverride ?? resolveSeoTitle({
    entity: params.entity,
    site: params.site,
  });

  const description = params.descriptionOverride ?? resolveSeoDescription({
    entity: params.entity,
    seo: params.seo,
    site: params.site,
  });

  const image = resolveSeoImage({
    entity: params.entity,
    seo: params.seo,
    site: params.site,
  });

  const keywords = resolveSeoKeywords({
    entity: params.entity,
    seo: params.seo,
  });

  const openGraphTitle = params.useTitleTemplate ? title : `${title} | ${siteName}`;

  return {
    alternates: canonical ? { canonical } : undefined,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    metadataBase: buildMetadataBase(baseUrl),
    openGraph: {
      description,
      images: image ? [{ url: image }] : undefined,
      locale,
      siteName,
      title: openGraphTitle,
      type: params.openGraphType ?? 'website',
      url: canonical,
    },
    robots: {
      follow: indexable,
      index: indexable,
    },
    title: params.useTitleTemplate
      ? { default: title, template: `%s | ${siteName}` }
      : title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: image ? [image] : undefined,
      title: openGraphTitle,
    },
  };
};

export const buildHubMetadata = (params: {
  contact: ContactSettings;
  description: string;
  pathname: string;
  seo: SEOSettings;
  site: SiteSettings;
  title: string;
  routeType?: RouteType;
}): Metadata => buildSeoMetadata({
  contact: params.contact,
  descriptionOverride: params.description,
  pathname: params.pathname,
  routeType: params.routeType ?? 'list',
  seo: params.seo,
  site: params.site,
  titleOverride: params.title,
});
