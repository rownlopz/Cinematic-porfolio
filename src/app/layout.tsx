import type { Metadata, Viewport } from "next";
import { Anton, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getSiteData } from "@/lib/content";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const viewport: Viewport = { themeColor: "#0a0a0a", width: "device-width", initialScale: 1 };

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData();
  const title = settings.seo_title || `${settings.display_name} — Video Editor, Motion Designer & AI Video Creator`;
  const description =
    settings.seo_description || settings.hero_subline || "Video editing, motion design, and AI-powered visuals.";
  const image = settings.og_image_url || settings.portrait_url || undefined;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s — ${settings.display_name}` },
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: siteUrl,
      siteName: settings.display_name,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
    alternates: { canonical: "/" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${grotesk.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
