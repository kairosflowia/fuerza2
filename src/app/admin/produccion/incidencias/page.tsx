import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductionTabs } from "@/components/admin/production-tabs";
import { Badge, EmptyState } from "@/components/ui";
import { isoToday } from "@/lib/production-date";
import { createClient } from "@/lib/supabase/server";
import { createIncident } from "../actions";

const INCIDENT_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" }> = {
  open: { label: "Abierta", variant: "error" },
  in_progress: { label: "En curso", variant: "warning" },
  resolved: { label: "Resuelta", variant: "success" },
  dismissed: { label: "Descartada", variant: "neutral" },
};
const INCIDENT_SEVERITY: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" }> = {
  low: { label: "Baja", variant: "neutral" },
  medium: { label: "Media", variant: "warning" },
  high: { label: "Alta", variant: "warning" },
  critical: { label: "Crítica", variant: "error" },
};
const INCIDENT_TYPE_LABELS_ES: Record<string, string> = {
  capacity_mismatch: "Descuadre de capacidad",
  missing_product: "Producto ausente",
  quality_issue: "Problema de calidad",
  delayed_production: "Retraso de producción",
  pickup_point_issue: "Incidencia en punto de recogida",
  customer_issue: "Incidencia con cliente",
  payment_mismatch: "Descuadre de pago",
  order_change: "Cambio de pedido",
  other: "Otro",
};

export default async function Incidents({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const date = (await searchParams).fecha ?? isoToday();
  const db: any = await createClient();
  const { data } = await db
    .from("production_incidents")
    .select("*")
    .eq("production_date", date)
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminPageHeader title="Incidencias" description="Problemas operativos conservados hasta su resolución." />
      <ProductionTabs date={date} />
      <form action={createIncident} className="admin-form">
        <input type="hidden" name="date" value={date} />
        <label>
          Tipo
          <select name="type">
            <option value="quality_issue">Calidad</option>
            <option value="missing_product">Producto ausente</option>
            <option value="delayed_production">Retraso</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <label>
          Severidad
          <select name="severity">
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>
        </label>
        <label>
          Descripción
          <textarea name="description" required />
        </label>
        <button type="submit" className="button button--primary">Registrar incidencia</button>
      </form>
      {data?.length ? (
        <div className="production-grid">
          {data.map((incident: any) => {
            const status = INCIDENT_STATUS[incident.status] ?? { label: incident.status, variant: "neutral" as const };
            const severity = INCIDENT_SEVERITY[incident.severity] ?? { label: incident.severity, variant: "neutral" as const };
            return (
              <article className="production-card" key={incident.id}>
                <div className="admin-action-group">
                  <Badge variant={severity.variant}>{severity.label}</Badge>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <h2>{INCIDENT_TYPE_LABELS_ES[incident.type] ?? incident.type}</h2>
                <p>{incident.description}</p>
                {incident.resolution ? <p>Resolución: {incident.resolution}</p> : null}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Sin incidencias para esta fecha" description="Los problemas operativos que registres aparecerán aquí hasta resolverse." />
      )}
    </>
  );
}
