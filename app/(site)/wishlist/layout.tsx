import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getSiteSettings } from '@/lib/get-settings';

export async function generateMetadata(): Promise<Metadata> {
  const client = getConvexClient();
  const wishlistModule = await client.query(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  if (wishlistModule?.enabled === false) {
    return {
      title: 'Yêu thích',
      description: 'Trang yêu thích hiện không khả dụng.',
      robots: { index: false, follow: false },
    };
  }
  const site = await getSiteSettings();
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';

  return {
    title: 'Yêu thích',
    description: `Danh sách sản phẩm yêu thích của bạn tại ${site.site_name}`,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${baseUrl}/wishlist`,
    },
  };
}

export default async function WishlistLayout({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  const wishlistModule = await client.query(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  if (wishlistModule?.enabled === false) {
    notFound();
  }
  return children;
}
