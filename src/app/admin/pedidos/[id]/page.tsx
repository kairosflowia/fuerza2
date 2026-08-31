import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateOrderStatus } from "../actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderCancelButton } from "@/components/admin/order-cancel-button";
import { Badge, Button, Card } from "@/components/ui";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog-domain";
import { ORDER_NEXT_ACTION, ORDER_STATUS_BADGE_VARIANT, PAYMENT_STATUS_BADGE_VARIANT, orderStatusLabel, paymentStatusLabel } from "@/lib/order-status-domain";
import { createClient } from "@/lib/supabase/server";

const CHANNEL_LABELS_ES: Record<string, string> = { web: "Web", whatsapp: "WhatsApp", phone: "Teléfono", in_person: "Presencial" };
const MOVEMENT_LABELS_ES: Record<string, string> = { entrada: "Entrada", produccion: "Producción", venta: "Venta", merma: "Merma", ajuste: "Ajuste", devolucion: "Cancelación" };
const MOVEMENT_BADGE_VARIANT: Record<string, "success" | "information" | "error" | "warning" | "primary"> = { entrada: "success", produccion: "success", venta: "information", merma: "error", ajuste: "warning", devolucion: "primary" };
const RESERVATION_LABELS_ES: Record<string, string> = { active: "Activa", expired: "Expirada", released: "Liberada", converted: "Convertida en venta" };
const RESERVATION_BADGE_VARIANT: Record<string, "success" | "warning" | "neutral" | "information"> = { active: "warning", expired: "neutral", released: "neutral", converted: "success" };

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "pedidos")) redirect("/cuenta/acceso-denegado");
  const canManage = identity.roles.some((r) => r === "owner" || r === "admin");
  const db: any = await createClient();
  const [{ data: order }, { data: items }, { data: history }, { data: movements }] = await Promise.all([
    db.from("orders").select("*").eq("id", id).maybeSingle(),
    db.from("order_items").select("*").eq("order_id", id).order("created_at"),
    db.from("order_status_history").select("*").eq("order_id", id).order("created_at"),
    db.from("product_stock_movements").select("id,product_variant_id,type,quantity,notes,created_at").eq("order_id", id).order("created_at"),
  ]);
  if (!order) notFound();

  const [{ data: pickupPoint }, { data: reservation }] = await Promise.all([
    order.pickup_point_id ? db.from("pickup_points").select("id,name").eq("id", order.pickup_point_id).maybeSingle() : Promise.resolve({ data: null }),
    order.reservation_id ? db.from("stock_reservations").select("id,status,quantity,product_variant_id,expires_at").eq("id", order.reservation_id) : Promise.resolve({ data: [] }),
  ]);

  return (
    <>
      <AdminPageHeader
        title={`Pedido ${order.public_code}`}
        description={`Confirmado ${order.confirmed_at ? new Date(order.confirmed_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "—"} · canal ${CHANNEL_LABELS_ES[order.channel] ?? order.channel}`}
        actions={
          <div className="admin-action-group">
            <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status] ?? "neutral"}>{orderStatusLabel(order.status)}</Badge>
            <Badge variant={PAYMENT_STATUS_BADGE_VARIANT[order.payment_status] ?? "neutral"}>{paymentStatusLabel(order.payment_status)}</Badge>
          </div>
        }
      />

      <div className="admin-dashboard-grid">
        <Card>
          <h2>Cliente</h2>
          <p>{order.customer_name}<br />{order.customer_email}<br />{order.customer_phone}</p>
          <p>PaymentIntent: {order.stripe_payment_intent_id ? `…${order.stripe_payment_intent_id.slice(-8)}` : "pendiente"}</p>
          {order.internal_note ? <p>Nota interna: {order.internal_note}</p> : null}
        </Card>

        <Card>
          <h2>Recogida</h2>
          <p>{pickupPoint?.name ?? "Punto no disponible"}<br />{order.collection_date}</p>
          {order.requires_review ? <Badge variant="error">Requiere revisión</Badge> : null}
        </Card>

        <Card>
          <h2>Importe</h2>
          <p className="inventory-row__qty">Subtotal {formatPrice(order.subtotal_cents)}</p>
          <p className="inventory-row__qty">IVA {formatPrice(order.tax_cents)}</p>
          <p><strong>Total {formatPrice(order.total_cents)}</strong></p>
        </Card>
      </div>

      <section className="admin-subsection">
        <h2>Productos</h2>
        <ul className="inventory-list">
          {items?.map((item: any) => (
            <li key={item.id} className="inventory-row">
              <div className="inventory-row__main">
                <p className="inventory-row__product">{item.quantity} × {item.product_name_snapshot}</p>
                <p className="inventory-row__variant">
                  {item.variant_name_snapshot} · {formatPrice(item.unit_price_cents)} / ud. · IVA {item.vat_rate_snapshot}%
                </p>
              </div>
              <div className="inventory-row__stock">
                <span className="inventory-row__qty">{formatPrice(item.line_total_cents)}</span>
              </div>
              <div className="inventory-row__actions">
                <Link href={`/admin/productos/${item.product_id}/editar`} className="button button--secondary">Ver producto</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {reservation?.length ? (
        <section className="admin-subsection">
          <h2>Reserva original</h2>
          <ul className="inventory-list">
            {reservation.map((r: any) => (
              <li key={r.id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product">{r.quantity} unidades reservadas</p>
                  <p className="inventory-row__variant">Expira {new Date(r.expires_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</p>
                </div>
                <div className="inventory-row__stock">
                  <Badge variant={RESERVATION_BADGE_VARIANT[r.status] ?? "neutral"}>{RESERVATION_LABELS_ES[r.status] ?? r.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="admin-subsection">
        <h2>Movimientos de estoque</h2>
        {movements?.length ? (
          <ul className="inventory-list">
            {movements.map((m: any) => (
              <li key={m.id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product">{new Date(m.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</p>
                  {m.notes ? <p className="inventory-row__variant">{m.notes}</p> : null}
                </div>
                <div className="inventory-row__stock">
                  <Badge variant={MOVEMENT_BADGE_VARIANT[m.type] ?? "neutral"}>{MOVEMENT_LABELS_ES[m.type] ?? m.type}</Badge>
                  <span className={m.quantity < 0 ? "admin-movement-qty admin-movement-qty--negative" : "admin-movement-qty admin-movement-qty--positive"}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="field__help">Este pedido no tiene productos con seguimiento de estoque, o todavía no se ha confirmado el pago.</p>
        )}
      </section>

      <section className="admin-subsection">
        <h2>Historial</h2>
        <ul className="inventory-list">
          {history?.map((h: any) => (
            <li key={h.id} className="inventory-row">
              <div className="inventory-row__main">
                <p className="inventory-row__product">{h.previous_status ? orderStatusLabel(h.previous_status) : "Inicio"} → {orderStatusLabel(h.new_status)}</p>
                <p className="inventory-row__variant">{new Date(h.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })} · {h.source}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-subsection">
        <h2>Acciones operativas</h2>
        <div className="component-row">
          {(() => {
            const next = ORDER_NEXT_ACTION[order.status];
            if (!next || (next.needsManage && !canManage)) return null;
            return (
              <form action={updateOrderStatus}>
                <input type="hidden" name="id" value={id} />
                <Button type="submit" name="status" value={next.status} variant="primary">{next.label}</Button>
              </form>
            );
          })()}
          {canManage && order.status !== "cancelled" && order.status !== "refunded" ? <OrderCancelButton orderId={id} /> : null}
        </div>
        {!ORDER_NEXT_ACTION[order.status] ? <p className="field__help">Este pedido no tiene una acción de siguiente etapa pendiente.</p> : null}
      </section>
    </>
  );
}
