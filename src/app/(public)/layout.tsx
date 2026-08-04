import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PwaRegister } from "@/components/pwa/pwa-register";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FUERZA",
    description: "Obrador de masa madre en Asturias.",
    inLanguage: "es-ES",
    ...(process.env.NEXT_PUBLIC_SITE_URL ? { url: process.env.NEXT_PUBLIC_SITE_URL } : {}),
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <PublicHeader />
      {children}
      <PublicFooter />
      <InstallPrompt />
      <PwaRegister />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
      />
    </>
  );
}
