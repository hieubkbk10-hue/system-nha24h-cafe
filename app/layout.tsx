import "./globals.css";
import type { Metadata } from "next";
import { PageViewTracker } from "@/components/PageViewTracker";
import { BrandColorProvider } from "@/components/providers/BrandColorProvider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { getSEOSettings } from "@/lib/get-settings";
import {
  Be_Vietnam_Pro,
  Geist,
  Geist_Mono,
  Roboto,
  Noto_Sans,
  Nunito,
  Source_Sans_3,
  Merriweather,
  Lora,
  Montserrat,
  Roboto_Slab,
  Noto_Serif,
} from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const vietnameseSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  weight: ["400", "500", "600", "700"],
});

const robotoSans = Roboto({
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
});

const notoSans = Noto_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-noto-sans",
  weight: ["400", "500", "600", "700"],
});

const nunitoSans = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin", "vietnamese"],
  variable: "--font-source-sans-3",
  weight: ["400", "500", "600", "700"],
});

const merriweather = Merriweather({
  subsets: ["latin", "vietnamese"],
  variable: "--font-merriweather",
  weight: ["400", "700"],
});

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto-slab",
  weight: ["400", "500", "600", "700"],
});

const notoSerif = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  variable: "--font-noto-serif",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const resolveMetadataBase = (): URL => {
  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
    || process.env.VERCEL_URL
    || "http://localhost:3000";
  const normalizedBaseUrl = rawBaseUrl.startsWith("http") ? rawBaseUrl : `https://${rawBaseUrl}`;
  return new URL(normalizedBaseUrl);
};

export const dynamic = "force-dynamic";

export const generateMetadata = async (): Promise<Metadata> => {
  const seo = await getSEOSettings();

  return {
    metadataBase: resolveMetadataBase(),
    verification: {
      google: seo.seo_google_verification || undefined,
      other: seo.seo_bing_verification
        ? { "msvalidate.01": seo.seo_bing_verification }
        : undefined,
    },
  };
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="vi">
      <body
        className={`${vietnameseSans.variable} ${geistSans.variable} ${geistMono.variable} ${robotoSans.variable} ${notoSans.variable} ${nunitoSans.variable} ${sourceSans.variable} ${merriweather.variable} ${lora.variable} ${montserrat.variable} ${robotoSlab.variable} ${notoSerif.variable} antialiased`}
      >
        <ConvexClientProvider>
          <BrandColorProvider />
          <PageViewTracker />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
