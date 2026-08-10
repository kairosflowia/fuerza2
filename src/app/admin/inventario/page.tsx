import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Metric } from "@/components/admin/analytics-view";
import { StockMovementButton, StockTrackingToggle } from "@/components/admin/stock-movement-form";
import { Alert, Badge, EmptyState } from "@/components/ui";
import { LOW_STOCK_THRESHOLD } from "@/lib/catalog-domain";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MOVEMENT_LABELS_ES: Record<string, string> = {
  entrada: "Entrada",
  venta: "Venta",
  merma: "Merma",
  ajuste: "Ajuste",
  devolucion: "Devolución",
};

const MOVEMENT_BADGE_VARIANT: Record<string, "success" | "information" | "error" | "warning" | "primary"> = {
  entrada: "success",
  venta: "information",
  merma: "error",
  ajuste: "warning",
  devolucion: "primary",
};

function stockBadge(quantity: number): { variant: "success" | "warning" | "error"; label: string } {
  if (quantity <= 0) return { variant: "error", label: "Agotado" };
  if (quantity <= LOW_STOCK_THRESHOLD) return { variant: "warning", label: "Stock bajo" };
  return { variant: "success", label: "Disponible" };
}

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const { q = "", estado = "todos" } = await searchParams;
  const db = await createClient();
  const [{ data: variants }, { data: products }, { data: movements }] = await Promise.all([
    db.from("product_variants").select("id,name,status,stock_tracking,stock_quantity,product_id").order("name"),
    db.from("products").select("id,name").order("name"),
    db.from("product_stock_movements").select("id,product_variant_id,type,quantity,notes,created_by,created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  const productName = (id: string) => products?.find((p) => p.id === id)?.name ?? "Producto";
  const rows = (variants ?? [])
    .map((variant) => ({ ...variant, productName: productName(variant.product_id) }))
    .sort((a, b) => a.productName.localeCompare(b.productName) || a.name.localeCompare(b.name));
  const tracked = rows.filter((row) => row.stock_tracking);
  const untracked = rows.filter((row) => !row.stock_tracking);

  const lowStock = tracked.filter((row) => row.stock_quantity > 0 && row.stock_quantity <= LOW_STOCK_THRESHOLD);
  const outOfStock = tracked.filter((row) => row.stock_quantity <= 0);
  const totalUnits = tracked.reduce((sum, row) => sum + Math.max(0, row.stock_quantity), 0);

  const needle = q.trim().toLowerCase();
  const visibleTracked = tracked.filter((row) => {
    const matchesQuery = !needle || row.productName.toLowerCase().includes(needle) || row.name.toLowerCase().includes(needle);
    const state = stockBadge(row.stock_quantity);
    const matchesEstado =
      estado === "todos" ||
      (estado === "disponible" && state.label === "Disponible") ||
      (estado === "bajo" && state.label === "Stock bajo") ||
      (estado === "agotado" && state.label === "Agotado");
    return matchesQuery && matchesEstado;
  });

  const variantLabel = (variantId: string) => {
    const row = rows.find((r) => r.id === variantId);
    return row ? `${row.productName} · ${row.name}` : "Variante eliminada";
  };
  const actorIds = [...new Set((movements ?? []).map((m) => m.created_by).filter((id): id is string => Boolean(id)))];
  const { data: actors } = actorIds.length ? await db.from("profiles").select("id,full_name").in("id", actorIds) : { data: [] as { id: string; full_name: string | null }[] };
  const actorName = (id: string | null) => (id ? actors?.find((a) => a.id === id)?.full_name ?? "Equipo" : "Sistema");

  return (
    <>
      <AdminPageHeader title="Inventario" description="Estoque de variantes con seguimiento activo: congelados, envasados y otros productos con inventario físico. El pan de horneado diario sigue gobernado por Producción/Disponibilidad." />

      <div className="analytics-metrics">
        <Metric label="Variantes con seguimiento" value={String(tracked.length)} />
        <Metric label="Unidades en stock" value={String(totalUnits)} />
        <Metric label="Stock bajo" value={String(lowStock.length)} detail={`Umbral: ${LOW_STOCK_THRESHOLD} unidades o menos`} />
        <Metric label="Agotados" value={String(outOfStock.length)} />
      </div>

      {outOfStock.length || lowStock.length ? (
        <Alert variant="warning" title="Estoque que necesita atención">
          {outOfStock.length ? `${outOfStock.length} variante${outOfStock.length === 1 ? "" : "s"} agotada${outOfStock.length === 1 ? "" : "s"}` : null}
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
                <option value="agotado">Agotado</option>
              </select>
            </label>
            <button className="button button--primary" type="submit">Filtrar</button>
          </form>

          {visibleTracked.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Producto</th><th>Variante</th><th>Estoque actual</th><th>Publicación</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {visibleTracked.map((row) => {
                    const state = stockBadge(row.stock_quantity);
                    return (
                      <tr key={row.id}>
                        <td>{row.productName}</td>
                        <td>{row.name}</td>
                        <td>
                          <div className="admin-stock-cell">
                            <Badge variant={state.variant}>{state.label}</Badge>
                            <span className="admin-stock-cell__value">{row.stock_quantity} unidad{row.stock_quantity === 1 ? "" : "es"}</span>
                          </div>
                        </td>
                        <td><Badge variant={row.status === "active" ? "success" : "neutral"}>{row.status}</Badge></td>
                        <td className="admin-table__actions">
                          <StockMovementButton variantId={row.id} productName={row.productName} variantName={row.name} />
                          <StockTrackingToggle variantId={row.id} enabled={row.stock_tracking} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
        <p className="field__help">Últimos 20 movimientos registrados, manuales y automáticos (ventas y devoluciones).</p>
        {movements?.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Fecha</th><th>Variante</th><th>Tipo</th><th>Cantidad</th><th>Notas</th><th>Registrado por</th></tr></thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{new Date(movement.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td>{variantLabel(movement.product_variant_id)}</td>
                    <td><Badge variant={MOVEMENT_BADGE_VARIANT[movement.type] ?? "neutral"}>{MOVEMENT_LABELS_ES[movement.type] ?? movement.type}</Badge></td>
                    <td className={movement.quantity < 0 ? "admin-movement-qty admin-movement-qty--negative" : "admin-movement-qty admin-movement-qty--positive"}>
                      {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                    </td>
                    <td>{movement.notes ?? "—"}</td>
                    <td>{actorName(movement.created_by)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="field__help">Todavía no se han registrado movimientos de estoque.</p>
        )}
      </section>

      <section className="admin-subsection">
        <h2>Variantes sin seguimiento</h2>
        <p className="field__help">El pan de horneado diario normalmente no necesita seguimiento de estoque: su disponibilidad ya la gobierna la capacidad de producción por fecha.</p>
        {untracked.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Producto</th><th>Variante</th><th>Acciones</th></tr></thead>
              <tbody>
                {untracked.map((row) => (
                  <tr key={row.id}>
                    <td>{row.productName}</td>
                    <td>{row.name}</td>
                    <td><StockTrackingToggle variantId={row.id} enabled={row.stock_tracking} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="field__help">No hay más variantes.</p>}
      </section>
    </>
  );
}
