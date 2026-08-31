import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AllergenBadge } from "@/components/public/allergen-icon";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ProductOrderForm } from "@/components/public/product-order-form";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, PinIcon, WheatIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui/layout";
import { getNextAvailableDate, getVariantAvailability } from "@/lib/availability";
import { formatPrice, getPublicProduct } from "@/lib/catalog";
import { earliestBookableDate } from "@/lib/order-cutoff";
import { getCutoffConfig } from "@/lib/order-cutoff-server";
import { getPublicPickupPoints } from "@/lib/pickup-points";
import { PICKUP_DATE_COOKIE, PICKUP_POINT_COOKIE } from "@/lib/pickup-selection";
import { createPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

const weekday = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export async function generateMetadata({ params }: { params: Promise<{ familia: string; producto: string }> }): Promise<Metadata> {
  const product = await getPublicProduct((await params).producto);
  if (!product) return {};
  return createPageMetadata({ title: product.seo_title ?? product.name, description: product.seo_description ?? product.short_description ?? `${product.name} — reserva y recoge en FUERZA.`, path: `/reserva-y-recoge/${(await params).familia}/${product.slug}` });
}

export default async function ProductoPage({ params }: { params: Promise<{ familia: string; producto: string }> }) {
  const { familia, producto } = await params;
  const product = await getPublicProduct(producto);
  if (!product || product.family?.slug !== familia) notFound();

  const db = await createClient();
  const [{ data: ingredientLinks }, { data: ingredients }, { data: allergenLinks }, { data: allergens }, { data: days }, cutoffConfig, { points }, cookieStore] = await Promise.all([
    db.from("product_ingredients").select("*").eq("product_id", product.id).order("display_order"),
    db.from("ingredients").select("*"),
    db.from("product_allergens").select("*").eq("product_id", product.id),
    db.from("allergens").select("*").order("display_order"),
    db.from("product_production_weekdays").select("*").eq("product_id", product.id).eq("is_active", true),
    getCutoffConfig(),
    getPublicPickupPoints(),
    cookies(),
  ]);
  const ingredientNames = (ingredientLinks ?? []).map((link) => (ingredients ?? []).find((item) => item.id === link.ingredient_id)?.name).filter(Boolean);
  const days_ = (days ?? []).map((day) => weekday[day.weekday]);

  const image = product.images.find((i) => i.is_primary) ?? product.images[0];
  const activeVariants = product.variants.filter((v) => v.status === "active" && v.price_cents !== null);
  const prices = activeVariants.flatMap((v) => (v.price_cents === null ? [] : [v.price_cents]));
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.short_description, category: product.family?.name, image: product.images.map((img) => `/api/product-images/${img.storage_path}`) };

  const minDateIso = (earliestBookableDate(cutoffConfig) ?? new Date()).toISOString().slice(0, 10);
  const dateCookie = cookieStore.get(PICKUP_DATE_COOKIE)?.value;
  const collectionDate = dateCookie && dateCookie >= minDateIso ? dateCookie : minDateIso;
  const activePoints = points.filter((point) => point.status === "active");
  const pointCookie = cookieStore.get(PICKUP_POINT_COOKIE)?.value;
  const pickupPointId = (pointCookie && activePoints.some((p) => p.id === pointCookie) ? pointCookie : activePoints[0]?.id) ?? null;

  const availabilityByVariant = pickupPointId
    ? await Promise.all(activeVariants.map(async (v) => {
        const availability = await getVariantAvailability(v.id, pickupPointId, collectionDate);
        const nextAvailableDate = availability?.status === "sold_out" ? await getNextAvailableDate(v.id, pickupPointId, collectionDate) : null;
        return { variantId: v.id, availability, nextAvailableDate };
      }))
    : [];

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Section>
        <Container>
          <Breadcrumbs items={[{ label: "Pan", href: "/reserva-y-recoge" }, { label: product.family?.name ?? "", href: `/reserva-y-recoge/${familia}` }, { label: product.name }]} />
          <div className="product-order-grid">
            <figure className="product-order-figure">
              {image ? <Image src={`/api/product-images/${image.storage_path}`} alt={image.alt_text ?? ""} width={800} height={600} priority /> : <div className="catalog-image-empty" aria-hidden="true" />}
            </figure>
            <div className="product-order-info">
              <div className="product-order-info__header">
                <h1>{product.name}</h1>
                {prices.length ? <strong className="product-order-info__price">Desde {formatPrice(Math.min(...prices))}</strong> : null}
              </div>
              {product.status === "seasonal" ? <Badge variant="information">De temporada</Badge> : null}

              {product.long_description ?? product.short_description ? (
                <div>
                  <h2>Descripción</h2>
                  <p>{product.long_description ?? product.short_description}</p>
                </div>
              ) : null}

              {(allergenLinks ?? []).length ? (
                <div>
                  <h2>Alérgenos</h2>
                  <div className="allergen-row">
                    {(allergenLinks ?? []).map((link) => {
                      const allergen = (allergens ?? []).find((item) => item.id === link.allergen_id);
                      if (!allergen) return null;
                      return <AllergenBadge key={`${link.allergen_id}-${link.presence_type}`} code={allergen.code} name={link.presence_type === "contains" ? allergen.name : `${allergen.name} (trazas)`} />;
                    })}
                  </div>
                </div>
              ) : null}

              {activeVariants.length ? (
                <ProductOrderForm
                  productName={product.name}
                  variants={activeVariants.map((v) => {
                    const entry = availabilityByVariant.find((a) => a.variantId === v.id);
                    return { id: v.id, name: v.name, priceCents: v.price_cents!, availability: entry?.availability ?? null, nextAvailableDate: entry?.nextAvailableDate ?? null };
                  })}
                  image={image?.storage_path}
                />
              ) : (
                <p>Este producto no tiene ninguna variante disponible ahora mismo.</p>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {product.flour_type || product.flour_origin || product.fermentation_hours || days_.length ? (
        <Section tone="sunken">
          <Container>
            <h2>Elaboración</h2>
            <div className="product-facts">
              {product.flour_type ? (
                <div className="product-fact">
                  <span className="product-fact__icon" aria-hidden="true"><WheatIcon /></span>
                  <div><p className="product-fact__label">Harina</p><p className="product-fact__value">{product.flour_type}</p></div>
                </div>
              ) : null}
              {product.flour_origin ? (
                <div className="product-fact">
                  <span className="product-fact__icon" aria-hidden="true"><PinIcon /></span>
                  <div><p className="product-fact__label">Origen</p><p className="product-fact__value">{product.flour_origin}</p></div>
                </div>
              ) : null}
              {product.fermentation_hours ? (
                <div className="product-fact">
                  <span className="product-fact__icon" aria-hidden="true"><ClockIcon /></span>
                  <div><p className="product-fact__label">Fermentación</p><p className="product-fact__value">{product.fermentation_hours} horas</p></div>
                </div>
              ) : null}
              {days_.length ? (
                <div className="product-fact">
                  <span className="product-fact__icon" aria-hidden="true"><CalendarIcon /></span>
                  <div><p className="product-fact__label">Días habituales</p><p className="product-fact__value">{days_.join(", ")}</p></div>
                </div>
              ) : null}
            </div>
          </Container>
        </Section>
      ) : null}

      {ingredientNames.length ? (
        <Section>
          <Container>
            <h2>Ingredientes</h2>
            <p className="product-detail-text">{ingredientNames.join(", ")}</p>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}
