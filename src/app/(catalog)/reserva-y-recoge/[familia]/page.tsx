import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/layout";
import { CatalogProductCard } from "@/components/public/catalog-product-card";
import { OrderSummarySidebar } from "@/components/catalog/order-summary-sidebar";
import { getPublicCatalog } from "@/lib/catalog";
import { productStockState } from "@/lib/catalog-domain";
import { getCutoffConfig } from "@/lib/order-cutoff-server";
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
  const [catalog, cutoffConfig] = await Promise.all([getPublicCatalog(), getCutoffConfig()]);
  const products = catalog.filter((p) => p.family?.slug === familia);
  if (!products.length) notFound();
  const family = products[0].family!;

  return (
    <main id="main-content" className="catalog-layout">
      <div className="catalog-layout__main">
        <Container>
          <h1>{family.name}</h1>
          {family.description ? <p>{family.description}</p> : null}
          <div className="category-product-grid">
            {products.map((product) => {
              const image = product.images.find((i) => i.is_primary) ?? product.images[0];
              const activeVariants = product.variants.filter((v) => v.status === "active" && v.price_cents !== null);
              const cheapest = activeVariants.length ? activeVariants.reduce((min, v) => (v.price_cents! < min.price_cents! ? v : min)) : null;
              const stockState = productStockState(product.variants);
              return (
                <CatalogProductCard
                  key={product.id}
                  href={`/reserva-y-recoge/${familia}/${product.slug}`}
                  name={product.name}
                  imagePath={image?.storage_path ?? null}
                  priceCents={cheapest?.price_cents ?? null}
                  isSeasonal={product.status === "seasonal"}
                  stockState={stockState}
                  variant={cheapest ? { id: cheapest.id, name: cheapest.name, priceCents: cheapest.price_cents!, stockTracking: cheapest.stock_tracking, stockQuantity: cheapest.stock_quantity } : null}
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
