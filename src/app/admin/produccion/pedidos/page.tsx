import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductionTabs } from "@/components/admin/production-tabs";
import { Badge, EmptyState } from "@/components/ui";
import { ArrowRightIcon } from "@/components/ui/icons";
import { isoToday } from "@/lib/production-date";
import { createClient } from "@/lib/supabase/server";

const ORDER_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" | "information" }> = {
  draft: { label: "Borrador", variant: "neutral" },
  pending_payment: { label: "Pago pendiente", variant: "neutral" },
  payment_processing: { label: "Procesando pago", variant: "neutral" },
  confirmed: { label: "Confirmado", variant: "information" },
  ready: { label: "Listo para recoger", variant: "success" },
  collected: { label: "Recogido", variant: "neutral" },
  cancelled: { label: "Cancelado", variant: "error" },
  refunded: { label: "Reembolsado", variant: "error" },
  partially_refunded: { label: "Reembolso parcial", variant: "warning" },
};
const ITEM_STATUS: Record<string, string> = {
  pending: "Pendiente", in_production: "En producción", produced: "Producido", packed: "Embalado",
  ready: "Listo", collected: "Recogido", cancelled: "Cancelado", issue: "Incidencia",
};

export default async function OperationalOrders({ searchParams }: { searchParams: Promise<{ fecha?: string; codigo?: string; producto?: string; estado?: string }> }) {
  const q = await searchParams;
  const date = q.fecha ?? isoToday();
  const db: any = await createClient();
  let query = db
    .from("orders")
    .select("id,public_code,customer_name,order_type,status,pickup_points(name),order_items!inner(id,product_name_snapshot,variant_name_snapshot,quantity,order_fulfillment_items(status,quantity_prepared))")
    .eq("collection_date", date)
    .eq("payment_status", "paid");
  if (q.codigo) query = query.ilike("public_code", `%${q.codigo}%`);
  if (q.producto) query = query.ilike("order_items.product_name_snapshot", `%${q.producto}%`);
  if (q.estado) query = query.eq("status", q.estado);
  const { data } = await query.order("public_code");

  return (
    <>
      <AdminPageHeader title="Pedidos del día" description="Consulta por código de pedido, producto o estado." />
      <ProductionTabs date={date} />
      <form className="admin-filters">
        <input type="hidden" name="fecha" value={date} />
        <label>Código de pedido<input type="search" name="codigo" placeholder="FZ-00123…" defaultValue={q.codigo} /></label>
        <label>Producto<input type="search" name="producto" placeholder="Nombre del producto…" defaultValue={q.producto} /></label>
        <label>
          Estado
          <select name="estado" defaultValue={q.estado ?? ""}>
            <option value="">Todos</option>
            {Object.entries(ORDER_STATUS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button type="submit" className="button button--secondary">Buscar</button>
      </form>
      {data?.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Pedido</th><th>Tipo</th><th>Punto</th><th>Estado</th><th>Productos</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {data.map((order: any) => {
                const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.confirmed;
                return (
                  <tr key={order.id}>
                    <td>
                      <p className="admin-product-cell__name">{order.public_code}</p>
                      <p className="admin-product-cell__family">{order.customer_name?.split(" ")[0] ?? "Cliente"}</p>
                    </td>
                    <td>{order.order_type === "subscription" ? "Plan de Pan" : "Venta suelta"}</td>
                    <td>{order.pickup_points?.name ?? "—"}</td>
                    <td><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td>
                      <ul className="production-order-items">
                        {order.order_items?.map((item: any) => (
                          <li key={item.id}>
                            {item.quantity} × {item.product_name_snapshot}
                            <span className="production-order-items__status">{ITEM_STATUS[item.order_fulfillment_items?.[0]?.status] ?? "Pendiente"}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <Link className="button button--icon" href={`/admin/pedidos/${order.id}`} aria-label={`Ver pedido ${order.public_code}`}><ArrowRightIcon /></Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No hay pedidos para estos filtros" description="Prueba a cambiar la fecha, el código o el nombre del producto." />
      )}
    </>
  );
}
