import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Button, EmptyState } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";
import { createClient } from "@/lib/supabase/server";

const CHANNEL_LABELS_ES: Record<string, string> = { web: "Web", whatsapp: "WhatsApp", phone: "Teléfono", in_person: "Presencial" };
const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "error" | "neutral" | "information"> = {
  draft: "neutral",
  pending_payment: "warning",
  payment_processing: "warning",
  confirmed: "information",
  ready: "success",
  collected: "success",
  cancelled: "error",
  refunded: "neutral",
  partially_refunded: "neutral",
};
const PAYMENT_BADGE_VARIANT: Record<string, "success" | "warning" | "error" | "neutral"> = {
  not_started: "neutral",
  pending: "warning",
  processing: "warning",
  paid: "success",
  failed: "error",
  cancelled: "neutral",
  refunded: "neutral",
  partially_refunded: "neutral",
};

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const { q = "", estado = "todos" } = await searchParams;
  const db = await createClient();
  let query = db.from("orders").select("id,public_code,customer_name,collection_date,total_cents,status,payment_status,channel,created_at").order("created_at", { ascending: false }).limit(100);
  if (estado !== "todos") query = query.eq("status", estado as any);
  const { data: orders } = await query;
  const needle = q.trim().toLowerCase();
  const visible = (orders ?? []).filter((o) => !needle || o.public_code.toLowerCase().includes(needle) || (o.customer_name ?? "").toLowerCase().includes(needle));

  return (
    <>
      <AdminPageHeader
        title="Pedidos"
        description="Pedidos del sitio y registrados manualmente por WhatsApp, teléfono o presencial."
        actions={<Link href="/admin/pedidos/nuevo"><Button type="button">Nuevo pedido manual</Button></Link>}
      />
      <form className="admin-filters">
        <label>Buscar<input type="search" name="q" defaultValue={q} placeholder="Código o cliente…" /></label>
        <label>
          Estado
          <select name="estado" defaultValue={estado}>
            <option value="todos">Todos</option>
            <option value="pending_payment">Pago pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="ready">Listo para recoger</option>
            <option value="collected">Recogido</option>
            <option value="cancelled">Cancelado</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </label>
        <button type="submit" className="button button--primary">Filtrar</button>
      </form>
      {visible.length ? (
        <ul className="inventory-list">
          {visible.map((o) => (
            <li key={o.id} className="inventory-row">
              <div className="inventory-row__main">
                <p className="inventory-row__product"><Link href={`/admin/pedidos/${o.id}`}>{o.public_code}</Link></p>
                <p className="inventory-row__variant">{o.customer_name} · {CHANNEL_LABELS_ES[o.channel] ?? o.channel} · recoge {o.collection_date}</p>
              </div>
              <div className="inventory-row__stock">
                <Badge variant={STATUS_BADGE_VARIANT[o.status] ?? "neutral"}>{o.status}</Badge>
                <Badge variant={PAYMENT_BADGE_VARIANT[o.payment_status] ?? "neutral"}>{o.payment_status}</Badge>
                <span className="inventory-row__qty">{formatPrice(o.total_cents)}</span>
              </div>
              <div className="inventory-row__actions">
                <Link href={`/admin/pedidos/${o.id}`} className="button button--secondary">Ver pedido</Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Todavía no hay pedidos" description="Aparecerán aquí después de iniciar el checkout o de registrar un pedido manual." />
      )}
    </>
  );
}
