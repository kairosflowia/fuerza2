import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CustomerTabs } from "@/components/admin/customer-tabs";
import { Badge, EmptyState } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { getAdminSection } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomersAdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "clientes")) redirect("/cuenta/acceso-denegado");
  const section = getAdminSection("clientes")!;

  const db: any = await createClient();
  const { data: customers } = await db.rpc("admin_customer_directory", { p_query: q.trim() || null });
  const customerIds = (customers ?? []).map((c: any) => c.customer_id);
  const { data: activeSubs } = customerIds.length
    ? await db.from("subscriptions").select("customer_id").eq("status", "active").in("customer_id", customerIds)
    : { data: [] as { customer_id: string }[] };
  const habitualIds = new Set((activeSubs ?? []).map((s: any) => s.customer_id));

  return (
    <>
      <AdminPageHeader title={section.label} description={section.description} />
      <CustomerTabs />
      <form className="admin-filters">
        <label>Buscar<input type="search" name="q" defaultValue={q} placeholder="Nombre, email o teléfono…" /></label>
        <button type="submit" className="button button--primary">Filtrar</button>
      </form>
      {customers?.length ? (
        <ul className="inventory-list">
          {customers.map((c: any) => (
            <li key={c.customer_id} className="inventory-row">
              <div className="inventory-row__main">
                <p className="inventory-row__product">
                  <Link href={`/admin/clientes/${c.customer_id}`}>{c.full_name || "Sin nombre"}</Link>
                  {habitualIds.has(c.customer_id) ? <Badge variant="primary">Fuerza Habitual</Badge> : null}
                </p>
                <p className="inventory-row__variant">
                  {c.email}{c.phone ? ` · ${c.phone}` : ""}
                  {c.created_at ? ` · Cliente desde ${new Date(c.created_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                </p>
              </div>
              <div className="inventory-row__stock">
                <span className="inventory-row__qty">{c.orders_count} pedido{c.orders_count === 1 ? "" : "s"} pagado{c.orders_count === 1 ? "" : "s"} · {formatPrice(c.total_spent_cents ?? 0)}</span>
                <span className="inventory-row__qty">{c.last_order_at ? `Último pedido ${new Date(c.last_order_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}` : "Sin pedidos todavía"}</span>
              </div>
              <div className="inventory-row__actions">
                <Link href={`/admin/clientes/${c.customer_id}`} className="button button--secondary">Ver ficha</Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={q ? "Sin resultados" : "Todavía no hay clientes registrados"}
          description={q ? "Ningún cliente coincide con esa búsqueda." : "Aparecerán aquí en cuanto alguien cree una cuenta en /cuenta/crear."}
        />
      )}
    </>
  );
}
