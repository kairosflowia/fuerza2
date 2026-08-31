import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/layout";
import { CatalogProductCard } from "@/components/public/catalog-product-card";
import { OrderSummarySidebar } from "@/components/catalog/order-summary-sidebar";
import { getVariantAvailability, getVariantOrderLimit } from "@/lib/availability";
import { getPublicCatalog } from "@/lib/catalog";
import { earliestBookableDate } from "@/lib/order-cutoff";
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

  const minDate = earliestBookableDate(cutoffConfig) ?? new Date();
  const minDateIso = minDate.toISOString().slice(0, 10);
  const dateCookie = cookieStore.get(PICKUP_DATE_COOKIE)?.value;
  const collectionDate = dateCookie && dateCookie >= minDateIso ? dateCookie : minDateIso;
  const activePoints = points.filter((point) => point.status === "active");
  const pointCookie = cookieStore.get(PICKUP_POINT_COOKIE)?.value;
  const pickupPointId = (pointCookie && activePoints.some((p) => p.id === pointCookie) ? pointCookie : activePoints[0]?.id) ?? null;

  const cheapestByProduct = products.map((product) => {
    const activeVariants = product.variants.filter((v) => v.status === "active" && v.price_cents !== null);
    const cheapest = activeVariants.length ? activeVariants.reduce((min, v) => (v.price_cents! < min.price_cents! ? v : min)) : null;
    return { product, cheapest };
  });

  const [availabilities, orderLimits] = pickupPointId
    ? await Promise.all([
        Promise.all(cheapestByProduct.map(({ cheapest }) => (cheapest ? getVariantAvailability(cheapest.id, pickupPointId, collectionDate) : Promise.resolve(null)))),
        Promise.all(cheapestByProduct.map(({ cheapest }) => (cheapest ? getVariantOrderLimit(cheapest.id, pickupPointId, collectionDate) : Promise.resolve(null)))),
      ])
    : [cheapestByProduct.map(() => null), cheapestByProduct.map(() => null)];

  return (
    <main id="main-content" className="catalog-layout">
      <div className="catalog-layout__main">
        <Container>
          <h1>{family.name}</h1>
          {family.description ? <p>{family.description}</p> : null}
          <div className="category-product-grid">
            {cheapestByProduct.map(({ product, cheapest }, index) => {
              const image = product.images.find((i) => i.is_primary) ?? product.images[0];
              return (
                <CatalogProductCard
                  key={product.id}
                  href={`/reserva-y-recoge/${familia}/${product.slug}`}
                  name={product.name}
                  imagePath={image?.storage_path ?? null}
                  priceCents={cheapest?.price_cents ?? null}
                  isSeasonal={product.status === "seasonal"}
                  availability={availabilities[index]}
                  maxQuantity={orderLimits[index]?.isAvailable ? orderLimits[index]!.maxQuantity : null}
                  variant={cheapest ? { id: cheapest.id, name: cheapest.name, priceCents: cheapest.price_cents! } : null}
                />
              );
            })}
          </div>
        </Container>
      </div>
      <OrderSummarySidebar cutoffConfig={cutoffConfig} />
    </main>
  );
}
