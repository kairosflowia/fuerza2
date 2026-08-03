import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/cuenta/", "/auth/", "/design-system", "/offline"],
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}
