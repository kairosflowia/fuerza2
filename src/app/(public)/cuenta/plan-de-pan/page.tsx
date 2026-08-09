import Link from "next/link";
import { redirect } from "next/navigation";
import { Container, EmptyState, Section } from "@/components/ui";
import { FREQUENCY_LABELS_ES, type SubscriptionFrequency } from "@/lib/subscriptions-domain";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerSubscriptions() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/cuenta/acceder?next=/cuenta/plan-de-pan");
  const db: any = await createClient();
  const { data: list } = await db
    .from("subscriptions")
    .select("id,status,frequency,next_collection_date,total_cents,pickup_points(name)")
    .eq("customer_id", identity.user.id)
    .order("created_at", { ascending: false });

  return (
    <main id="main-content">
      <Section>
        <Container>
          <h1>Fuerza Habitual</h1>
          {list?.length ? (
            <ul>
              {list.map((s: any) => (
                <li key={s.id}>
                  <Link href={`/cuenta/plan-de-pan/${s.id}`}>
                    {FREQUENCY_LABELS_ES[s.frequency as SubscriptionFrequency] ?? s.frequency} · {s.pickup_points?.name}
                  </Link>{" "}
                  · {s.status} · próxima recogida {s.next_collection_date ?? "pendiente"}
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
