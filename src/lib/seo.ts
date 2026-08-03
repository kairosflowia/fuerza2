import type { Metadata } from "next";

interface PageSeo {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
}

export function createPageMetadata({
  title,
  description,
  path,
  ogTitle = title,
  ogDescription = description,
}: PageSeo): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: path,
      type: "website",
      locale: "es_ES",
      siteName: "FUERZA",
      images: [
        {
          url: "/fuerza.jpeg",
          width: 1254,
          height: 1254,
          alt: "FUERZA, obrador de masa madre en Asturias",
        },
      ],
    },
  };
}
