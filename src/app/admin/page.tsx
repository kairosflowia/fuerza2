import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Metric } from "@/components/admin/analytics-view";
import { Badge, EmptyState } from "@/components/ui";
import { Alert } from "@/components/ui/alert";
import { formatPrice } from "@/lib/catalog-domain";
import { integer } from "@/lib/analytics";
import { loadAnalytics } from "@/lib/admin-analytics";
import { formatDateEs } from "@/lib/order-cutoff";
import { ORDER_STATUS_BADGE_VARIANT, orderStatusLabel } from "@/lib/order-status-domain";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const timeFormatter = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" });
// "Pedidos de hoy": estados con un compromiso real de recogida (no cuenta lo cancelado ni lo todavía sin pagar).
const REAL_ORDER_STATUSES = ["confirmed", "ready", "collected"];
const UPCOMING_ORDER_STATUSES = ["confirmed", "ready"];

export default async function AdminHomePage() {
  const db: any = await createClient();
  const [{ data, error }, { data: inventoryAlertsRows }, { data: todayOrders }, { data: productionRows }] = await Promise.all([
    loadAnalytics({}),
    db.rpc("inventory_dashboard_alerts"),
    db
      .from("orders")
      .select("id,public_code,customer_name,status,payment_status,total_cents,created_at,pickup_points(name)")
      .eq("collection_date", (new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date())))
      .eq("payment_status", "paid")
      .in("status", REAL_ORDER_STATUSES)
      .order("created_at", { ascending: true }),
    db
      .from("production_batches")
      .select("planned_quantity,produced_quantity,product_variants(name,products(name))")
      .eq("production_date", (new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date())))
      .order("created_at", { ascending: true }),
  ]);

  if (error) {
    return (
      <>
        <AdminPageHeader title="Hoy" description="Central de operación del obrador." />
        <Alert variant="error" title="No se han podido cargar los datos de hoy">Vuelve a intentarlo en unos minutos.</Alert>
      </>
    );
  }

  const inventoryAlerts = inventoryAlertsRows?.[0];
  const orders = todayOrders ?? [];
  const upcoming = orders.filter((o: any) => UPCOMING_ORDER_STATUSES.includes(o.status));
  const readyCount = orders.filter((o: any) => o.status === "ready").length;
  const pendingCount = orders.filter((o: any) => o.status === "confirmed").length;

  const production = (productionRows ?? []).map((row: any) => ({
    name: row.product_variants?.products?.name ?? "Producto",
    variant: row.product_variants?.name ?? "",
    planned: row.planned_quantity ?? 0,
    produced: row.produced_quantity ?? 0,
  }));
  const totalPlanned = production.reduce((sum: number, row: { planned: number }) => sum + row.planned, 0);
  const totalProduced = production.reduce((sum: number, row: { produced: number }) => sum + row.produced, 0);

  return (
    <>
      <AdminPageHeader
        title="Hoy"
        description={formatDateEs(new Date())}
        actions={<Link href="/admin/analitica" className="button button--secondary">Ver analítica completa</Link>}
      />

      <div className="production-metrics" aria-label="Resumen del día">
        <Metric label="Pedidos de hoy" value={integer(orders.length)} icon="pedidos" tone="primary" />
        <Metric label="Unidades a producir" value={integer(data.production_today)} icon="produccion" tone="primary" />
        <Metric label="Pendientes" value={integer(pendingCount)} icon="reloj" tone="warning" />
        <Metric label="Listos" value={integer(readyCount)} icon="listo" tone="success" />
      </div>

      {data.open_incidents > 0 || data.failed_payments > 0 || data.subscriptions?.past_due > 0 ? (
        <Alert variant="warning" title="Alertas operativas">
          Hay {integer(data.open_incidents)} incidencias abiertas, {integer(data.failed_payments)} pagos fallidos hoy y {integer(data.subscriptions?.past_due)} suscripciones con cobro pendiente.
        </Alert>
      ) : null}
      {inventoryAlerts && (inventoryAlerts.out_of_stock_count > 0 || inventoryAlerts.low_stock_count > 0 || inventoryAlerts.expiring_reservations_count > 0 || inventoryAlerts.recent_mermas_count > 0 || inventoryAlerts.paid_pending_prep_count > 0) ? (
        <Alert variant="warning" title="Alertas de inventario">
          {integer(inventoryAlerts.out_of_stock_count)} productos sin stock · {integer(inventoryAlerts.low_stock_count)} con stock bajo · {integer(inventoryAlerts.paid_pending_prep_count)} pedidos pagados pendientes de preparar · {integer(inventoryAlerts.expiring_reservations_count)} reservas por expirar · {integer(inventoryAlerts.recent_mermas_count)} mermas en 24h.
        </Alert>
      ) : null}

      <section className="admin-subsection">
        <h2>Próximas recogidas</h2>
        {upcoming.length ? (
          <ul className="inventory-list">
            {upcoming.map((order: any) => (
              <li key={order.id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product"><Link href={`/admin/pedidos/${order.id}`}>{order.customer_name ?? "Cliente"}</Link></p>
                  <p className="inventory-row__variant">{timeFormatter.format(new Date(order.created_at))} · {order.pickup_points?.name ?? "Punto de recogida"} · {order.public_code}</p>
                </div>
                <div className="inventory-row__stock">
                  <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status] ?? "neutral"}>{orderStatusLabel(order.status)}</Badge>
                  <span className="inventory-row__qty">{formatPrice(order.total_cents)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No hay recogidas pendientes hoy" description="Los pedidos confirmados o listos para hoy aparecerán aquí." />
        )}
      </section>

      <section className="admin-subsection">
        <h2>Producción de hoy</h2>
        {production.length ? (
          <>
            <ul className="inventory-list">
              {production.slice(0, 8).map((row: { name: string; variant: string; planned: number; produced: number }, index: number) => {
                const pct = row.planned ? Math.min(100, Math.round((row.produced / row.planned) * 100)) : 0;
                return (
                  <li key={`${row.name}-${row.variant}-${index}`} className="inventory-row">
                    <div className="inventory-row__main">
                      <p className="inventory-row__product">{row.name}</p>
                      <p className="inventory-row__variant">{row.variant}</p>
                    </div>
                    <div className="inventory-row__stock">
                      <span className="inventory-row__qty">{row.produced} de {row.planned} uds.</span>
                      <Badge variant={pct >= 100 ? "success" : "neutral"}>{pct}%</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="field__help">
              {integer(totalProduced)} de {integer(totalPlanned)} unidades preparadas en total. <Link href="/admin/produccion">Ver producción completa</Link>
            </p>
          </>
        ) : (
          <EmptyState title="Todavía no hay lotes generados para hoy" description="Genera los lotes desde Producción en cuanto haya pedidos confirmados." action={<Link className="button button--primary" href="/admin/produccion">Ir a Producción</Link>} />
        )}
      </section>
    </>
  );
}
