import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FUERZA",
    short_name: "FUERZA",
    description: "Obrador de masa madre en Asturias.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F5F1E8",
    theme_color: "#F5F1E8",
    lang: "es-ES",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
