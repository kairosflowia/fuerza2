import type { Metadata } from "next";

import { PlanOnboarding, type OnboardingPoint, type OnboardingProduct } from "@/components/subscriptions/plan-onboarding";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createPageMetadata } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionFrequency } from "@/lib/subscriptions-domain";

export const metadata: Metadata = createPageMetadata({
  title: "Crea tu Plan de Pan",
  description: "Elige tus panes, tu ritmo y dónde recogerlos. Nosotros los reservamos cada semana.",
  path: "/plan-de-pan/membresias",
});

export const dynamic = "force-dynamic";

const VALID_FREQUENCIES: SubscriptionFrequency[] = ["weekly", "biweekly", "every_3_weeks", "monthly"];

/**
 * Configurador del Plan de Pan. Se puede recorrer sin cuenta; el inicio de
 * sesión se pide solo al continuar al pago. Disponibilidad, precio y fechas
 * definitivos los calcula siempre la base de datos (quote/create).
 */
export default async function MembresiasPage({ searchParams }: { searchParams: Promise<{ frecuencia?: string }> }) {
  const [identity, { frecuencia }] = await Promise.all([getCurrentIdentity(), searchParams]);
  const initialFrequency = VALID_FREQUENCIES.find((f) => f === frecuencia);

  const db: any = await createClient();
  const [{ data: variants }, { data: products }, { data: images }, { data: weekdays }, { data: points }, { data: windows }, { data: accepted }] = await Promise.all([
    db.from("product_variants").select("id,name,price_cents,product_id").eq("status", "active").eq("subscribable", true).not("price_cents", "is", null),
    db.from("products").select("id,name,short_description").in("status", ["active", "seasonal"]),
    db.from("product_images").select("product_id,storage_path,is_primary,display_order").order("display_order"),
    db.from("product_production_weekdays").select("product_id,weekday").eq("is_active", true),
    db.from("pickup_points_public").select("id,name,address_line_1,city,is_main_bakery,display_order").eq("status", "active").order("display_order"),
    db.from("pickup_point_collection_windows_public").select("pickup_point_id,weekday,starts_at,ends_at"),
    db.from("product_pickup_points").select("product_id,pickup_point_id"),
  ]);
  // accepts_all_products no está en la vista pública y la tabla no es legible sin sesión: se lee en el
  // servidor solo esa columna (no sensible) para filtrar puntos compatibles.
  const { data: acceptsAll } = await (createAdminClient() as any).from("pickup_points").select("id,accepts_all_products").in("id", (points ?? []).map((p: any) => p.id));

  const productList: OnboardingProduct[] = (variants ?? []).flatMap((v: any) => {
    const product = (products ?? []).find((p: any) => p.id === v.product_id);
    if (!product) return [];
    const forProduct = (images ?? []).filter((i: any) => i.product_id === v.product_id);
    return [{
      variantId: v.id,
      productId: v.product_id,
      name: v.name === "Única" ? product.name : `${product.name} — ${v.name}`,
      description: product.short_description ?? null,
      priceCents: v.price_cents,
      imagePath: forProduct.find((i: any) => i.is_primary)?.storage_path ?? forProduct[0]?.storage_path ?? null,
      productionWeekdays: (weekdays ?? []).filter((w: any) => w.product_id === v.product_id).map((w: any) => w.weekday),
    }];
  }).sort((a: OnboardingProduct, b: OnboardingProduct) => a.name.localeCompare(b.name, "es"));

  const pointList: OnboardingPoint[] = (points ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    address: [p.address_line_1, p.city].filter(Boolean).join(", ") || null,
    acceptsAllProducts: Boolean((acceptsAll ?? []).find((a: any) => a.id === p.id)?.accepts_all_products),
    acceptedProductIds: (accepted ?? []).filter((a: any) => a.pickup_point_id === p.id).map((a: any) => a.product_id),
    windows: (windows ?? []).filter((w: any) => w.pickup_point_id === p.id).map((w: any) => ({ weekday: w.weekday, startsAt: w.starts_at, endsAt: w.ends_at })),
  }));

  return (
    <main id="main-content" className="fz-onboarding-page">
      <PlanOnboarding products={productList} points={pointList} initialFrequency={initialFrequency} isLoggedIn={Boolean(identity)} />
    </main>
  );
}
