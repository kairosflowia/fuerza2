import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AnalyticsFilters, AnalyticsLinks, Metric, RankedTable } from "@/components/admin/analytics-view";
import { Alert } from "@/components/ui/alert";
import { euro, integer } from "@/lib/analytics";
import { loadAnalytics } from "@/lib/admin-analytics";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsHomePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const db = await createClient();
  const [{ data, previous, error, period, points, products, mermaUnits, salesByWeekday }, { data: inventoryAlertsRows }] = await Promise.all([
    loadAnalytics(params),
    db.rpc("inventory_dashboard_alerts"),
  ]);
  const inventoryAlerts = inventoryAlertsRows?.[0];
  if (error) {
    return (
      <>
        <AdminPageHeader title="Analítica" description="Métricas comerciales y operativas." />
        <Alert variant="error" title="No se han podido cargar las métricas">Vuelve a intentarlo en unos minutos.</Alert>
      </>
    );
  }
  const financial = data?.financial;
  const previousPaid = previous?.financial?.paid_cents ?? 0;
  const comparison = financial ? (previousPaid ? `${Math.round(((financial.paid_cents - previousPaid) / previousPaid) * 100)} % respecto al periodo anterior` : "Sin base anterior comparable") : undefined;
  return (
    <>
      <AdminPageHeader title="Analítica" description={`Datos reales del ${period.start} al ${period.end}. Zona horaria Europe/Madrid.`} />
      <AnalyticsLinks />
      <AnalyticsFilters params={params} points={points} products={products} />
      <div className="analytics-metrics">
        {financial ? (
          <>
            <Metric label="Ventas de hoy" value={euro(financial.today_paid_cents)} icon="pagos" tone="primary" />
            <Metric label="Ventas del periodo" value={euro(financial.paid_cents)} detail={comparison} icon="pagos" tone="primary" />
            <Metric label="Ticket medio" value={euro(financial.average_ticket_cents)} icon="pagos" tone="neutral" />
            <Metric label="Reembolsado" value={euro(financial.refunded_cents)} icon="pagos" tone="warning" />
          </>
        ) : null}
        <Metric label="Unidades vendidas" value={integer(data.units_sold)} icon="listo" tone="primary" />
        <Metric label="Producción de hoy" value={integer(data.production_today)} icon="produccion" tone="primary" />
        <Metric label="Producción de mañana" value={integer(data.production_tomorrow)} icon="produccion" tone="neutral" />
        <Metric label="Pedidos listos" value={integer(data.ready_orders)} icon="listo" tone="success" />
        <Metric label="Pedidos pendientes" value={integer(data.pending_orders)} icon="reloj" tone="warning" />
        <Metric label="Tasa de recogida" value={`${data.collection_rate ?? 0} %`} icon="analitica" tone="information" />
        <Metric label="Confirmación a listo" value={`${data.average_ready_hours ?? 0} h`} icon="reloj" tone="information" />
        <Metric label="Incidencias abiertas" value={integer(data.open_incidents)} icon="incidencias" tone="error" />
        <Metric label="Suscripciones activas" value={integer(data.subscriptions?.active)} icon="suscripciones" tone="primary" />
        <Metric label="Pagos fallidos" value={integer(data.failed_payments)} icon="pagos" tone="error" />
        <Metric label="Mermas del periodo" value={`${integer(mermaUnits)} uds.`} icon="inventario" tone="warning" />
      </div>
      {data.open_incidents > 0 || data.failed_payments > 0 || data.subscriptions?.past_due > 0 ? (
        <Alert variant="warning" title="Alertas operativas">
          Hay {integer(data.open_incidents)} incidencias abiertas, {integer(data.failed_payments)} pagos fallidos y {integer(data.subscriptions?.past_due)} suscripciones con cobro pendiente.
        </Alert>
      ) : (
        <Alert variant="success" title="Sin alertas críticas">No hay alertas operativas abiertas en este momento.</Alert>
      )}
      {inventoryAlerts && (inventoryAlerts.out_of_stock_count > 0 || inventoryAlerts.low_stock_count > 0 || inventoryAlerts.expiring_reservations_count > 0 || inventoryAlerts.recent_mermas_count > 0 || inventoryAlerts.paid_pending_prep_count > 0) ? (
        <Alert variant="warning" title="Alertas de inventario">
          {integer(inventoryAlerts.out_of_stock_count)} productos sin stock · {integer(inventoryAlerts.low_stock_count)} con stock bajo · {integer(inventoryAlerts.paid_pending_prep_count)} pedidos pagados pendientes de preparar · {integer(inventoryAlerts.expiring_reservations_count)} reservas por expirar · {integer(inventoryAlerts.recent_mermas_count)} mermas en 24h.
        </Alert>
      ) : null}
      {financial ? (
        <>
          <RankedTable title="Productos más vendidos" rows={(data.products ?? []).slice(0, 10)} kind="products" />
          <RankedTable title="Puntos con mayor volumen" rows={(data.points ?? []).slice(0, 10)} kind="points" />
          <section className="admin-subsection">
            <h2>Ventas por día de la semana</h2>
            <p className="field__help">Para decidir qué días reforzar producción o personal en el punto.</p>
            <ul className="inventory-list">
              {salesByWeekday.map((day) => (
                <li key={day.label} className="inventory-row">
                  <div className="inventory-row__main"><p className="inventory-row__product">{day.label}</p></div>
                  <div className="inventory-row__stock">
                    <span className="inventory-row__qty">{integer(day.orders)} pedido{day.orders === 1 ? "" : "s"}</span>
                    <span className="inventory-row__qty">{euro(day.cents)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </>
  );
}
