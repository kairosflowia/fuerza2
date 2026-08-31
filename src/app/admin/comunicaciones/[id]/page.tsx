import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

const EVENT_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" | "information" }> = {
  pending: { label: "Pendiente", variant: "neutral" },
  processing: { label: "Procesando", variant: "warning" },
  sent: { label: "Enviado", variant: "success" },
  partially_sent: { label: "Envío parcial", variant: "warning" },
  failed: { label: "Fallido", variant: "error" },
  cancelled: { label: "Cancelado", variant: "neutral" },
  suppressed: { label: "Suprimido", variant: "neutral" },
};
const DELIVERY_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" | "information" }> = {
  queued: { label: "En cola", variant: "neutral" },
  sent: { label: "Enviado", variant: "information" },
  delivered: { label: "Entregado", variant: "success" },
  delayed: { label: "Retrasado", variant: "warning" },
  bounced: { label: "Rebotado", variant: "error" },
  complained: { label: "Marcado como spam", variant: "error" },
  failed: { label: "Fallido", variant: "error" },
  suppressed: { label: "Suprimido", variant: "neutral" },
};
const PRIORITY_LABELS_ES: Record<string, string> = { critical: "Crítica", high: "Alta", normal: "Normal", low: "Baja" };

export default async function Communication({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db: any = await createClient();
  const { data } = await db
    .from("notification_events")
    .select("id,event_key,entity_type,entity_id,status,priority,attempt_count,scheduled_for,created_at,last_error,notification_deliveries(id,channel,provider,status,attempt_number,error_code,created_at,sent_at,delivered_at)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const status = EVENT_STATUS[data.status] ?? { label: data.status, variant: "neutral" as const };

  return (
    <>
      <AdminPageHeader
        title={data.event_key}
        description={data.entity_type}
        actions={<Badge variant={status.variant}>{status.label}</Badge>}
      />
      <dl>
        <dt>Prioridad</dt>
        <dd>{PRIORITY_LABELS_ES[data.priority] ?? data.priority}</dd>
        <dt>Intentos</dt>
        <dd>{data.attempt_count}</dd>
        <dt>Programado</dt>
        <dd>{data.scheduled_for}</dd>
        <dt>Último error</dt>
        <dd>{data.last_error ?? "—"}</dd>
      </dl>
      <h2>Entregas por canal</h2>
      {data.notification_deliveries?.length ? (
        <ul className="account-list">
          {data.notification_deliveries.map((delivery: any) => {
            const deliveryStatus = DELIVERY_STATUS[delivery.status] ?? { label: delivery.status, variant: "neutral" as const };
            return (
              <li key={delivery.id}>
                <span>{delivery.channel} · {delivery.provider} · intento {delivery.attempt_number}{delivery.error_code ? ` · ${delivery.error_code}` : ""}</span>
                <Badge variant={deliveryStatus.variant}>{deliveryStatus.label}</Badge>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="Sin entregas registradas" description="Todavía no se ha intentado ninguna entrega para este evento." />
      )}
    </>
  );
}
