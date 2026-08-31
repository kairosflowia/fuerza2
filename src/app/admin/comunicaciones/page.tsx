import Link from "next/link";

import { Metric } from "@/components/admin/analytics-view";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Alert, Badge, EmptyState } from "@/components/ui";
import { integer } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const mask = (email: string) => {
  const [a, d] = email.split("@");
  return `${a?.slice(0, 2) ?? "**"}***@${d ?? "***"}`;
};

const EVENT_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" | "information" }> = {
  pending: { label: "Pendiente", variant: "neutral" },
  processing: { label: "Procesando", variant: "warning" },
  sent: { label: "Enviado", variant: "success" },
  partially_sent: { label: "Envío parcial", variant: "warning" },
  failed: { label: "Fallido", variant: "error" },
  cancelled: { label: "Cancelado", variant: "neutral" },
  suppressed: { label: "Suprimido", variant: "neutral" },
};
const EVENT_STATUS_OPTIONS = ["pending", "processing", "sent", "failed", "suppressed"];
const PRIORITY_LABELS_ES: Record<string, string> = { critical: "Crítica", high: "Alta", normal: "Normal", low: "Baja" };

export default async function Communications({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const state = (await searchParams).estado;
  const db: any = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceIso = since.toISOString();
  const [
    { count: sentCount },
    { count: deliveredCount },
    { count: failedEventsCount },
    { count: failedDeliveriesCount },
    { data },
  ] = await Promise.all([
    db.from("notification_events").select("id", { count: "exact", head: true }).in("status", ["sent", "partially_sent"]).gte("created_at", sinceIso),
    db.from("notification_deliveries").select("id", { count: "exact", head: true }).eq("status", "delivered").gte("created_at", sinceIso),
    db.from("notification_events").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", sinceIso),
    db.from("notification_deliveries").select("id", { count: "exact", head: true }).in("status", ["bounced", "complained", "failed"]).gte("created_at", sinceIso),
    (() => {
      let query = db
        .from("notification_events")
        .select("id,event_key,recipient_email,status,priority,attempt_count,scheduled_for,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (state) query = query.eq("status", state);
      return query;
    })(),
  ]);
  const problemsCount = (failedEventsCount ?? 0) + (failedDeliveriesCount ?? 0);

  return (
    <>
      <AdminPageHeader title="Comunicaciones" description="Confirmaciones, recordatorios y avisos que reciben tus clientes por correo." />

      <div className="analytics-metrics">
        <Metric label="Enviados (7 días)" value={integer(sentCount)} icon="mensajes" tone="primary" />
        <Metric label="Entregados (7 días)" value={integer(deliveredCount)} icon="mensajes" tone="success" />
        <Metric label="Con problemas (7 días)" value={integer(problemsCount)} icon="mensajes" tone="error" />
      </div>
      {problemsCount > 0 ? (
        <Alert variant="warning" title="Hay avisos que no han llegado">
          {integer(problemsCount)} aviso{problemsCount === 1 ? "" : "s"} de los últimos 7 días no se ha podido enviar o entregar. Revisa la lista de abajo para ver a quién afecta.
        </Alert>
      ) : (
        <Alert variant="success" title="Sin problemas de entrega">Todos los avisos de los últimos 7 días se han enviado correctamente.</Alert>
      )}

      <details className="admin-accordion">
        <summary>Vista avanzada<span className="admin-accordion__hint">Cola completa, reintentos y detalle técnico de cada envío</span></summary>
        <div className="admin-accordion__body">
          <form className="admin-filters">
            <label>
              Estado
              <select name="estado" defaultValue={state ?? ""}>
                <option value="">Todos</option>
                {EVENT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{EVENT_STATUS[s]?.label ?? s}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="button button--primary">Filtrar</button>
          </form>
          {data?.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Evento</th><th>Destinatario</th><th>Estado</th><th>Prioridad</th><th>Intentos</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {data.map((event: any) => {
                    const status = EVENT_STATUS[event.status] ?? { label: event.status, variant: "neutral" as const };
                    return (
                      <tr key={event.id}>
                        <td><Link href={`/admin/comunicaciones/${event.id}`}>{event.event_key}</Link></td>
                        <td>{mask(event.recipient_email)}</td>
                        <td><Badge variant={status.variant}>{status.label}</Badge></td>
                        <td>{PRIORITY_LABELS_ES[event.priority] ?? event.priority}</td>
                        <td>{event.attempt_count}</td>
                        <td>{event.created_at}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No hay comunicaciones" description="Los eventos transaccionales aparecerán aquí." />
          )}
        </div>
      </details>
    </>
  );
}
