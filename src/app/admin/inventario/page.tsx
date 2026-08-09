import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StockMovementForm, StockTrackingToggle } from "@/components/admin/stock-movement-form";
import { Badge, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const db = await createClient();
  const [{ data: variants }, { data: products }] = await Promise.all([
    db.from("product_variants").select("id,name,status,stock_tracking,stock_quantity,product_id").order("name"),
    db.from("products").select("id,name").order("name"),
  ]);
  const productName = (id: string) => products?.find((p) => p.id === id)?.name ?? "Producto";
  const rows = (variants ?? [])
    .map((variant) => ({ ...variant, productName: productName(variant.product_id) }))
    .sort((a, b) => a.productName.localeCompare(b.productName) || a.name.localeCompare(b.name));
  const tracked = rows.filter((row) => row.stock_tracking);
  const untracked = rows.filter((row) => !row.stock_tracking);

  return (
    <>
      <AdminPageHeader title="Inventario" description="Estoque de variantes con seguimiento activo: congelados, envasados y otros productos con inventario físico. El pan de horneado diario sigue gobernado por Producción/Disponibilidad." />

      {tracked.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Producto</th><th>Variante</th><th>Estoque actual</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {tracked.map((row) => (
                <tr key={row.id}>
                  <td>{row.productName}</td>
                  <td>{row.name}</td>
                  <td>
                    <span className={`admin-stock admin-stock--${row.stock_quantity > 0 ? "available" : "out"}`}>
                      {row.stock_quantity} unidad{row.stock_quantity === 1 ? "" : "es"}
                    </span>
                  </td>
                  <td><Badge variant={row.status === "active" ? "success" : "neutral"}>{row.status}</Badge></td>
                  <td className="admin-table__actions">
                    <details className="admin-accordion admin-accordion--inline">
                      <summary>Movimiento</summary>
                      <div className="admin-accordion__body">
                        <StockMovementForm variantId={row.id} />
                      </div>
                    </details>
                    <StockTrackingToggle variantId={row.id} enabled={row.stock_tracking} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Sin variantes con seguimiento de estoque"
          description="Activa el seguimiento en una variante de la lista de abajo (por ejemplo, congelados o envasados) para empezar a registrar entradas y salidas."
        />
      )}

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
