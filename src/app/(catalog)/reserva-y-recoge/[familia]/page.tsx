import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/layout";
import { CatalogProductCard } from "@/components/public/catalog-product-card";
import { OrderSummarySidebar } from "@/components/catalog/order-summary-sidebar";
import { getPublicCatalog } from "@/lib/catalog";
import { getQuickAddProducts } from "@/lib/catalog-quick-add";
import { earliestBookableIsoDate, operationalToday } from "@/lib/order-cutoff";
import { getCutoffConfig } from "@/lib/order-cutoff-server";
import { getPublicPickupPoints } from "@/lib/pickup-points";
import { PICKUP_DATE_COOKIE, PICKUP_POINT_COOKIE } from "@/lib/pickup-selection";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ familia: string }> }): Promise<Metadata> {
  const { familia } = await params;
  const catalog = await getPublicCatalog();
  const family = catalog.find((p) => p.family?.slug === familia)?.family;
  if (!family) return {};
  return createPageMetadata({ title: family.name, description: `Productos de ${family.name} disponibles para reservar y recoger.`, path: `/reserva-y-recoge/${family.slug}` });
}

export default async function CategoriaPage({ params }: { params: Promise<{ familia: string }> }) {
  const { familia } = await params;
  const [catalog, cutoffConfig, { points }, cookieStore] = await Promise.all([
    getPublicCatalog(),
    getCutoffConfig(),
    getPublicPickupPoints(),
    cookies(),
  ]);
  const products = catalog.filter((p) => p.family?.slug === familia);
  if (!products.length) notFound();
  const family = products[0].family!;

  const minDateIso = earliestBookableIsoDate(cutoffConfig) ?? operationalToday();
  const dateCookie = cookieStore.get(PICKUP_DATE_COOKIE)?.value;
  const collectionDate = dateCookie && dateCookie >= minDateIso ? dateCookie : minDateIso;
  const activePoints = points.filter((point) => point.status === "active");
  const pointCookie = cookieStore.get(PICKUP_POINT_COOKIE)?.value;
  const pickupPointId = (pointCookie && activePoints.some((p) => p.id === pointCookie) ? pointCookie : activePoints[0]?.id) ?? null;

  const cards = await getQuickAddProducts(products, pickupPointId, collectionDate);

  return (
    <main id="main-content" className="catalog-layout">
      <div className="catalog-layout__main">
        <Container>
          <h1>{family.name}</h1>
          {family.description ? <p>{family.description}</p> : null}
          <div className="category-product-grid">
            {cards.map(({ product, imagePath, priceCents, availability, maxQuantity, variant }) => (
              <CatalogProductCard
                key={product.id}
                href={`/reserva-y-recoge/${familia}/${product.slug}`}
                name={product.name}
                description={product.short_description}
                imagePath={imagePath}
                priceCents={priceCents}
                isSeasonal={product.status === "seasonal"}
                availability={availability}
                maxQuantity={maxQuantity}
                variant={variant}
              />
            ))}
          </div>
        </Container>
      </div>
      <OrderSummarySidebar cutoffConfig={cutoffConfig} />
    </main>
  );
}
