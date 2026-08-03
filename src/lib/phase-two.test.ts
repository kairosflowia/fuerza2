import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { legalPages } from "@/lib/legal-pages";
import { accountRoutes, adminNavigation, publicRoutes } from "@/lib/navigation";
import { createPageMetadata } from "@/lib/seo";

const projectRoot = process.cwd();

function filesBelow(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

describe("public route architecture", () => {
  it("declares every approved public route", () => {
    expect(publicRoutes).toEqual([
      "/",
      "/pan",
      "/obrador",
      "/nosotros",
      "/plan-de-pan",
      "/donde-estamos",
      "/reserva-y-recoge",
      "/contacto",
      "/aviso-legal",
      "/privacidad",
      "/cookies",
      "/condiciones-de-compra",
      "/politica-de-cancelacion",
      "/politica-de-suscripcion",
      "/informacion-alergenos",
      "/offline",
    ]);
  });

  it("keeps internal static links inside a known route", () => {
    const knownRoutes = new Set([
      ...publicRoutes,
      ...accountRoutes,
      "/admin",
      "/admin/productos/nuevo",
      "/admin/suscripciones/planes",
      "/admin/suscripciones/planes/nuevo",
      "/admin/contenido/emails/preview",
      "/carrito",
      "/admin/puntos-de-recogida/nuevo",
      "/admin/configuracion/calendario",
      "/admin/configuracion/legal",
      "/admin/configuracion/sistema",
      "/admin/analitica/clientes",
      "/admin/analitica/suscripciones",
      "/admin/analitica/puntos",
      "/design-system",
      ...adminNavigation.map(({ slug }) => `/admin/${slug}`),
    ]);
    const files = filesBelow(resolve(projectRoot, "src"));
    const links = files.flatMap((file) => {
      if (!file.endsWith(".tsx")) return [];
      const source = readFileSync(file, "utf8");
      return [...source.matchAll(/href="(\/[^"#?]*)"/g)].map((match) => match[1]);
    });

    expect(links.length).toBeGreaterThan(10);
    expect(links.filter((href) => !knownRoutes.has(href))).toEqual([]);
  });

  it("gives each institutional page one explicit page heading contract", () => {
    const pages = ["pan", "obrador", "nosotros", "plan-de-pan", "donde-estamos", "reserva-y-recoge", "contacto"];
    for (const page of pages) {
      const source = readFileSync(resolve(projectRoot, `src/app/(public)/${page}/page.tsx`), "utf8");
      expect(source).toContain("<PageIntro");
      expect(source).not.toMatch(/<h1[ >]/);
      expect(source).toContain("createPageMetadata");
    }
  });
});

describe("public content safeguards", () => {
  it("keeps legal pages structural and visibly provisional", () => {
    expect(Object.keys(legalPages)).toEqual([
      "aviso-legal",
      "privacidad",
      "cookies",
      "condiciones-de-compra",
      "politica-de-cancelacion",
      "politica-de-suscripcion",
      "informacion-alergenos",
    ]);
    const legalPage = readFileSync(resolve(projectRoot, "src/app/(public)/[legal]/page.tsx"), "utf8");
    expect(legalPage).toContain("Documento no definitivo");
    expect(legalPage).not.toMatch(/CIF|NIF|domicilio fiscal/i);
  });

  it("keeps the homepage editorial and the catalogue free of reservation controls", () => {
    const home = readFileSync(resolve(projectRoot, "src/app/(public)/page.tsx"), "utf8");
    const heroCarousel = readFileSync(resolve(projectRoot, "src/components/public/hero-carousel.tsx"), "utf8");
    const pan = readFileSync(resolve(projectRoot, "src/app/(public)/pan/page.tsx"), "utf8");
    const editorial = readFileSync(resolve(projectRoot, "src/components/public/editorial.tsx"), "utf8");
    expect((home + heroCarousel).match(/<h1[ >]/g)).toHaveLength(1);
    expect(editorial).toContain("Sin precio ni disponibilidad");
    expect(pan).toContain("IVA incluido");
    expect(pan).not.toMatch(/Añadir al carrito|Comprar ahora|Reservar ahora/);
  });
});

describe("SEO publication contracts", () => {
  it("creates canonical and Open Graph metadata", () => {
    const metadata = createPageMetadata({ title: "Pan", description: "Pan de masa madre", path: "/pan" });
    expect(metadata.alternates).toEqual({ canonical: "/pan" });
    expect(metadata.openGraph).toMatchObject({ title: "Pan", url: "/pan", locale: "es_ES" });
  });

  it("publishes public pages while excluding operational routes", () => {
    const urls = sitemap().map(({ url }) => new URL(url).pathname);
    expect(urls).toContain("/reserva-y-recoge");
    expect(urls).toContain("/condiciones-de-compra");
    expect(urls).not.toContain("/offline");
    expect(robots().rules).toMatchObject({ disallow: ["/admin/", "/cuenta/", "/auth/", "/design-system", "/offline"] });
  });
});
