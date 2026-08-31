import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AnalyticsFilters, AnalyticsLinks, Metric, RankedTable } from "@/components/admin/analytics-view";
import { euro, integer } from "@/lib/analytics";
import { loadAnalytics } from "@/lib/admin-analytics";
import { getCurrentIdentity } from "@/lib/auth/session";

const allowed = new Set(["productos","clientes","suscripciones","puntos"]);
export const dynamic = "force-dynamic";
export default async function AnalyticsPage({ params, searchParams }: { params: Promise<{view:string}>; searchParams: Promise<Record<string,string|undefined>> }) {
  const { view } = await params;
  if (!allowed.has(view)) notFound();
  const identity = await getCurrentIdentity();
  if (!identity?.roles.some(role=>role==="owner"||role==="admin")) redirect("/cuenta/acceso-denegado");
  const query = await searchParams;
  const { data, period, points, products } = await loadAnalytics(query);
  const titles: Record<string,string> = { productos:"Analítica de productos",clientes:"Analítica de clientes",suscripciones:"Analítica de Plan de Pan",puntos:"Analítica de puntos" };
  return <><AdminPageHeader title={titles[view]} description={`Métricas agregadas del ${period.start} al ${period.end}, sin datos personales.`}/><AnalyticsLinks/><AnalyticsFilters params={query} points={points} products={products}/>
    {view==="productos" ? <><div className="analytics-metrics"><Metric label="Unidades" value={integer(data.units_sold)} icon="listo" tone="primary"/><Metric label="Ingresos pagados" value={euro(data.financial?.paid_cents)} icon="pagos" tone="primary"/><Metric label="Cancelado" value={euro(data.financial?.cancelled_cents)} icon="pagos" tone="error"/></div><RankedTable title="Productos y variantes" rows={data.products??[]} kind="products"/></> : null}
    {view==="clientes" ? <div className="analytics-metrics"><Metric label="Clientes nuevos" value={integer(data.customers?.new)} icon="clientes" tone="primary"/><Metric label="Clientes recurrentes" value={integer(data.customers?.returning)} icon="clientes" tone="primary"/><Metric label="Compras autenticadas" value={integer(data.customers?.authenticated)} icon="clientes" tone="neutral"/><Metric label="Compras como invitado" value={integer(data.customers?.guests)} icon="clientes" tone="neutral"/><Metric label="Clientes con suscripción" value={integer(data.customers?.subscribers)} icon="suscripciones" tone="primary"/></div> : null}
    {view==="suscripciones" ? <div className="analytics-metrics"><Metric label="Activas" value={integer(data.subscriptions?.active)} icon="suscripciones" tone="primary"/><Metric label="Nuevas" value={integer(data.subscriptions?.new)} icon="suscripciones" tone="primary"/><Metric label="Pausadas" value={integer(data.subscriptions?.paused)} icon="suscripciones" tone="warning"/><Metric label="Canceladas" value={integer(data.subscriptions?.cancelled)} icon="suscripciones" tone="error"/><Metric label="Tasa de cancelación" value={`${data.subscriptions?.cancellation_rate ?? 0} %`} icon="analitica" tone="information"/><Metric label="Past due" value={integer(data.subscriptions?.past_due)} icon="reloj" tone="warning"/><Metric label="Ingresos recurrentes" value={euro(data.subscriptions?.recurring_revenue_cents)} icon="pagos" tone="primary"/><Metric label="Ciclos" value={integer(data.subscriptions?.cycles)} icon="suscripciones" tone="neutral"/><Metric label="Capacidad reservada" value={integer(data.subscriptions?.reserved_capacity)} icon="inventario" tone="neutral"/></div> : null}
    {view==="puntos" ? <RankedTable title="Rendimiento por punto" rows={data.points??[]} kind="points"/> : null}
    <p><a className="button button--secondary" href={`/api/admin/analitica/export?tipo=${view}&desde=${period.start}&hasta=${period.end}`}>Exportar CSV</a></p>
  </>;
}
