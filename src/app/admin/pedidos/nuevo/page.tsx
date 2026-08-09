import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewOrderForm } from "@/components/admin/new-order-form";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewStaffOrderPage() {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "pedidos")) redirect("/cuenta/acceso-denegado");

  const db = await createClient();
  const [{ data: variants }, { data: products }, { data: points }] = await Promise.all([
    db.from("product_variants").select("id,name,price_cents,product_id").eq("status", "active").not("price_cents", "is", null).order("name"),
    db.from("products").select("id,name").eq("status", "active").order("name"),
    db.from("pickup_points").select("id,name").eq("status", "active").order("name"),
  ]);
  const productName = (id: string) => products?.find((p) => p.id === id)?.name ?? "Producto";
  const items = (variants ?? [])
    .map((v) => ({ id: v.id, label: `${productName(v.product_id)} — ${v.name}`, priceCents: v.price_cents! }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <AdminPageHeader
        title="Nuevo pedido manual"
        description="Registra un pedido tomado por WhatsApp, teléfono o presencial. Descuenta disponibilidad y estoque igual que un pedido del sitio."
      />
      <NewOrderForm variants={items} pickupPoints={points ?? []} />
    </>
  );
}
