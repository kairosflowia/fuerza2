import { notFound, redirect } from "next/navigation";
import { SubscriptionActions } from "@/components/subscriptions/customer-actions";
import { Container, Section } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";
import { FREQUENCY_LABELS_ES, type SubscriptionFrequency } from "@/lib/subscriptions-domain";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerSubscription({ params }: { params: Promise<{ id: string }> }) {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/cuenta/acceder");
  const { id } = await params;
  const db: any = await createClient();
  const { data: s } = await db
    .from("subscriptions")
    .select("*,pickup_points(name),subscription_items(*),subscription_cycles(*)")
    .eq("id", id)
    .eq("customer_id", identity.user.id)
    .maybeSingle();
  if (!s) notFound();

  const nextCycle = s.subscription_cycles
    ?.filter((c: any) => ["planned", "capacity_reserved", "invoiced"].includes(c.status))
    .sort((a: any, b: any) => a.collection_date.localeCompare(b.collection_date))[0];

  return (
    <main id="main-content">
      <Section>
        <Container>
          <h1>Fuerza Habitual</h1>
          <p>Estado: {s.status}</p>
          <p>
            {FREQUENCY_LABELS_ES[s.frequency as SubscriptionFrequency] ?? s.frequency} · {s.pickup_points?.name} · próxima recogida:{" "}
            {nextCycle?.collection_date ?? s.next_collection_date ?? "pendiente"}
          </p>
          <ul>
            {s.subscription_items?.map((i: any) => (
              <li key={i.id}>
                {i.quantity} × {i.product_name_snapshot} · {i.variant_name_snapshot}
              </li>
            ))}
          </ul>
          <p>
            Subtotal {formatPrice(s.subtotal_cents)}
            {s.discount_percent > 0 ? ` · ${s.discount_percent}% de descuento` : ""} · Total por ciclo {formatPrice(s.total_cents)}
          </p>
          <SubscriptionActions id={id} status={s.status} />
        </Container>
      </Section>
    </main>
  );
}
