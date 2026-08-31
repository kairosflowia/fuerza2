import Link from "next/link";
import { redirect } from "next/navigation";

import { updateOrderStatus } from "./actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Button, EmptyState } from "@/components/ui";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog-domain";
import { formatDateEs, formatTime, isoWeekday } from "@/lib/order-cutoff";
import { ORDER_NEXT_ACTION, ORDER_STATUS_BADGE_VARIANT, orderStatusLabel } from "@/lib/order-status-domain";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CHANNEL_LABELS_ES: Record<string, string> = { web: "Web", whatsapp: "WhatsApp", phone: "Teléfono", in_person: "Presencial" };
const timeFormatter = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" });

// "Nuevo → Preparando → Listo → Entregado" del Plano Mestre, mapeado a los
// estados reales de public.order_status. "incidencias" es un filtro virtual
// (cancelled + refunded) para separarlos del flujo operativo normal.
const STATUS_CHIPS = [
  { value: "todos", label: "Todos" },
  { value: "pending_payment", label: "Nuevo" },
  { value: "confirmed", label: "Preparando" },
  { value: "ready", label: "Listo" },
  { value: "collected", label: "Entregado" },
  { value: "incidencias", label: "Cancelados" },
] as const;

function itemsSummary(items: { product_name_snapshot: string; quantity: number }[]) {
  if (!items.length) return "Sin artículos";
  const shown = items.slice(0, 2).map((i) => `${i.quantity}× ${i.product_name_snapshot}`).join(", ");
  return items.length > 2 ? `${shown} +${items.length - 2} más` : shown;
}

function pickupTimeRange(order: any): string | null {
  const windows = order.pickup_points?.pickup_point_collection_windows ?? [];
  const window = windows.find((w: any) => w.is_active && w.weekday === isoWeekday(order.collection_date));
  return window ? `${formatTime(window.starts_at)}–${formatTime(window.ends_at)}` : null;
}

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; fecha?: string; punto?: string }> }) {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "pedidos")) redirect("/cuenta/acceso-denegado");
  const canManage = identity.roles.some((r) => r === "owner" || r === "admin");

  const { q = "", estado = "todos", fecha = "", punto = "" } = await searchParams;
  const db: any = await createClient();

  const [{ data: orders }, { data: points }] = await Promise.all([
    (() => {
      let query = db
        .from("orders")
        .select("id,public_code,customer_name,collection_date,total_cents,status,payment_status,channel,created_at,pickup_point_id,pickup_points(name,pickup_point_collection_windows(weekday,starts_at,ends_at,is_active)),order_items(product_name_snapshot,quantity)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (estado === "incidencias") query = query.in("status", ["cancelled", "refunded"]);
      else if (estado !== "todos") query = query.eq("status", estado as never);
      if (fecha) query = query.eq("collection_date", fecha);
      if (punto) query = query.eq("pickup_point_id", punto);
      return query;
    })(),
    db.from("pickup_points").select("id,name").eq("status", "active").order("name"),
  ]);

  const needle = q.trim().toLowerCase();
  const visible = (orders ?? []).filter((o: any) => !needle || o.public_code.toLowerCase().includes(needle) || (o.customer_name ?? "").toLowerCase().includes(needle));

  const chipHref = (value: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (fecha) params.set("fecha", fecha);
    if (punto) params.set("punto", punto);
    if (value !== "todos") params.set("estado", value);
    const qs = params.toString();
    return `/admin/pedidos${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Pedidos"
        description="Pedidos del sitio y registrados manualmente por WhatsApp, teléfono o presencial."
        actions={<Link href="/admin/pedidos/nuevo"><Button type="button">Nuevo pedido manual</Button></Link>}
      />

      <nav className="admin-tabs" aria-label="Filtrar por estado">
        {STATUS_CHIPS.map((chip) => (
          <Link key={chip.value} href={chipHref(chip.value)} aria-current={estado === chip.value ? "page" : undefined}>
            {chip.label}
          </Link>
        ))}
      </nav>

      <form className="admin-filters">
        <label>Buscar<input type="search" name="q" defaultValue={q} placeholder="Código o cliente…" /></label>
        <label>Fecha de recogida<input type="date" name="fecha" defaultValue={fecha} /></label>
        <label>
          Punto
          <select name="punto" defaultValue={punto}>
            <option value="">Todos</option>
            {(points ?? []).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        {estado !== "todos" ? <input type="hidden" name="estado" value={estado} /> : null}
        <button type="submit" className="button button--primary">Filtrar</button>
      </form>

      {visible.length ? (
        <ul className="inventory-list">
          {visible.map((o: any) => {
            const next = ORDER_NEXT_ACTION[o.status];
            const canAct = next && (!next.needsManage || canManage);
            return (
              <li key={o.id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product">
                    <Link href={`/admin/pedidos/${o.id}`}>{o.public_code}</Link> · {timeFormatter.format(new Date(o.created_at))}
                  </p>
                  <p className="inventory-row__variant">
                    {o.customer_name ?? "Sin nombre"} · {itemsSummary(o.order_items ?? [])} · {CHANNEL_LABELS_ES[o.channel] ?? o.channel} · recoge {formatDateEs(o.collection_date)}{pickupTimeRange(o) ? ` ${pickupTimeRange(o)}` : ""}
                  </p>
                </div>
                <div className="inventory-row__stock">
                  <Badge variant={ORDER_STATUS_BADGE_VARIANT[o.status] ?? "neutral"}>{orderStatusLabel(o.status)}</Badge>
                  <span className="inventory-row__qty">{formatPrice(o.total_cents)}</span>
                </div>
                <div className="inventory-row__actions">
                  {canAct ? (
                    <form action={updateOrderStatus}>
                      <input type="hidden" name="id" value={o.id} />
                      <Button type="submit" name="status" value={next.status} variant="primary">{next.label}</Button>
                    </form>
                  ) : null}
                  <Link href={`/admin/pedidos/${o.id}`} className="button button--secondary">Ver pedido</Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title={q || estado !== "todos" || fecha || punto ? "Sin resultados" : "Todavía no hay pedidos"}
          description={q || estado !== "todos" || fecha || punto ? "Ningún pedido coincide con estos filtros." : "Aparecerán aquí después de iniciar el checkout o de registrar un pedido manual."}
        />
      )}
    </>
  );
}
