import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getSiteSettings } from '@/lib/get-settings';

export async function generateMetadata(): Promise<Metadata> {
  const client = getConvexClient();
  const customersModule = await client.query(api.admin.modules.getModuleByKey, { key: 'customers' });
  if (customersModule?.enabled === false) {
    return {
      title: 'Tài khoản',
      description: 'Trang tài khoản hiện không khả dụng.',
      robots: { index: false, follow: false },
    };
  }
  const site = await getSiteSettings();
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';

  return {
    title: {
      default: 'Tài khoản',
      template: `%s | Tài khoản | ${site.site_name}`,
    },
    description: `Quản lý tài khoản của bạn tại ${site.site_name}`,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${baseUrl}/account`,
    },
  };
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  const customersModule = await client.query(api.admin.modules.getModuleByKey, { key: 'customers' });
  if (customersModule?.enabled === false) {
    notFound();
  }
  return children;
}
