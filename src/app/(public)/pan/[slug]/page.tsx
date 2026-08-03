import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { Badge, Container, Section } from "@/components/ui";
import { formatPrice, getPublicProduct } from "@/lib/catalog";
import { createPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

const weekday = ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getPublicProduct((await params).slug);
  if (!product) return {};
  return createPageMetadata({ title: product.seo_title ?? product.name, description: product.seo_description ?? product.short_description ?? "Pan de masa madre FUERZA.", path: `/pan/${product.slug}` });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getPublicProduct((await params).slug);
  if (!product) notFound();
  const db = await createClient();
  const [{ data: ingredientLinks }, { data: ingredients }, { data: allergenLinks }, { data: allergens }, { data: days }] = await Promise.all([
    db.from("product_ingredients").select("*").eq("product_id", product.id).order("display_order"),
    db.from("ingredients").select("*"),
    db.from("product_allergens").select("*").eq("product_id", product.id),
    db.from("allergens").select("*"),
    db.from("product_production_weekdays").select("*").eq("product_id", product.id).eq("is_active", true),
  ]);
  const ingredientNames = (ingredientLinks ?? []).map((link) => (ingredients ?? []).find((item) => item.id === link.ingredient_id)?.name).filter(Boolean);
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.short_description, category: product.family?.name, image: product.images.map((image) => `/api/product-images/${image.storage_path}`) };
  return <main id="main-content"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/><section className="product-hero"><Container size="wide"><Breadcrumbs items={[{ label: "Pan", href: "/pan" }, { label: product.name }]}/><div className="product-detail-grid"><div className="product-gallery">{product.images.length ? product.images.map((image) => <Image key={image.id} src={`/api/product-images/${image.storage_path}`} alt={image.alt_text ?? ""} width={800} height={600}/>) : <div className="catalog-image-empty"/>}</div><div><p className="eyebrow">{product.family?.name}</p><h1>{product.name}</h1>{product.status === "seasonal" ? <Badge variant="information">De temporada</Badge> : null}<p>{product.long_description ?? product.short_description}</p>{product.flour_type ? <p><strong>Harina:</strong> {product.flour_type}</p> : null}{product.flour_origin ? <p><strong>Origen:</strong> {product.flour_origin}</p> : null}{product.fermentation_hours ? <p><strong>Fermentación:</strong> {product.fermentation_hours} horas</p> : null}<h2>Variantes</h2>{product.variants.map((variant) => <p key={variant.id}><strong>{variant.name}</strong>{variant.approximate_weight_grams ? ` · aprox. ${variant.approximate_weight_grams} g` : ""}{variant.price_cents !== null ? ` · ${formatPrice(variant.price_cents)}` : ""}<br/><small>IVA incluido</small></p>)}<Link className="button button--primary" href="/reserva-y-recoge">Ver cómo reservar</Link></div></div></Container></section><Section tone="sunken"><Container size="wide" className="product-information"><div><h2>Ingredientes</h2><p>{ingredientNames.length ? ingredientNames.join(", ") : "Información pendiente de completar por el obrador."}</p></div><div><h2>Alérgenos</h2>{(allergenLinks ?? []).length ? (allergenLinks ?? []).map((link) => <p key={`${link.allergen_id}-${link.presence_type}`}><strong>{link.presence_type === "contains" ? "Contiene" : "Puede contener"}:</strong> {(allergens ?? []).find((item) => item.id === link.allergen_id)?.name}</p>) : <p>Sin información publicada.</p>}</div><div><h2>Días habituales</h2><p>{(days ?? []).length ? (days ?? []).map((day) => weekday[day.weekday]).join(", ") : "Consulta próximamente los días de producción."}</p></div></Container></Section></main>;
}
