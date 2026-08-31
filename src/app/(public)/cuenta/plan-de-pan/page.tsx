import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, Container, EmptyState, Section } from "@/components/ui";
import { formatDateEs } from "@/lib/order-cutoff";
import { FREQUENCY_LABELS_ES, SUBSCRIPTION_STATUS_BADGE_VARIANT, subscriptionStatusLabel, type SubscriptionFrequency } from "@/lib/subscriptions-domain";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerSubscriptions() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/cuenta/acceder?next=/cuenta/plan-de-pan");
  const db: any = await createClient();
  const { data: list } = await db
    .from("subscriptions")
    .select("id,status,frequency,next_collection_date,total_cents,pickup_point_id")
    .eq("customer_id", identity.user.id)
    .order("created_at", { ascending: false });

  const pickupPointIds = [...new Set((list ?? []).map((s: any) => s.pickup_point_id).filter(Boolean))];
  const { data: pickupPointRows } = pickupPointIds.length
    ? await db.from("pickup_points_public").select("id,name").in("id", pickupPointIds)
    : { data: [] };
  const pickupPointName = (id: string | null) => (pickupPointRows ?? []).find((p: any) => p.id === id)?.name ?? null;

  return (
    <main id="main-content">
      <Section>
        <Container>
          <h1>Fuerza Habitual</h1>
          {list?.length ? (
            <ul className="account-list">
              {list.map((s: any) => (
                <li key={s.id}>
                  <span>
                    <Link href={`/cuenta/plan-de-pan/${s.id}`}><strong>{FREQUENCY_LABELS_ES[s.frequency as SubscriptionFrequency] ?? s.frequency}</strong></Link>
                    {" · "}{pickupPointName(s.pickup_point_id) ?? "Punto de recogida"}
                    {" · próxima recogida "}{s.next_collection_date ? formatDateEs(s.next_collection_date) : "pendiente"}
                  </span>
                  <span className="account-list__meta">
                    <Badge variant={SUBSCRIPTION_STATUS_BADGE_VARIANT[s.status] ?? "neutral"}>{subscriptionStatusLabel(s.status)}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Todavía no tienes Fuerza Habitual" description="Elige tu pan y tu frecuencia para no tener que pedir cada vez." />
          )}
          <Link className="button button--primary" href="/plan-de-pan/membresias">
            {list?.length ? "Añadir otra membresía" : "Ver membresías"}
          </Link>
        </Container>
      </Section>
    </main>
  );
}
