import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/public/page-intro";
import { Card, Container, EmptyState, Section } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;
export const metadata: Metadata = createPageMetadata({
  title: "Plan de Pan",
  description: "Suscripción recurrente de pan FUERZA con capacidad reservada.",
  path: "/plan-de-pan",
});

export default async function Plans() {
  const db: any = await createClient();
  const { data: plans } = await db
    .from("subscription_plans")
    .select("id,name,slug,description,billing_interval,billing_interval_count,price_cents,currency,subscription_plan_items(quantity,product_variants(name,products(name)))")
    .eq("status", "active")
    .eq("is_public", true)
    .order("display_order");

  return <main id="main-content"><Section><Container>
    <PageIntro title="Plan de Pan" eyebrow="Una plaza reservada" description="Tu pan previsto y pagado de forma recurrente. Cada plaza se abre únicamente cuando podemos reservar producción y recogida." />
    {plans?.length ? <div className="editorial-grid">{plans.map((plan: any) => <Card key={plan.id}>
      <h2>{plan.name}</h2><p>{plan.description}</p>
      <p>{plan.billing_interval === "weekly" ? "Semanal" : plan.billing_interval === "biweekly" ? "Quincenal" : "Mensual"} · {(plan.price_cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
      <ul>{plan.subscription_plan_items?.map((item: any) => <li key={item.product_variants?.name}>{item.quantity} × {item.product_variants?.products?.name} · {item.product_variants?.name}</li>)}</ul>
      <Link className="button button--primary" href={`/plan-de-pan/${plan.slug}`}>Elegir este plan</Link>
    </Card>)}</div> : <EmptyState title="Todavía no hay planes disponibles" description="Abriremos el Plan de Pan cuando existan opciones reales y capacidad reservada." />}
  </Container></Section></main>;
}
