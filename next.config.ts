import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
  htmlLimitedBots: /bingbot|BingPreview|msnbot|Google-Site-Verification|Googlebot/i,
  images: {
    remotePatterns: [
      {
        hostname: '*.convex.cloud',
        protocol: 'https',
      },
      {
        hostname: 'images.unsplash.com',
        protocol: 'https',
      },
      {
        hostname: 'picsum.photos',
        protocol: 'https',
      },
      {
        hostname: 'api.dicebear.com',
        protocol: 'https',
      },
      {
        hostname: 'www.youtube.com',
        protocol: 'https',
      },
      {
        hostname: 'i.ytimg.com',
        protocol: 'https',
      },
      {
        hostname: 'img.youtube.com',
        protocol: 'https',
      },
    ],
  },
};

export default nextConfig;
