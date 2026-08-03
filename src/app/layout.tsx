import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import { site } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={GeistSans.variable}>{children}</body>
    </html>
  );
}
