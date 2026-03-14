import type { Metadata } from 'next';
import HomePageClient from './_components/HomePageClient';
import { getContactSettings, getSEOSettings, getSiteSettings } from '@/lib/get-settings';
import { buildSeoMetadata } from '@/lib/seo/metadata';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

export async function generateMetadata(): Promise<Metadata> {
  const [site, seo, contact] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
  ]);

  return buildSeoMetadata({
    contact,
    pathname: '/',
    routeType: 'home',
    seo,
    site,
  });
}

export default async function HomePage(): Promise<React.ReactElement> {
  const client = getConvexClient();
  const initialComponents = await client.query(api.homeComponents.listActive);

  return (
    <>
      <HomePageClient initialComponents={initialComponents} />
    </>
  );
}
