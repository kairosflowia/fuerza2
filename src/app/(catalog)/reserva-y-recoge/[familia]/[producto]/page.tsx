import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AllergenBadge } from "@/components/public/allergen-icon";
import { ProductOrderForm } from "@/components/public/product-order-form";
import { Container, Section } from "@/components/ui/layout";
import { formatPrice, getPublicProduct } from "@/lib/catalog";
import { createPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ familia: string; producto: string }> }): Promise<Metadata> {
  const product = await getPublicProduct((await params).producto);
  if (!product) return {};
  return createPageMetadata({ title: product.name, description: product.short_description ?? `${product.name} — reserva y recoge en FUERZA.`, path: `/reserva-y-recoge/${(await params).familia}/${product.slug}` });
}

export default async function ProductoPage({ params }: { params: Promise<{ familia: string; producto: string }> }) {
  const { familia, producto } = await params;
  const product = await getPublicProduct(producto);
  if (!product || product.family?.slug !== familia) notFound();

  const db = await createClient();
  const [{ data: allergenLinks }, { data: allergens }] = await Promise.all([
    db.from("product_allergens").select("*").eq("product_id", product.id),
    db.from("allergens").select("*").order("display_order"),
  ]);

  const image = product.images.find((i) => i.is_primary) ?? product.images[0];
  const activeVariants = product.variants.filter((v) => v.status === "active" && v.price_cents !== null);
  const prices = activeVariants.flatMap((v) => (v.price_cents === null ? [] : [v.price_cents]));

  return (
    <main id="main-content">
      <Section>
        <Container>
          <div className="product-order-grid">
            <figure className="product-order-figure">
              {image ? <Image src={`/api/product-images/${image.storage_path}`} alt={image.alt_text ?? ""} width={800} height={600} priority /> : <div className="catalog-image-empty" aria-hidden="true" />}
            </figure>
            <div className="product-order-info">
              <div className="product-order-info__header">
                <h1>{product.name}</h1>
                {prices.length ? <strong className="product-order-info__price">{formatPrice(Math.min(...prices))}</strong> : null}
              </div>

              {product.short_description ? (
                <div>
                  <h2>Descripción</h2>
                  <p>{product.short_description}</p>
                </div>
              ) : null}

              {(allergenLinks ?? []).length ? (
                <div>
                  <h2>Alérgenos</h2>
                  <div className="allergen-row">
                    {(allergenLinks ?? []).map((link) => {
                      const allergen = (allergens ?? []).find((a) => a.id === link.allergen_id);
                      if (!allergen) return null;
                      return <AllergenBadge key={allergen.id} code={allergen.code} name={allergen.name} />;
                    })}
                  </div>
                </div>
              ) : null}

              {activeVariants.length ? (
                <ProductOrderForm
                  productName={product.name}
                  variants={activeVariants.map((v) => ({ id: v.id, name: v.name, priceCents: v.price_cents!, stockTracking: v.stock_tracking, stockQuantity: v.stock_quantity }))}
                  image={image?.storage_path}
                />
              ) : (
                <p>Este producto no tiene ninguna variante disponible ahora mismo.</p>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
