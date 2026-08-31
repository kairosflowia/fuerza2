import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewOrderForm } from "@/components/admin/new-order-form";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewStaffOrderPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "pedidos")) redirect("/cuenta/acceso-denegado");

  const { customer: customerId } = await searchParams;
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

  const canManage = identity.roles.some((r) => r === "owner" || r === "admin");

  // admin_customer_directory() no admite búsqueda por id, solo por texto: se
  // reutiliza igual, pidiendo el directorio completo y filtrando aquí, en
  // vez de crear una función nueva solo para este pre-relleno (Fase 13).
  let prefill: { name: string; phone: string; email: string } | undefined;
  if (customerId && canManage) {
    const { data: directory } = await (db as any).rpc("admin_customer_directory", { p_query: null });
    const match = directory?.find((c: any) => c.customer_id === customerId);
    if (match) prefill = { name: match.full_name ?? "", phone: match.phone ?? "", email: match.email ?? "" };
  }

  return (
    <>
      <AdminPageHeader
        title="Nuevo pedido manual"
        description="Registra un pedido tomado por WhatsApp, teléfono o presencial. Descuenta disponibilidad y estoque igual que un pedido del sitio."
      />
      <NewOrderForm variants={items} pickupPoints={points ?? []} canSearchCustomers={canManage} prefill={prefill} />
    </>
  );
}
