import { NextResponse } from 'next/server';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildLlmsText } from '@/lib/seo/llms';

export async function GET() {
  const [site, seo, contact, social] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
  ]);
  const baseUrl = ((site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? 'https://example.com').replace(/\/$/, '');
  const text = buildLlmsText({ baseUrl, contact, seo, site, social });

  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
