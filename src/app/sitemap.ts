import type { MetadataRoute } from "next";

import { publicRoutes } from "@/lib/navigation";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes
    .filter((path) => path !== "/offline")
    .map((path) => ({
      url: new URL(path, baseUrl).toString(),
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.7,
    }));
}
