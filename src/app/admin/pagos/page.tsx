import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Metric } from "@/components/admin/analytics-view";
import { Alert, Badge, EmptyState } from "@/components/ui";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { integer } from "@/lib/analytics";
import { formatPrice } from "@/lib/catalog-domain";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EVENT_TYPE_LABELS_ES: Record<string, string> = {
  "payment_intent.succeeded": "Pago confirmado",
  "payment_intent.payment_failed": "Pago rechazado",
  "charge.refunded": "Reembolso",
  "charge.refund.updated": "Actualización de reembolso",
  "invoice.paid": "Cobro de suscripción",
};

export default async function PaymentsAdminPage() {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "pagos")) redirect("/cuenta/acceso-denegado");

  const db: any = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const since30 = since.toISOString();
  const nowIso = new Date().toISOString();

  const [
    { data: failedOrders },
    { data: stuckOrders },
    { data: refundedOrders },
    { data: recentEvents },
  ] = await Promise.all([
    db.from("orders").select("id,public_code,customer_name,total_cents,created_at").eq("payment_status", "failed").gte("created_at", since30).order("created_at", { ascending: false }),
    db.from("orders").select("id,public_code,customer_name,total_cents,payment_expires_at").eq("status", "pending_payment").lt("payment_expires_at", nowIso).order("payment_expires_at", { ascending: false }).limit(50),
    db.from("orders").select("id,public_code,customer_name,total_cents,payment_status,updated_at").in("payment_status", ["refunded", "partially_refunded"]).gte("updated_at", since30).order("updated_at", { ascending: false }),
    db.from("payment_events").select("id,event_type,processing_status,order_id,error_message,created_at,orders(public_code)").order("created_at", { ascending: false }).limit(30),
  ]);

  const attention = [
    ...(failedOrders ?? []).map((o: any) => ({ ...o, reason: "failed" as const })),
    ...(stuckOrders ?? []).map((o: any) => ({ ...o, reason: "stuck" as const })),
  ].sort((a, b) => (b.created_at ?? b.payment_expires_at ?? "").localeCompare(a.created_at ?? a.payment_expires_at ?? ""));

  const refundedTotal = (refundedOrders ?? []).reduce((sum: number, o: any) => sum + o.total_cents, 0);

  return (
    <>
      <AdminPageHeader title="Pagos" description="Qué cobros necesitan tu atención y qué se ha reembolsado." />

      <div className="analytics-metrics">
        <Metric label="Pagos fallidos (30 días)" value={integer(failedOrders?.length ?? 0)} icon="pagos" tone="error" />
        <Metric label="Cobros sin completar" value={integer(stuckOrders?.length ?? 0)} icon="reloj" tone="warning" />
        <Metric label="Reembolsado (30 días)" value={formatPrice(refundedTotal)} detail={`${integer(refundedOrders?.length ?? 0)} pedido${(refundedOrders?.length ?? 0) === 1 ? "" : "s"}`} icon="pagos" tone="neutral" />
      </div>

      {attention.length ? (
        <Alert variant="warning" title="Cobros que necesitan revisión">
          Márcalos como pagados si el cliente ya pagó por otra vía, o cancélalos desde la ficha del pedido.
        </Alert>
      ) : (
        <Alert variant="success" title="Sin cobros pendientes de revisión">No hay pagos fallidos ni cobros sin completar en este momento.</Alert>
      )}

      <section className="admin-subsection">
        <h2>Necesita atención</h2>
        {attention.length ? (
          <ul className="inventory-list">
            {attention.map((order: any) => (
              <li key={order.id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product"><Link href={`/admin/pedidos/${order.id}`}>{order.public_code}</Link></p>
                  <p className="inventory-row__variant">{order.customer_name ?? "Sin nombre"}</p>
                </div>
                <div className="inventory-row__stock">
                  <Badge variant="error">{order.reason === "failed" ? "Pago fallido" : "Cobro sin completar"}</Badge>
                  <span className="inventory-row__qty">{formatPrice(order.total_cents)}</span>
                </div>
                <div className="inventory-row__actions">
                  <Link href={`/admin/pedidos/${order.id}`} className="button button--secondary">Ver pedido</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nada que revisar" description="Los pagos fallidos o los cobros que el cliente no llegó a completar aparecerán aquí." />
        )}
      </section>

      <section className="admin-subsection">
        <h2>Reembolsos recientes</h2>
        {refundedOrders?.length ? (
          <ul className="inventory-list">
            {refundedOrders.map((order: any) => (
              <li key={order.id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product"><Link href={`/admin/pedidos/${order.id}`}>{order.public_code}</Link></p>
                  <p className="inventory-row__variant">{order.customer_name ?? "Sin nombre"}</p>
                </div>
                <div className="inventory-row__stock">
                  <Badge variant="neutral">{order.payment_status === "refunded" ? "Reembolsado" : "Reembolso parcial"}</Badge>
                  <span className="inventory-row__qty">{formatPrice(order.total_cents)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="field__help">Sin reembolsos en los últimos 30 días.</p>
        )}
      </section>

      <details className="admin-accordion">
        <summary>Vista avanzada<span className="admin-accordion__hint">Registro técnico de eventos de Stripe</span></summary>
        <div className="admin-accordion__body">
          {recentEvents?.length ? (
            <ul className="inventory-list">
              {recentEvents.map((event: any) => (
                <li key={event.id} className="inventory-row">
                  <div className="inventory-row__main">
                    <p className="inventory-row__product">{EVENT_TYPE_LABELS_ES[event.event_type] ?? event.event_type}</p>
                    <p className="inventory-row__variant">
                      {new Date(event.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                      {event.orders?.public_code ? ` · ${event.orders.public_code}` : ""}
                      {event.error_message ? ` · ${event.error_message}` : ""}
                    </p>
                  </div>
                  <Badge variant={event.processing_status === "failed" ? "error" : event.processing_status === "processed" ? "success" : "neutral"}>
                    {event.processing_status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="field__help">Sin eventos registrados.</p>
          )}
        </div>
      </details>
    </>
  );
}
