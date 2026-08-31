import { notFound, redirect } from "next/navigation";

import { SubscriptionActions } from "@/components/subscriptions/customer-actions";
import { Badge, Card, Container, Section } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";
import { formatDateEs } from "@/lib/order-cutoff";
import { FREQUENCY_LABELS_ES, SUBSCRIPTION_STATUS_BADGE_VARIANT, subscriptionStatusLabel, type SubscriptionFrequency } from "@/lib/subscriptions-domain";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerSubscription({ params }: { params: Promise<{ id: string }> }) {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/cuenta/acceder");
  const { id } = await params;
  const db: any = await createClient();
  const { data: s } = await db
    .from("subscriptions")
    .select("*,pickup_point_id,subscription_items(*),subscription_cycles(*)")
    .eq("id", id)
    .eq("customer_id", identity.user.id)
    .maybeSingle();
  if (!s) notFound();

  const { data: pickupPoint } = s.pickup_point_id ? await db.from("pickup_points_public").select("name").eq("id", s.pickup_point_id).maybeSingle() : { data: null };

  const nextCycle = s.subscription_cycles
    ?.filter((c: any) => ["planned", "capacity_reserved", "invoiced"].includes(c.status))
    .sort((a: any, b: any) => a.collection_date.localeCompare(b.collection_date))[0];
  const nextDate = nextCycle?.collection_date ?? s.next_collection_date;

  return (
    <main id="main-content">
      <Section>
        <Container>
          <div className="admin-action-group">
            <h1>Fuerza Habitual</h1>
            <Badge variant={SUBSCRIPTION_STATUS_BADGE_VARIANT[s.status] ?? "neutral"}>{subscriptionStatusLabel(s.status)}</Badge>
          </div>
          <p>
            {FREQUENCY_LABELS_ES[s.frequency as SubscriptionFrequency] ?? s.frequency} · {pickupPoint?.name ?? "Punto de recogida"}
            {" · próxima recogida: "}
            {nextDate ? formatDateEs(nextDate) : "pendiente"}
          </p>
          <Card>
            <h2>Cesta</h2>
            {s.subscription_items?.map((i: any) => (
              <p key={i.id}>{i.quantity} × {i.product_name_snapshot} · {i.variant_name_snapshot}</p>
            ))}
            <p>
              Subtotal {formatPrice(s.subtotal_cents)}
              {s.discount_percent > 0 ? ` · ${s.discount_percent}% de descuento` : ""} · Total por ciclo {formatPrice(s.total_cents)}
            </p>
          </Card>
          <SubscriptionActions id={id} status={s.status} />
        </Container>
      </Section>
    </main>
  );
}
