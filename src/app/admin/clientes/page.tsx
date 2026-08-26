import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/ui";
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

  const db = await createClient();
  const { data: customers } = await db.rpc("admin_customer_directory", { p_query: q.trim() || null });

  return (
    <>
      <AdminPageHeader title={section.label} description={section.description} />
      <form className="admin-filters">
        <label>Buscar<input type="search" name="q" defaultValue={q} placeholder="Nombre, email o teléfono…" /></label>
        <button type="submit" className="button button--primary">Filtrar</button>
      </form>
      {customers?.length ? (
        <ul className="inventory-list">
          {customers.map((c) => (
            <li key={c.customer_id} className="inventory-row">
              <div className="inventory-row__main">
                <p className="inventory-row__product">{c.full_name || "Sin nombre"}</p>
                <p className="inventory-row__variant">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
              </div>
              <div className="inventory-row__stock">
                <span className="inventory-row__qty">{c.orders_count} pedido{c.orders_count === 1 ? "" : "s"} pagado{c.orders_count === 1 ? "" : "s"} · {formatPrice(c.total_spent_cents ?? 0)}</span>
                <span className="inventory-row__qty">Registrado el {new Date(c.created_at).toLocaleDateString("es-ES", { dateStyle: "medium" })}</span>
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
