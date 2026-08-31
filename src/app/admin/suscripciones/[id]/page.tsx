import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Card } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";
import { FREQUENCY_LABELS_ES, SUBSCRIPTION_STATUS_BADGE_VARIANT, subscriptionStatusLabel } from "@/lib/subscriptions-domain";
import { createClient } from "@/lib/supabase/server";

const CYCLE_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" | "information" }> = {
  planned: { label: "Planificado", variant: "neutral" },
  capacity_reserved: { label: "Capacidad reservada", variant: "information" },
  invoiced: { label: "Facturado", variant: "information" },
  paid: { label: "Pagado", variant: "success" },
  order_created: { label: "Pedido creado", variant: "success" },
  skipped: { label: "Omitido", variant: "neutral" },
  failed: { label: "Fallido", variant: "error" },
  cancelled: { label: "Cancelado", variant: "neutral" },
};
const CHANGE_TYPE_LABELS_ES: Record<string, string> = {
  pause: "Pausar",
  resume: "Reanudar",
  cancel: "Cancelar",
  change_plan: "Cambio de plan",
  change_pickup_point: "Cambio de punto de recogida",
  change_weekday: "Cambio de día",
};
const CHANGE_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" }> = {
  pending: { label: "Pendiente", variant: "warning" },
  applied: { label: "Aplicado", variant: "success" },
  rejected: { label: "Rechazado", variant: "error" },
  cancelled: { label: "Cancelado", variant: "neutral" },
};

export default async function AdminSubscription({ params }: { params: Promise<{ id: string }> }) {
  const db: any = await createClient();
  const { id } = await params;
  const { data: s } = await db
    .from("subscriptions")
    .select("*,pickup_points(name),subscription_items(*),subscription_cycles(*),subscription_status_history(*),subscription_change_requests(*)")
    .eq("id", id)
    .maybeSingle();
  if (!s) notFound();

  return (
    <>
      <AdminPageHeader
        title={(FREQUENCY_LABELS_ES as Record<string, string>)[s.frequency] ?? s.frequency}
        description={s.pickup_points?.name}
        actions={<Badge variant={SUBSCRIPTION_STATUS_BADGE_VARIANT[s.status] ?? "neutral"}>{subscriptionStatusLabel(s.status)}</Badge>}
      />
      <Card>
        <h2>Cesta</h2>
        {s.subscription_items?.map((i: any) => (
          <p key={i.id}>{i.quantity} × {i.product_name_snapshot} · {i.variant_name_snapshot}</p>
        ))}
        <p>
          Subtotal {formatPrice(s.subtotal_cents)}
          {s.discount_percent > 0 ? ` · ${s.discount_percent}% descuento` : ""} · Total {formatPrice(s.total_cents)}
        </p>
      </Card>
      <Card>
        <h2>Stripe</h2>
        <p>Customer: {s.stripe_customer_id ? `…${s.stripe_customer_id.slice(-8)}` : "pendiente"}</p>
        <p>Subscription: {s.stripe_subscription_id ? `…${s.stripe_subscription_id.slice(-8)}` : "pendiente"}</p>
      </Card>
      <Card>
        <h2>Ciclos</h2>
        {s.subscription_cycles?.map((c: any) => {
          const cycleStatus = CYCLE_STATUS[c.status] ?? { label: c.status, variant: "neutral" as const };
          return (
            <p key={c.id}>
              {c.collection_date} · <Badge variant={cycleStatus.variant}>{cycleStatus.label}</Badge>
              {c.failure_reason ? ` · ${c.failure_reason}` : ""}
            </p>
          );
        })}
      </Card>
      <Card>
        <h2>Cambios pendientes</h2>
        {s.subscription_change_requests?.map((c: any) => {
          const changeStatus = CHANGE_STATUS[c.status] ?? { label: c.status, variant: "neutral" as const };
          return (
            <p key={c.id}>
              {CHANGE_TYPE_LABELS_ES[c.type] ?? c.type} · {c.effective_from} · <Badge variant={changeStatus.variant}>{changeStatus.label}</Badge>
            </p>
          );
        })}
      </Card>
    </>
  );
}
