import Link from "next/link";
import { redirect } from "next/navigation";

import { Container, Section } from "@/components/ui";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SubscriptionConfirmation({ searchParams }: { searchParams: Promise<{ subscription?: string }> }) {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/cuenta/acceder?next=/cuenta/plan-de-pan");
  const { subscription } = await searchParams;
  const db: any = await createClient();
  const { data } = subscription ? await db.from("subscriptions").select("id,status").eq("id", subscription).eq("customer_id", identity.user.id).maybeSingle() : { data: null };

  return <main id="main-content"><Section><Container>
    <h1>{data?.status === "active" ? "Tu Fuerza Habitual está activo" : "Estamos confirmando tu Fuerza Habitual"}</h1>
    <p>{data?.status === "active" ? "El pago ha sido confirmado y tu capacidad está reservada." : "El retorno del navegador no activa la subscripción. Stripe y nuestro webhook todavía pueden estar procesando el pago."}</p>
    <Link className="button button--primary" href={data?.id ? `/cuenta/plan-de-pan/${data.id}` : "/cuenta/plan-de-pan"}>Ver el estado en mi cuenta</Link>
  </Container></Section></main>;
}
