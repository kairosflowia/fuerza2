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
      "/obrador",
      "/nosotros",
      "/plan-de-pan",
      "/plan-de-pan/membresias",
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
      "/admin/puntos-de-recogida/calendario",
      "/admin/configuracion/legal",
      "/admin/configuracion/sistema",
      "/admin/configuracion/reservas",
      "/admin/pedidos/nuevo",
      "/admin/productos/especial-semana",
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
    // reserva-y-recoge vive ahora en el grupo de rutas (catalog), con su propio
    // shell de app (sin header/footer globales) en lugar del contrato PageIntro/h1.
    // obrador pasó a un hero editorial propio (con foto), igual que la home,
    // pero mantiene su propio h1 único y createPageMetadata (ver el test de abajo).
    const pages = ["nosotros", "plan-de-pan", "donde-estamos", "contacto"];
    for (const page of pages) {
      const source = readFileSync(resolve(projectRoot, `src/app/(public)/${page}/page.tsx`), "utf8");
      expect(source).toContain("<PageIntro");
      expect(source).not.toMatch(/<h1[ >]/);
      expect(source).toContain("createPageMetadata");
    }
  });

  it("keeps obrador's own editorial hero to a single page heading", () => {
    const source = readFileSync(resolve(projectRoot, "src/app/(public)/obrador/page.tsx"), "utf8");
    expect(source.match(/<h1[ >]/g)).toHaveLength(1);
    expect(source).toContain("createPageMetadata");
  });
});

describe("public content safeguards", () => {
  it("keeps legal pages complete but never fabricates the owner's real identity data", () => {
    expect(Object.keys(legalPages)).toEqual([
      "aviso-legal",
      "privacidad",
      "cookies",
      "condiciones-de-compra",
      "politica-de-cancelacion",
      "politica-de-suscripcion",
      "informacion-alergenos",
    ]);
    // Cada página debe tener contenido real (nunca un array vacío ni solo
    // encabezados de sección sin texto): el "Documento no definitivo" de
    // fases anteriores quedó retirado en la Fase 16 salvo por el bloque de
    // titularidad, que sigue pendiente porque el negocio todavía no ha
    // proporcionado sus datos reales (nombre legal, NIF/CIF, domicilio).
    for (const page of Object.values(legalPages)) {
      expect(page.content.length).toBeGreaterThan(0);
      for (const block of page.content) {
        const text = "paragraphs" in block ? block.paragraphs.join(" ") : block.note;
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
    // Ningún bloque debe contener un NIF/CIF con forma de identificador real
    // (dígitos + letra de control, u orden inverso) ni un código postal de 5
    // dígitos: si algún día se fabrica un dato de identidad falso aquí, este
    // test debe fallar.
    const fakeIdPattern = /\b\d{8}[A-Z]\b|\b[A-Z]\d{7}[A-Z0-9]\b|\b\d{5}\b/;
    for (const page of Object.values(legalPages)) {
      for (const block of page.content) {
        const text = "paragraphs" in block ? block.paragraphs.join(" ") : block.note;
        expect(text).not.toMatch(fakeIdPattern);
      }
    }
  });

  it("keeps the homepage editorial free of reservation controls, while the catalogue allows a quick add to cart", () => {
    const home = readFileSync(resolve(projectRoot, "src/app/(public)/page.tsx"), "utf8");
    const heroCarousel = readFileSync(resolve(projectRoot, "src/components/public/hero-carousel.tsx"), "utf8");
    const catalogCard = readFileSync(resolve(projectRoot, "src/components/public/catalog-product-card.tsx"), "utf8");
    const editorial = readFileSync(resolve(projectRoot, "src/components/public/editorial.tsx"), "utf8");
    expect((home + heroCarousel).match(/<h1[ >]/g)).toHaveLength(1);
    expect(editorial).not.toContain("useCart");
    // El catálogo (/pan) pasó a permitir añadir a la cesta directamente desde
    // la tarjeta (a pedido explícito del usuario), a diferencia de la
    // restricción original de esta fase que lo mantenía solo informativo.
    expect(catalogCard).toContain("useCart");
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
