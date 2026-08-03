import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { site } from "@/lib/site";
import { CookieConsent } from "@/components/privacy/cookie-consent";

import "./globals.css";

const fraunces = localFont({
  src: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
  variable: "--font-fraunces",
  display: "swap",
  weight: "100 900",
});

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: site.name },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    title: site.name,
    description: site.description,
    images: [{ url: "/fuerza.jpeg", width: 1254, height: 1254, alt: "FUERZA, obrador de masa madre" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5F1E8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-ES">
      <body className={`${fraunces.variable} ${inter.variable}`}>{children}<CookieConsent/></body>
    </html>
  );
}
