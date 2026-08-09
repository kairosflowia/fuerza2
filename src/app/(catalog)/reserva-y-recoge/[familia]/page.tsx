import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/layout";
import { OrderSummarySidebar } from "@/components/catalog/order-summary-sidebar";
import { formatPrice, getPublicCatalog } from "@/lib/catalog";
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
              const prices = product.variants.flatMap((v) => (v.price_cents === null ? [] : [v.price_cents]));
              const stockState = productStockState(product.variants);
              return (
                <Link key={product.id} href={`/reserva-y-recoge/${familia}/${product.slug}`} className="category-product-card">
                  <Card className="category-product-card__inner">
                    {image ? <Image src={`/api/product-images/${image.storage_path}`} alt={image.alt_text ?? ""} width={400} height={300} /> : <div className="catalog-image-empty" aria-hidden="true" />}
                    <div>
                      <p className="category-product-card__name">{product.name}</p>
                      {product.status === "seasonal" ? <Badge variant="information">De temporada</Badge> : null}
                      {stockState === "out_of_stock" ? <Badge variant="neutral">Agotado</Badge> : null}
                      {stockState === "low_stock" ? <Badge variant="warning">Últimas unidades</Badge> : null}
                      {prices.length ? <p className="category-product-card__price">{formatPrice(Math.min(...prices))}</p> : null}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Container>
      </div>
      <OrderSummarySidebar cutoffConfig={cutoffConfig} />
    </main>
  );
}
