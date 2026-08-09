import { redirect } from "next/navigation";

import { deleteWeeklySpecialAction } from "../actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { WeeklySpecialForm } from "@/components/admin/weekly-special-form";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function nextSaturdays(count: number) {
  const options: { value: string; label: string }[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getDay() !== 6) cursor.setDate(cursor.getDate() + 1);
  for (let i = 0; i < count; i++) {
    const date = new Date(cursor);
    date.setDate(date.getDate() + i * 7);
    const value = date.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(date);
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

export default async function WeeklySpecialAdminPage() {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "productos")) redirect("/cuenta/acceso-denegado");

  const db = await createClient();
  const [{ data: products }, { data: variants }, { data: specials }] = await Promise.all([
    db.from("products").select("id,name").eq("status", "active").order("name"),
    db.from("product_variants").select("product_id,status,price_cents"),
    db.from("weekly_specials").select("id,product_id,collection_date,headline").order("collection_date", { ascending: false }).limit(20),
  ]);

  const sellableProducts = (products ?? [])
    .filter((p) => (variants ?? []).some((v) => v.product_id === p.id && v.status === "active" && v.price_cents !== null))
    .map((p) => ({ id: p.id, label: p.name }));
  const productName = (id: string) => products?.find((p) => p.id === id)?.name ?? "Producto eliminado";

  return (
    <>
      <AdminPageHeader
        title="Especial de la semana"
        description="Cada sábado se destaca un producto distinto, ya publicado en el catálogo (Documento funcional del cliente, sección 4)."
      />
      <Card>
        {sellableProducts.length ? (
          <WeeklySpecialForm products={sellableProducts} saturdays={nextSaturdays(8)} />
        ) : (
          <EmptyState title="Sin productos publicables" description="Publica al menos un producto con precio en /admin/productos antes de curar el especial de la semana." />
        )}
      </Card>

      {specials?.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Sábado</th><th>Producto</th><th>Titular</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {specials.map((s) => {
                const isPast = s.collection_date < new Date().toISOString().slice(0, 10);
                return (
                  <tr key={s.id}>
                    <td>{s.collection_date}{isPast ? <Badge variant="neutral"> Pasado</Badge> : null}</td>
                    <td>{productName(s.product_id)}</td>
                    <td>{s.headline ?? "—"}</td>
                    <td className="admin-table__actions">
                      <form action={deleteWeeklySpecialAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <Button type="submit" variant="destructive">Quitar</Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
