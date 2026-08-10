import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AllergenBadge } from "@/components/public/allergen-icon";
import { AvailabilityChecker } from "@/components/public/availability-checker";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ProductAddToCart } from "@/components/public/product-add-to-cart";
import { Badge, Container, Section } from "@/components/ui";
import { CalendarIcon, ClockIcon, PinIcon, WheatIcon } from "@/components/ui/icons";
import { getPublicProduct } from "@/lib/catalog";
import { createPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

const weekday = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getPublicProduct((await params).slug);
  if (!product) return {};
  return createPageMetadata({ title: product.seo_title ?? product.name, description: product.seo_description ?? product.short_description ?? "Pan de masa madre FUERZA.", path: `/pan/${product.slug}` });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getPublicProduct((await params).slug);
  if (!product) notFound();
  const db = await createClient();
  const [{ data: ingredientLinks }, { data: ingredients }, { data: allergenLinks }, { data: allergens }, { data: days }, { data: pickupPoints }] = await Promise.all([
    db.from("product_ingredients").select("*").eq("product_id", product.id).order("display_order"),
    db.from("ingredients").select("*"),
    db.from("product_allergens").select("*").eq("product_id", product.id),
    db.from("allergens").select("*").order("display_order"),
    db.from("product_production_weekdays").select("*").eq("product_id", product.id).eq("is_active", true),
    db.from("pickup_points_public").select("id, name").order("display_order"),
  ]);
  const ingredientNames = (ingredientLinks ?? []).map((link) => (ingredients ?? []).find((item) => item.id === link.ingredient_id)?.name).filter(Boolean);
  const primaryImage = product.images.find((image) => image.is_primary) ?? product.images[0];
  const activeVariants = product.variants.filter((v) => v.price_cents !== null);
  const days_ = (days ?? []).map((day) => weekday[day.weekday]);
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.short_description, category: product.family?.name, image: product.images.map((image) => `/api/product-images/${image.storage_path}`) };

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="product-hero">
        <Container size="wide">
          <Breadcrumbs items={[{ label: "Pan", href: "/pan" }, { label: product.name }]} />
          <div className="product-detail-grid">
            <div className="product-gallery">
              {product.images.length ? (
                product.images.map((image) => <Image key={image.id} src={`/api/product-images/${image.storage_path}`} alt={image.alt_text ?? ""} width={800} height={600} priority />)
              ) : (
                <div className="catalog-image-empty" aria-hidden="true" />
              )}
            </div>
            <div className="product-detail-info">
              <p className="eyebrow">{product.family?.name}</p>
              <h1>{product.name}</h1>
              {product.status === "seasonal" ? <Badge variant="information">De temporada</Badge> : null}
              <p className="product-detail-info__lead">{product.long_description ?? product.short_description}</p>

              {activeVariants.length ? (
                <ProductAddToCart
                  productName={product.name}
                  variants={activeVariants.map((v) => ({ id: v.id, name: v.name, priceCents: v.price_cents!, stockTracking: v.stock_tracking, stockQuantity: v.stock_quantity }))}
                  image={primaryImage?.storage_path}
                />
              ) : (
                <p>Este producto no tiene ninguna variante disponible ahora mismo.</p>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Section tone="sunken">
        <Container size="wide">
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

      <Section>
        <Container size="wide">
          <h2>Ingredientes</h2>
          <p className="product-detail-text">{ingredientNames.length ? ingredientNames.join(", ") : "Información pendiente de completar por el obrador."}</p>
        </Container>
      </Section>

      <Section tone="sunken">
        <Container size="wide">
          <h2>Alérgenos</h2>
          {(allergenLinks ?? []).length ? (
            <div className="allergen-row">
              {(allergenLinks ?? []).map((link) => {
                const allergen = (allergens ?? []).find((item) => item.id === link.allergen_id);
                if (!allergen) return null;
                return <AllergenBadge key={`${link.allergen_id}-${link.presence_type}`} code={allergen.code} name={link.presence_type === "contains" ? allergen.name : `${allergen.name} (trazas)`} />;
              })}
            </div>
          ) : (
            <p className="product-detail-text">Sin información publicada.</p>
          )}
        </Container>
      </Section>

      <Section>
        <Container size="wide">
          <h2>Disponibilidad</h2>
          <p>Comprueba si este pan está disponible para un día y un punto de recogida concretos antes de añadirlo a la cesta.</p>
          {activeVariants.length && (pickupPoints ?? []).length ? (
            <AvailabilityChecker variants={activeVariants.map((v) => ({ id: v.id, name: v.name, priceCents: v.price_cents ?? 0 }))} points={pickupPoints ?? []} image={primaryImage?.storage_path} />
          ) : (
            <p>Todavía no hay puntos de recogida publicados para consultar disponibilidad.</p>
          )}
        </Container>
      </Section>
    </main>
  );
}
