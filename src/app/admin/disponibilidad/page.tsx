import Link from "next/link";

import { CapacityForm, CreateProductionDateForm, OverrideForm, OverrideList, StatusActions } from "@/components/admin/availability-forms";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Card } from "@/components/ui";
import { getCurrentIdentity } from "@/lib/auth/session";
import { canManageAvailability } from "@/lib/auth/permissions";
import { isoWeekday, WEEKDAY_LABELS_ES } from "@/lib/pickup-points-domain";
import { createClient } from "@/lib/supabase/server";

function parseMonth(value: string | undefined) {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 7);
}
function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + delta, 1)).toISOString().slice(0, 7);
}
function monthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default async function AvailabilityAdminPage({ searchParams }: { searchParams: Promise<{ variant?: string; month?: string }> }) {
  const params = await searchParams;
  const identity = await getCurrentIdentity();
  const canManage = identity ? canManageAvailability(identity.roles) : false;
  const month = parseMonth(params.month);
  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${String(daysInMonth).padStart(2, "0")}`;

  const db = await createClient();
  const [{ data: variantsRaw }, { data: products }, { data: pickupPoints }, { data: productionWeekdays }] = await Promise.all([
    db.from("product_variants").select("id, product_id, name, status").eq("status", "active"),
    db.from("products").select("id, name").order("display_order"),
    db.from("pickup_points").select("id, name").eq("status", "active").order("display_order"),
    db.from("product_production_weekdays").select("weekday, is_active, product_id"),
  ]);

  const productNameById = new Map((products ?? []).map((p) => [p.id, p.name]));
  const variants = (variantsRaw ?? []).map((v) => ({ id: v.id, name: v.name, productId: v.product_id, productName: productNameById.get(v.product_id) ?? "" }));
  const selectedVariantId = params.variant || variants[0]?.id || "";
  const selectedProductId = variants.find((v) => v.id === selectedVariantId)?.productId;

  const pointName = (id: string | null) => (id ? (pickupPoints ?? []).find((p) => p.id === id)?.name ?? "Punto" : "Todos los puntos");

  const [{ data: productionDates }, { data: overrides }, { data: closures }] = await Promise.all([
    db.from("production_dates").select("*").eq("product_variant_id", selectedVariantId).gte("production_date", monthStart).lte("production_date", monthEnd),
    db.from("availability_overrides").select("*").eq("product_variant_id", selectedVariantId).order("availability_date"),
    db.from("global_closures").select("*").lte("starts_on", monthEnd).gte("ends_on", monthStart),
  ]);

  // Sumas por fecha para el mes: confirmadas, retenidas y asignadas a suscripciones.
  // Sin joins embebidos: se cruzan en TypeScript para no depender del tipado
  // de relaciones anidadas de Supabase, que este proyecto no genera.
  const { data: confirmedItemRows } = await db
    .from("order_items")
    .select("quantity, order_id")
    .eq("product_variant_id", selectedVariantId);
  const orderIds = Array.from(new Set((confirmedItemRows ?? []).map((r) => r.order_id)));
  const { data: relevantOrders } = orderIds.length
    ? await db.from("orders").select("id, collection_date, status").in("id", orderIds)
    : { data: [] as { id: string; collection_date: string; status: string }[] };
  const orderById = new Map((relevantOrders ?? []).map((o) => [o.id, o]));

  const { data: heldRows } = await db
    .from("stock_reservations")
    .select("quantity, collection_date, status, expires_at")
    .eq("product_variant_id", selectedVariantId)
    .eq("status", "active");
  const { data: allocationRows } = await db
    .from("subscription_capacity_allocations")
    .select("quantity, allocation_date")
    .eq("product_variant_id", selectedVariantId);

  const confirmedByDate = new Map<string, number>();
  for (const row of confirmedItemRows ?? []) {
    const order = orderById.get(row.order_id);
    if (!order || order.status !== "confirmed") continue;
    confirmedByDate.set(order.collection_date, (confirmedByDate.get(order.collection_date) ?? 0) + row.quantity);
  }
  const now = new Date();
  const heldByDate = new Map<string, number>();
  for (const row of heldRows ?? []) {
    if (new Date(row.expires_at) < now) continue;
    heldByDate.set(row.collection_date, (heldByDate.get(row.collection_date) ?? 0) + row.quantity);
  }
  const allocByDate = new Map<string, number>();
  for (const row of allocationRows ?? []) {
    allocByDate.set(row.allocation_date, (allocByDate.get(row.allocation_date) ?? 0) + row.quantity);
  }

  const productionByDate = new Map((productionDates ?? []).map((p) => [p.production_date, p]));
  const producedWeekdays = new Set(
    (productionWeekdays ?? []).filter((w) => w.is_active && w.product_id === selectedProductId).map((w) => w.weekday),
  );

  const cells: { day: number; date: string }[] = [];
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, date: `${month}-${String(day).padStart(2, "0")}` });
  const firstWeekday = isoWeekday(`${month}-01`);
  const padded: ({ day: number; date: string } | null)[] = Array(firstWeekday - 1).fill(null);
  padded.push(...cells);

  function dayState(date: string) {
    const isClosed = (closures ?? []).some((c) => date >= c.starts_on && date <= c.ends_on);
    if (isClosed) return { label: "Cierre global", variant: "error" as const };
    const production = productionByDate.get(date);
    const weekday = isoWeekday(date);
    if (!producedWeekdays.has(weekday)) return { label: "Sin producción", variant: "neutral" as const };
    if (!production) return { label: "Sin configurar", variant: "neutral" as const };
    if (production.status === "cancelled") return { label: "Cancelada", variant: "neutral" as const };
    if (production.status === "closed") return { label: "Cerrada", variant: "warning" as const };
    if (production.status === "draft") return { label: "Borrador", variant: "neutral" as const };
    const confirmed = confirmedByDate.get(date) ?? 0;
    const held = heldByDate.get(date) ?? 0;
    const alloc = allocByDate.get(date) ?? 0;
    const remaining = Math.max(production.total_capacity - production.reserved_for_subscriptions - alloc - confirmed - held, 0);
    if (remaining <= 0) return { label: "Agotado", variant: "error" as const };
    if (remaining <= 5) return { label: `Quedan ${remaining}`, variant: "warning" as const };
    return { label: "Abierto", variant: "success" as const };
  }

  return (
    <>
      <AdminPageHeader title="Disponibilidad" description="Capacidad de producción por variante y fecha, y su relación con la capacidad del punto." />

      <form className="admin-form" style={{ maxWidth: "24rem" }}>
        <label className="field__label" htmlFor="variant-select">Variante</label>
        <select id="variant-select" name="variant" className="field__control field__select" defaultValue={selectedVariantId}>
          {variants.map((v) => <option key={v.id} value={v.id}>{v.productName} · {v.name}</option>)}
        </select>
        <input type="hidden" name="month" value={month} />
        <button type="submit" className="button button--secondary">Ver</button>
      </form>

      <div className="admin-actions">
        <Link className="button button--secondary" href={`/admin/disponibilidad?variant=${selectedVariantId}&month=${shiftMonth(month, -1)}`}>← Mes anterior</Link>
        <strong style={{ textTransform: "capitalize" }}>{monthLabel(month)}</strong>
        <Link className="button button--secondary" href={`/admin/disponibilidad?variant=${selectedVariantId}&month=${shiftMonth(month, 1)}`}>Mes siguiente →</Link>
      </div>

      <Card>
        <table className="admin-table admin-calendar">
          <thead><tr>{WEEKDAY_LABELS_ES.map((label) => <th key={label}>{label.slice(0, 2)}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: Math.ceil(padded.length / 7) }, (_, week) => (
              <tr key={week}>
                {padded.slice(week * 7, week * 7 + 7).map((cell, i) => {
                  if (!cell) return <td key={i} />;
                  const state = dayState(cell.date);
                  return (
                    <td key={i} className="admin-calendar__day">
                      <strong>{cell.day}</strong>
                      <Badge variant={state.variant}>{state.label}</Badge>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2>Fechas de producción del mes</h2>
        {(productionDates ?? []).length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th><th>Capacidad</th><th>Reservado suscripciones</th><th>Confirmado</th><th>Retenido</th><th>Restante</th><th>Estado</th>{canManage ? <th>Ajustar</th> : null}
                </tr>
              </thead>
              <tbody>
                {(productionDates ?? []).sort((a, b) => a.production_date.localeCompare(b.production_date)).map((p) => {
                  const confirmed = confirmedByDate.get(p.production_date) ?? 0;
                  const held = heldByDate.get(p.production_date) ?? 0;
                  const alloc = allocByDate.get(p.production_date) ?? 0;
                  const remaining = Math.max(p.total_capacity - p.reserved_for_subscriptions - alloc - confirmed - held, 0);
                  return (
                    <tr key={p.id}>
                      <td>{p.production_date}</td>
                      <td>{p.total_capacity}</td>
                      <td>{p.reserved_for_subscriptions}{alloc ? ` (+${alloc} asignado)` : ""}</td>
                      <td>{confirmed}</td>
                      <td>{held}</td>
                      <td>{remaining}</td>
                      <td><StatusActions id={p.id} status={p.status} canCancel={canManage} /></td>
                      {canManage ? <td><details><summary>Capacidad</summary><CapacityForm row={{ id: p.id, totalCapacity: p.total_capacity, reservedForSubscriptions: p.reserved_for_subscriptions, status: p.status, confirmed, held, allocations: alloc }} /></details></td> : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="field__help">No hay fechas de producción configuradas este mes para esta variante.</p>}
      </Card>

      {canManage ? (
        <Card>
          <h2>Crear fecha de producción</h2>
          <CreateProductionDateForm variants={variants} />
        </Card>
      ) : null}

      <Card>
        <h2>Puntos de recogida — capacidad habitual</h2>
        <p className="field__help">Referencia rápida de la capacidad logística configurada por punto (Fase 5). No sustituye a la capacidad de producción de arriba: la disponibilidad final es siempre el mínimo entre ambas.</p>
        <ul className="admin-exception-list">
          {(pickupPoints ?? []).map((p) => <li key={p.id}><span>{p.name}</span><Link href={`/admin/puntos-de-recogida/${p.id}`}>Ver capacidad</Link></li>)}
        </ul>
      </Card>

      {canManage ? (
        <Card>
          <h2>Ajustes puntuales de capacidad (variante × punto × fecha)</h2>
          <p className="field__help">Solo para casos excepcionales: limitar una variante concreta en un punto concreto por debajo de lo que la producción y el punto permitirían en general.</p>
          <OverrideForm variants={variants} points={pickupPoints ?? []} />
          <OverrideList overrides={(overrides ?? []).map((o) => ({ id: o.id, productVariantId: o.product_variant_id, pickupPointId: o.pickup_point_id, availabilityDate: o.availability_date, capacityOverride: o.capacity_override, reason: o.reason }))} pointName={pointName} />
        </Card>
      ) : null}
    </>
  );
}
