import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Metric } from "@/components/admin/analytics-view";
import { InventoryRowActions } from "@/components/admin/inventory-row-actions";
import { StockMovementButton, StockTrackingToggle } from "@/components/admin/stock-movement-form";
import { Alert, Badge, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MOVEMENT_LABELS_ES: Record<string, string> = {
  entrada: "Entrada",
  produccion: "Producción",
  venta: "Venta",
  merma: "Merma",
  ajuste: "Ajuste",
  devolucion: "Cancelación",
};

const MOVEMENT_BADGE_VARIANT: Record<string, "success" | "information" | "error" | "warning" | "primary"> = {
  entrada: "success",
  produccion: "success",
  venta: "information",
  merma: "error",
  ajuste: "warning",
  devolucion: "primary",
};

const STOCK_LABEL: Record<string, string> = { agotado: "Sin stock", stock_bajo: "Stock bajo", disponible: "Disponible", no_controlado: "No controlado" };
const STOCK_BADGE_VARIANT: Record<string, "success" | "warning" | "error" | "neutral"> = { agotado: "error", stock_bajo: "warning", disponible: "success", no_controlado: "neutral" };
// "Alertas com prioridade": agotado siempre antes que stock_bajo, y ambos
// antes que el resto -- para que el riesgo se vea sin tener que escanear
// toda la lista (Fase 11 del Plano Mestre).
const STOCK_PRIORITY: Record<string, number> = { agotado: 0, stock_bajo: 1, disponible: 2, no_controlado: 3 };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; tipo?: string }> }) {
  const { q = "", estado = "todos", tipo = "todos" } = await searchParams;
  const db: any = await createClient();
  const [{ data: statusRows }, { data: movements }, { data: alertsRows }] = await Promise.all([
    db.rpc("variant_stock_status"),
    db.from("product_stock_movements").select("id,product_variant_id,type,quantity,notes,created_by,created_at").order("created_at", { ascending: false }).limit(20),
    db.rpc("inventory_dashboard_alerts"),
  ]);
  const recentMermas = alertsRows?.[0]?.recent_mermas_count ?? 0;

  const rows = (statusRows ?? []).slice().sort((a: any, b: any) => a.product_name.localeCompare(b.product_name) || a.variant_name.localeCompare(b.variant_name));
  const tracked = rows.filter((row: any) => row.stock_tracking);
  const untracked = rows.filter((row: any) => !row.stock_tracking);

  const lowStock = tracked.filter((row: any) => row.stock_state === "stock_bajo");
  const outOfStock = tracked.filter((row: any) => row.stock_state === "agotado");
  const totalUnits = tracked.reduce((sum: number, row: any) => sum + row.stock_quantity, 0);
  const totalReserved = tracked.reduce((sum: number, row: any) => sum + row.reserved_quantity, 0);
  const totalAvailable = tracked.reduce((sum: number, row: any) => sum + row.available_quantity, 0);

  const needle = q.trim().toLowerCase();
  const visibleTracked = tracked
    .filter((row: any) => {
      const matchesQuery = !needle || row.product_name.toLowerCase().includes(needle) || row.variant_name.toLowerCase().includes(needle);
      const matchesEstado =
        estado === "todos" ||
        (estado === "disponible" && row.stock_state === "disponible") ||
        (estado === "bajo" && row.stock_state === "stock_bajo") ||
        (estado === "agotado" && row.stock_state === "agotado") ||
        (estado === "reservado" && row.reserved_quantity > 0);
      return matchesQuery && matchesEstado;
    })
    .sort((a: any, b: any) => (STOCK_PRIORITY[a.stock_state] ?? 9) - (STOCK_PRIORITY[b.stock_state] ?? 9) || a.product_name.localeCompare(b.product_name));

  const visibleMovements = (movements ?? []).filter((m: any) => tipo === "todos" || m.type === tipo);

  const variantLabel = (variantId: string) => {
    const row = rows.find((r: any) => r.variant_id === variantId);
    return row ? `${row.product_name} · ${row.variant_name}` : "Variante eliminada";
  };
  const actorIds = [...new Set((movements ?? []).map((m: any) => m.created_by).filter((id: unknown): id is string => Boolean(id)))];
  const { data: actors } = actorIds.length ? await db.from("profiles").select("id,full_name").in("id", actorIds) : { data: [] as { id: string; full_name: string | null }[] };
  const actorName = (id: string | null) => (id ? actors?.find((a: any) => a.id === id)?.full_name ?? "Equipo" : "Sistema");
  const lastMovementLabel = (value: string | null) => (value ? new Date(value).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "Sin movimientos");

  return (
    <>
      <AdminPageHeader title="Inventario" description="Estoque de variantes con seguimiento activo: congelados, envasados y otros productos con inventario físico. El pan de horneado diario sigue gobernado por Producción/Disponibilidad." />

      <div className="analytics-metrics">
        <Metric label="Stock total" value={String(totalUnits)} icon="inventario" tone="primary" />
        <Metric label="Reservado" value={String(totalReserved)} icon="inventario" tone="information" />
        <Metric label="Disponible" value={String(totalAvailable)} icon="listo" tone="success" />
        <Metric label="Stock bajo" value={String(lowStock.length)} icon="inventario" tone="warning" />
        <Metric label="Sin stock" value={String(outOfStock.length)} icon="inventario" tone="error" />
        <Metric label="Mermas (24h)" value={String(recentMermas)} icon="inventario" tone="error" />
      </div>

      {outOfStock.length || lowStock.length ? (
        <Alert variant="warning" title="Estoque que necesita atención">
          {outOfStock.length ? `${outOfStock.length} variante${outOfStock.length === 1 ? "" : "s"} sin stock` : null}
          {outOfStock.length && lowStock.length ? " · " : null}
          {lowStock.length ? `${lowStock.length} con stock bajo` : null}
        </Alert>
      ) : tracked.length ? (
        <Alert variant="success" title="Estoque bajo control">Todas las variantes con seguimiento tienen stock disponible.</Alert>
      ) : null}

      {tracked.length ? (
        <>
          <form className="admin-filters">
            <label>Buscar<input type="search" name="q" defaultValue={q} placeholder="Producto o variante…" /></label>
            <label>
              Estado
              <select name="estado" defaultValue={estado}>
                <option value="todos">Todos</option>
                <option value="disponible">Disponible</option>
                <option value="bajo">Stock bajo</option>
                <option value="agotado">Sin stock</option>
                <option value="reservado">Reservado</option>
              </select>
            </label>
            {tipo !== "todos" ? <input type="hidden" name="tipo" value={tipo} /> : null}
            <button className="button button--primary" type="submit">Filtrar</button>
          </form>

          {visibleTracked.length ? (
            <ul className="inventory-list">
              {visibleTracked.map((row: any) => (
                <li key={row.variant_id} className="inventory-row">
                  <div className="inventory-row__main">
                    <p className="inventory-row__product">{row.product_name}</p>
                    <p className="inventory-row__variant">{row.variant_name} · mín. {row.low_stock_threshold ?? "global"} · último mov. {lastMovementLabel(row.last_movement_at)}</p>
                  </div>
                  <div className="inventory-row__stock">
                    <Badge variant={STOCK_BADGE_VARIANT[row.stock_state]}>{STOCK_LABEL[row.stock_state]}</Badge>
                    <span className="inventory-row__qty">{row.stock_quantity} stock · {row.reserved_quantity} reserv. · {row.available_quantity} disp.</span>
                  </div>
                  <div className="inventory-row__actions">
                    <StockMovementButton variantId={row.variant_id} productName={row.product_name} variantName={row.variant_name} productId={row.product_id} />
                    <InventoryRowActions variantId={row.variant_id} variantName={`${row.product_name} — ${row.variant_name}`} productId={row.product_id} enabled={row.stock_tracking} threshold={row.low_stock_threshold} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sin resultados" description="Ningún producto o variante coincide con ese filtro." />
          )}
        </>
      ) : (
        <EmptyState
          title="Sin variantes con seguimiento de estoque"
          description="Activa el seguimiento en una variante de la lista de abajo (por ejemplo, congelados o envasados) para empezar a registrar entradas y salidas."
        />
      )}

      <section className="admin-subsection">
        <h2>Historial de movimientos</h2>
        <p className="field__help">Últimos 20 movimientos registrados, manuales y automáticos (ventas y cancelaciones).</p>
        <form className="admin-filters">
          <label>
            Tipo
            <select name="tipo" defaultValue={tipo}>
              <option value="todos">Todos</option>
              {Object.entries(MOVEMENT_LABELS_ES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {q ? <input type="hidden" name="q" value={q} /> : null}
          {estado !== "todos" ? <input type="hidden" name="estado" value={estado} /> : null}
          <button className="button button--secondary" type="submit">Filtrar</button>
        </form>
        {visibleMovements.length ? (
          <ul className="inventory-list">
            {visibleMovements.map((movement: any) => (
              <li key={movement.id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product">{variantLabel(movement.product_variant_id)}</p>
                  <p className="inventory-row__variant">
                    {new Date(movement.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })} · {actorName(movement.created_by)}
                  </p>
                </div>
                <div className="inventory-row__stock">
                  <Badge variant={MOVEMENT_BADGE_VARIANT[movement.type] ?? "neutral"}>{MOVEMENT_LABELS_ES[movement.type] ?? movement.type}</Badge>
                  <span className={movement.quantity < 0 ? "admin-movement-qty admin-movement-qty--negative" : "admin-movement-qty admin-movement-qty--positive"}>
                    {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                  </span>
                </div>
                {movement.notes ? <p className="inventory-row__notes">&ldquo;{movement.notes}&rdquo;</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="field__help">{tipo === "todos" ? "Todavía no se han registrado movimientos de estoque." : "Ningún movimiento reciente de este tipo."}</p>
        )}
      </section>

      <section className="admin-subsection">
        <h2>Variantes sin seguimiento</h2>
        <p className="field__help">El pan de horneado diario normalmente no necesita seguimiento de estoque: su disponibilidad ya la gobierna la capacidad de producción por fecha.</p>
        {untracked.length ? (
          <ul className="inventory-list">
            {untracked.map((row: any) => (
              <li key={row.variant_id} className="inventory-row">
                <div className="inventory-row__main">
                  <p className="inventory-row__product">{row.product_name}</p>
                  <p className="inventory-row__variant">{row.variant_name}</p>
                </div>
                <div className="inventory-row__actions">
                  <StockTrackingToggle variantId={row.variant_id} enabled={row.stock_tracking} productId={row.product_id} />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="field__help">No hay más variantes.</p>}
      </section>
    </>
  );
}
