import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Metric } from "@/components/admin/analytics-view";
import { Badge, Card, EmptyState } from "@/components/ui";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog-domain";
import { formatDateEs, formatTime, isoWeekday } from "@/lib/order-cutoff";
import { ORDER_STATUS_BADGE_VARIANT, PAYMENT_STATUS_BADGE_VARIANT, orderStatusLabel, paymentStatusLabel } from "@/lib/order-status-domain";
import { FREQUENCY_LABELS_ES, SUBSCRIPTION_STATUS_BADGE_VARIANT, subscriptionStatusLabel } from "@/lib/subscriptions-domain";
import { isoToday } from "@/lib/production-date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UPCOMING_STATUSES = ["confirmed", "ready"];

function pickupTimeRange(order: any): string | null {
  const windows = order.pickup_points?.pickup_point_collection_windows ?? [];
  const window = windows.find((w: any) => w.is_active && w.weekday === isoWeekday(order.collection_date));
  return window ? `${formatTime(window.starts_at)}–${formatTime(window.ends_at)}` : null;
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "clientes")) redirect("/cuenta/acceso-denegado");

  const db: any = await createClient();

  // admin_customer_directory() no admite búsqueda por id: se reutiliza el
  // directorio completo y se filtra aquí en vez de crear una función nueva
  // solo para la ficha (Fase 13, mismo patrón que /admin/pedidos/nuevo).
  const { data: directory } = await db.rpc("admin_customer_directory", { p_query: null });
  const customer = directory?.find((c: any) => c.customer_id === id);
  if (!customer) notFound();

  const [{ data: orders }, { data: subscriptions }] = await Promise.all([
    db
      .from("orders")
      .select("id,public_code,status,payment_status,total_cents,collection_date,created_at,channel,pickup_point_id,pickup_points(name,pickup_point_collection_windows(weekday,starts_at,ends_at,is_active)),order_items(product_name_snapshot,quantity)")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    db
      .from("subscriptions")
      .select("*,pickup_points(name),subscription_items(*)")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const today = isoToday();
  const allOrders = orders ?? [];
  const paidOrders = allOrders.filter((o: any) => o.payment_status === "paid");
  const upcoming = allOrders
    .filter((o: any) => o.collection_date >= today && UPCOMING_STATUSES.includes(o.status))
    .sort((a: any, b: any) => a.collection_date.localeCompare(b.collection_date))[0];
  const isHabitual = (subscriptions ?? []).some((s: any) => s.status === "active");

  // Preferencias derivadas: producto y punto más repetidos entre los pedidos
  // pagados -- calculado al vuelo desde el historial, sin guardar nada nuevo
  // (Fase 13: "não criar CRM complexo").
  const productCounts = new Map<string, number>();
  for (const order of paidOrders) {
    for (const item of order.order_items ?? []) {
      productCounts.set(item.product_name_snapshot, (productCounts.get(item.product_name_snapshot) ?? 0) + item.quantity);
    }
  }
  const topProducts = [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const pointCounts = new Map<string, { name: string; count: number }>();
  for (const order of paidOrders) {
    if (!order.pickup_point_id) continue;
    const entry = pointCounts.get(order.pickup_point_id) ?? { name: order.pickup_points?.name ?? "Punto", count: 0 };
    entry.count += 1;
    pointCounts.set(order.pickup_point_id, entry);
  }
  const topPoint = [...pointCounts.values()].sort((a, b) => b.count - a.count)[0];

  return (
    <>
      <AdminPageHeader
        title={customer.full_name || "Cliente sin nombre"}
        description={`${customer.email}${customer.phone ? ` · ${customer.phone}` : ""} · Cliente desde ${new Date(customer.created_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}`}
        actions={
          <div className="admin-action-group">
            {isHabitual ? <Badge variant="primary">Fuerza Habitual</Badge> : null}
            <Link className="button button--primary" href={`/admin/pedidos/nuevo?customer=${id}`}>Nuevo pedido para este cliente</Link>
          </div>
        }
      />

      <div className="analytics-metrics">
        <Metric label="Pedidos pagados" value={String(customer.orders_count)} icon="pedidos" tone="primary" />
        <Metric label="Gasto total" value={formatPrice(customer.total_spent_cents ?? 0)} icon="pagos" tone="primary" />
        <Metric label="Último pedido" value={customer.last_order_at ? new Date(customer.last_order_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : "—"} icon="reloj" tone="neutral" />
      </div>

      <section className="admin-subsection">
        <h2>Próxima recogida</h2>
        {upcoming ? (
          <ul className="inventory-list">
            <li className="inventory-row">
              <div className="inventory-row__main">
                <p className="inventory-row__product"><Link href={`/admin/pedidos/${upcoming.id}`}>{upcoming.public_code}</Link></p>
                <p className="inventory-row__variant">
                  {formatDateEs(upcoming.collection_date)}{pickupTimeRange(upcoming) ? ` · ${pickupTimeRange(upcoming)}` : ""} · {upcoming.pickup_points?.name ?? "Punto de recogida"}
                </p>
              </div>
              <div className="inventory-row__stock">
                <Badge variant={ORDER_STATUS_BADGE_VARIANT[upcoming.status] ?? "neutral"}>{orderStatusLabel(upcoming.status)}</Badge>
                <span className="inventory-row__qty">{formatPrice(upcoming.total_cents)}</span>
              </div>
            </li>
          </ul>
        ) : (
          <p className="field__help">Sin recogidas programadas.</p>
        )}
      </section>

      {subscriptions?.length ? (
        <section className="admin-subsection">
          <h2>Plan de Pan</h2>
          <ul className="inventory-list">
            {subscriptions.map((s: any) => (
              <li key={s.id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product">
                    <Link href={`/admin/suscripciones/${s.id}`}>{(s.subscription_items ?? []).map((i: any) => i.product_name_snapshot).join(", ") || "Cesta"}</Link>
                  </p>
                  <p className="inventory-row__variant">
                    {FREQUENCY_LABELS_ES[s.frequency as keyof typeof FREQUENCY_LABELS_ES] ?? s.frequency} · {s.pickup_points?.name ?? "Punto"}
                    {s.next_collection_date ? ` · Próxima recogida ${formatDateEs(s.next_collection_date)}` : ""}
                  </p>
                </div>
                <div className="inventory-row__stock">
                  <Badge variant={SUBSCRIPTION_STATUS_BADGE_VARIANT[s.status] ?? "neutral"}>{subscriptionStatusLabel(s.status)}</Badge>
                  <span className="inventory-row__qty">{formatPrice(s.total_cents)}{s.discount_percent > 0 ? ` (-${s.discount_percent}%)` : ""}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {topProducts.length ? (
        <section className="admin-subsection">
          <h2>Preferencias</h2>
          <p className="field__help">
            Suele pedir {topProducts.map(([name, count]) => `${name} (${count})`).join(", ")}
            {topPoint ? ` · Punto habitual: ${topPoint.name}` : ""}
          </p>
        </section>
      ) : null}

      <section className="admin-subsection">
        <h2>Historial de pedidos</h2>
        {allOrders.length ? (
          <ul className="inventory-list">
            {allOrders.map((order: any) => (
              <li key={order.id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product"><Link href={`/admin/pedidos/${order.id}`}>{order.public_code}</Link></p>
                  <p className="inventory-row__variant">
                    Pedido el {new Date(order.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })} · Recogida {formatDateEs(order.collection_date)}{pickupTimeRange(order) ? ` ${pickupTimeRange(order)}` : ""} · {order.pickup_points?.name ?? "Punto de recogida"}
                  </p>
                </div>
                <div className="inventory-row__stock">
                  <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status] ?? "neutral"}>{orderStatusLabel(order.status)}</Badge>
                  <Badge variant={PAYMENT_STATUS_BADGE_VARIANT[order.payment_status] ?? "neutral"}>{paymentStatusLabel(order.payment_status)}</Badge>
                  <span className="inventory-row__qty">{formatPrice(order.total_cents)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Todavía no hay pedidos" description="Aparecerán aquí en cuanto este cliente compre por primera vez." />
        )}
      </section>

      <Card>
        <Link className="button button--text" href="/admin/clientes">Volver al listado</Link>
      </Card>
    </>
  );
}
