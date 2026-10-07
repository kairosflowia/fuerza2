import type { Metadata } from "next";
import { cookies } from "next/headers";

import { PickupPointProvider } from "@/components/catalog/pickup-point-provider";
import { CatalogProductCard } from "@/components/public/catalog-product-card";
import { EditorialHero } from "@/components/public/home/editorial-hero";
import { HomeSteps } from "@/components/public/home/home-steps";
import { PickupPlanner, type PlannerPoint } from "@/components/public/home/pickup-planner";
import { PlanDePanTeaser } from "@/components/public/home/plan-de-pan-teaser";
import { ProductGrid } from "@/components/public/product-grid";
import { getPublicCatalog } from "@/lib/catalog";
import { getQuickAddProducts } from "@/lib/catalog-quick-add";
import { earliestBookableIsoDate, operationalToday } from "@/lib/order-cutoff";
import { getCutoffConfig } from "@/lib/order-cutoff-server";
import { directionsUrl, getPublicPickupPoints } from "@/lib/pickup-points";
import { PICKUP_DATE_COOKIE, PICKUP_POINT_COOKIE } from "@/lib/pickup-selection";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Pan de masa madre en Asturias",
  description: "Obrador de masa madre en Asturias. Harinas locales, fermentación lenta y cantidad limitada cada día. Reserva tu pan y recógelo cuando te venga bien.",
  path: "/",
  ogTitle: "FUERZA — Obrador de masa madre en Asturias",
  ogDescription: "Reservas el pan antes de que lo horneemos. Nosotros hacemos exactamente el que hace falta.",
});

export default async function Home() {
  const [catalog, { points, closures }, cutoffConfig, cookieStore] = await Promise.all([
    getPublicCatalog(),
    getPublicPickupPoints(),
    getCutoffConfig(),
    cookies(),
  ]);

  // Misma resolución de punto y fecha que el layout de /reserva-y-recoge: ambos leen y escriben las mismas cookies.
  const activePoints = points.filter((point) => point.status === "active");
  const minDate = earliestBookableIsoDate(cutoffConfig) ?? operationalToday();
  const pointCookie = cookieStore.get(PICKUP_POINT_COOKIE)?.value;
  const dateCookie = cookieStore.get(PICKUP_DATE_COOKIE)?.value;
  const pickupPointId = (pointCookie && activePoints.some((p) => p.id === pointCookie) ? pointCookie : activePoints[0]?.id) ?? null;
  const collectionDate = dateCookie && dateCookie >= minDate ? dateCookie : minDate;

  const plannerPoints: PlannerPoint[] = activePoints.map((point) => ({
    id: point.id,
    name: point.name,
    isMain: point.is_main_bakery,
    address: [point.address_line_1, point.city].filter(Boolean).join(", ") || null,
    mapUrl: directionsUrl(point),
    windows: point.collectionWindows.map((w) => ({ weekday: w.weekday, startsAt: w.starts_at, endsAt: w.ends_at })),
    exception: point.upcomingException
      ? {
          date: point.upcomingException.exception_date,
          type: point.upcomingException.type,
          startsAt: point.upcomingException.collection_starts_at,
          endsAt: point.upcomingException.collection_ends_at,
        }
      : null,
  }));

  const dailyBreads = catalog.filter((p) => p.family?.slug === "panes-diarios").slice(0, 4);
  const cards = await getQuickAddProducts(dailyBreads, pickupPointId, collectionDate);

  return (
    <main id="main-content">
      <EditorialHero
        eyebrow="Reserva y recoge"
        title={<>Tu pan<br />te espera.</>}
        lead="Haz tu pedido online y recógelo en nuestro obrador o en puntos seleccionados. Pan recién hecho, sin esperas."
        cta={{ label: "Haz tu pedido", href: "/reserva-y-recoge" }}
        image={{ src: "/images/home/hero-pan-rustico-madera.jpg", alt: "Pan rústico de masa madre sobre un paño de lino en una mesa de madera oscura" }}
      />

      <HomeSteps />

      <div className="fz-container">

        <PickupPointProvider
          points={activePoints.map((point) => ({ id: point.id, name: point.name }))}
          initialPointId={pickupPointId ?? ""}
          initialDate={collectionDate}
          minDate={minDate}
        >
          {plannerPoints.length ? (
            <PickupPlanner details={plannerPoints} closures={closures.map((c) => ({ startsOn: c.starts_on, endsOn: c.ends_on }))} />
          ) : null}

          {cards.length ? (
            <ProductGrid title="Nuestros panes" link={{ label: "Ver todos los panes", href: "/reserva-y-recoge" }}>
              {cards.map(({ product, imagePath, priceCents, availability, maxQuantity, variant }, index) => (
                <CatalogProductCard
                  key={product.id}
                  href={`/reserva-y-recoge/${product.family?.slug}/${product.slug}`}
                  name={product.name}
                  description={product.short_description}
                  imagePath={imagePath}
                  priceCents={priceCents}
                  availability={availability}
                  maxQuantity={maxQuantity}
                  variant={variant}
                  priority={index < 2}
                />
              ))}
            </ProductGrid>
          ) : null}
        </PickupPointProvider>

        <PlanDePanTeaser />
      </div>
    </main>
  );
}
