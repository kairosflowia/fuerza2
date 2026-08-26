import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AnalyticsFilters, AnalyticsLinks, Metric, RankedTable } from "@/components/admin/analytics-view";
import { Alert } from "@/components/ui/alert";
import { euro, integer } from "@/lib/analytics";
import { loadAnalytics } from "@/lib/admin-analytics";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function AdminHomePage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  const db = await createClient();
  const [{ data, previous, error, period, points, products }, { data: inventoryAlertsRows }] = await Promise.all([
    loadAnalytics(params),
    db.rpc("inventory_dashboard_alerts"),
  ]);
  const inventoryAlerts = inventoryAlertsRows?.[0];
  if (error) return <><AdminPageHeader title="Panel del obrador" description="Métricas comerciales y operativas."/><Alert variant="error" title="No se han podido cargar las métricas">Vuelve a intentarlo en unos minutos.</Alert></>;
  const financial = data?.financial;
  const previousPaid = previous?.financial?.paid_cents ?? 0;
  const comparison = financial ? (previousPaid ? `${Math.round(((financial.paid_cents-previousPaid)/previousPaid)*100)} % respecto al periodo anterior` : "Sin base anterior comparable") : undefined;
  return <>
    <AdminPageHeader title="Panel del obrador" description={`Datos reales del ${period.start} al ${period.end}. Zona horaria Europe/Madrid.`}/>
    <AnalyticsLinks/><AnalyticsFilters params={params} points={points} products={products}/>
    <div className="analytics-metrics">
      {financial ? <><Metric label="Ventas de hoy" value={euro(financial.today_paid_cents)}/><Metric label="Ventas del periodo" value={euro(financial.paid_cents)} detail={comparison}/><Metric label="Ticket medio" value={euro(financial.average_ticket_cents)}/><Metric label="Reembolsado" value={euro(financial.refunded_cents)}/></> : null}
      <Metric label="Unidades vendidas" value={integer(data.units_sold)}/><Metric label="Producción de hoy" value={integer(data.production_today)}/><Metric label="Producción de mañana" value={integer(data.production_tomorrow)}/><Metric label="Pedidos listos" value={integer(data.ready_orders)}/><Metric label="Pedidos pendientes" value={integer(data.pending_orders)}/><Metric label="Tasa de recogida" value={`${data.collection_rate ?? 0} %`}/><Metric label="Confirmación a listo" value={`${data.average_ready_hours ?? 0} h`}/><Metric label="Incidencias abiertas" value={integer(data.open_incidents)}/><Metric label="Suscripciones activas" value={integer(data.subscriptions?.active)}/><Metric label="Pagos fallidos" value={integer(data.failed_payments)}/>
    </div>
    {(data.open_incidents>0 || data.failed_payments>0 || data.subscriptions?.past_due>0) ? <Alert variant="warning" title="Alertas operativas">Hay {integer(data.open_incidents)} incidencias abiertas, {integer(data.failed_payments)} pagos fallidos y {integer(data.subscriptions?.past_due)} suscripciones con cobro pendiente.</Alert> : <Alert variant="success" title="Sin alertas críticas">No hay alertas operativas abiertas en este momento.</Alert>}
    {inventoryAlerts && (inventoryAlerts.out_of_stock_count>0 || inventoryAlerts.low_stock_count>0 || inventoryAlerts.expiring_reservations_count>0 || inventoryAlerts.recent_mermas_count>0 || inventoryAlerts.paid_pending_prep_count>0) ? (
      <Alert variant="warning" title="Alertas de inventario">
        {integer(inventoryAlerts.out_of_stock_count)} productos sin stock · {integer(inventoryAlerts.low_stock_count)} con stock bajo · {integer(inventoryAlerts.paid_pending_prep_count)} pedidos pagados pendientes de preparar · {integer(inventoryAlerts.expiring_reservations_count)} reservas por expirar · {integer(inventoryAlerts.recent_mermas_count)} mermas en 24h.
      </Alert>
    ) : null}
    {financial ? <><RankedTable title="Productos más vendidos" rows={(data.products??[]).slice(0,10)} kind="products"/><RankedTable title="Puntos con mayor volumen" rows={(data.points??[]).slice(0,10)} kind="points"/></> : null}
  </>;
}
