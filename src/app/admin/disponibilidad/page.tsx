import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OverrideForm, OverrideList } from "@/components/admin/availability-forms";
import { ProductionCalendar, type DayInfo } from "@/components/admin/production-calendar";
import { Card } from "@/components/ui";
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
  const [{ data: variantsRaw }, { data: products }, { data: pickupPoints }, { data: productionWeekdays }, { data: cutoffRows }] = await Promise.all([
    db.from("product_variants").select("id, product_id, name, status").eq("status", "active"),
    db.from("products").select("id, name").order("display_order"),
    db.from("pickup_points").select("id, name").eq("status", "active").order("display_order"),
    db.from("product_production_weekdays").select("weekday, is_active, product_id"),
    db.from("app_settings").select("key,value").in("key", ["availability.cutoff_days_before", "availability.cutoff_time"]),
  ]);

  const productNameById = new Map((products ?? []).map((p) => [p.id, p.name]));
  const variants = (variantsRaw ?? []).map((v) => ({ id: v.id, name: v.name, productId: v.product_id, productName: productNameById.get(v.product_id) ?? "" }));
  const selectedVariantId = params.variant || variants[0]?.id || "";
  const selectedProductId = variants.find((v) => v.id === selectedVariantId)?.productId;

  const pointName = (id: string | null) => (id ? (pickupPoints ?? []).find((p) => p.id === id)?.name ?? "Punto" : "Todos los puntos");
  const cutoffDays = cutoffRows?.find((r) => r.key === "availability.cutoff_days_before")?.value;
  const cutoffTime = cutoffRows?.find((r) => r.key === "availability.cutoff_time")?.value;
  const cutoffConfigured = typeof cutoffDays === "number" && typeof cutoffTime === "string";

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

  function dayInfo(day: number, date: string): DayInfo {
    const isClosed = (closures ?? []).some((c) => date >= c.starts_on && date <= c.ends_on);
    if (isClosed) return { date, day, dot: "closed", reason: "Cierre global de toda la actividad ese día." };
    const production = productionByDate.get(date);
    const weekday = isoWeekday(date);
    if (!producedWeekdays.has(weekday)) return { date, day, dot: null, reason: "Este producto no se produce ese día de la semana." };
    if (!production) return { date, day, dot: "unset", reason: "Todavía no hay una fecha de producción creada para este día." };
    if (production.status === "cancelled") return { date, day, dot: "closed", reason: "Fecha de producción cancelada." };
    if (production.status === "closed") return { date, day, dot: "closed", reason: "Cerrada manualmente por el equipo: no admite más reservas." };
    if (production.status === "draft") {
      return {
        date, day, dot: "unset", reason: "Creada en borrador: todavía no está abierta a reservas.",
        production: { id: production.id, status: production.status, totalCapacity: production.total_capacity, reservedForSubscriptions: production.reserved_for_subscriptions, confirmed: confirmedByDate.get(date) ?? 0, held: heldByDate.get(date) ?? 0, allocations: allocByDate.get(date) ?? 0, remaining: 0 },
      };
    }
    const confirmed = confirmedByDate.get(date) ?? 0;
    const held = heldByDate.get(date) ?? 0;
    const alloc = allocByDate.get(date) ?? 0;
    const remaining = Math.max(production.total_capacity - production.reserved_for_subscriptions - alloc - confirmed - held, 0);
    const dot = remaining <= 0 ? "sold-out" : remaining <= 5 ? "low" : "open";
    const reason = remaining <= 0 ? "Sin unidades disponibles: capacidad agotada." : remaining <= 5 ? `Quedan ${remaining} unidades disponibles.` : "Abierta, con capacidad disponible.";
    return {
      date, day, dot, reason,
      production: { id: production.id, status: production.status, totalCapacity: production.total_capacity, reservedForSubscriptions: production.reserved_for_subscriptions, confirmed, held, allocations: alloc, remaining },
    };
  }

  const cells: (DayInfo | null)[] = [];
  for (let day = 1; day <= daysInMonth; day++) cells.push(dayInfo(day, `${month}-${String(day).padStart(2, "0")}`));
  const firstWeekday = isoWeekday(`${month}-01`);
  const padded: (DayInfo | null)[] = Array(firstWeekday - 1).fill(null);
  padded.push(...cells);
  const weeks: (DayInfo | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  return (
    <>
      <AdminPageHeader title="Disponibilidad" description="Capacidad de producción por variante y fecha, y su relación con la capacidad del punto." />

      <p className="field__help">
        Antelación mínima de reserva: {cutoffConfigured ? `${cutoffDays} día${cutoffDays === 1 ? "" : "s"} antes de las ${String(cutoffTime).slice(0, 5)}` : "sin configurar"}.{" "}
        <Link href="/admin/configuracion/reservas">Ajustar</Link>
      </p>

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

      <ProductionCalendar weeks={weeks} weekdayLabels={WEEKDAY_LABELS_ES} variantId={selectedVariantId} canManage={canManage} />

      <Card>
        <h2>Puntos de recogida — capacidad habitual</h2>
        <p className="field__help">Referencia rápida de la capacidad logística configurada por punto. No sustituye a la capacidad de producción de arriba: la disponibilidad final es siempre el mínimo entre ambas.</p>
        <ul className="admin-exception-list">
          {(pickupPoints ?? []).map((p) => <li key={p.id}><span>{p.name}</span><Link href={`/admin/puntos-de-recogida/${p.id}`}>Ver capacidad</Link></li>)}
        </ul>
      </Card>

      {canManage ? (
        <Card>
          <h2>Ajustes puntuales de capacidad (variante × punto × fecha)</h2>
          <p className="field__help">Solo para casos excepcionales: limitar una variante concreta en un punto concreto por debajo de lo que la producción y el punto permitirían en general.</p>
          <OverrideForm variants={variants} points={pickupPoints ?? []} />
          <OverrideList overrides={(overrides ?? []).map((o) => ({ id: o.id, productVariantId: o.product_variant_id, pickupPointId: o.pickup_point_id, availabilityDate: o.availability_date, capacityOverride: o.capacity_override, reason: o.reason, pointName: pointName(o.pickup_point_id) }))} />
        </Card>
      ) : null}
    </>
  );
}
