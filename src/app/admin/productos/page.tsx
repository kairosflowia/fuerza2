import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FamilyManager } from "@/components/admin/family-manager";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Badge, EmptyState } from "@/components/ui";
import { formatPrice } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = { draft: "Borrador", active: "Activo", seasonal: "De temporada", unavailable: "No disponible", discontinued: "Retirado" };
const STATUS_VARIANT: Record<string, "neutral" | "success" | "warning" | "error" | "information"> = { draft: "neutral", active: "success", seasonal: "information", unavailable: "warning", discontinued: "error" };
const STOCK_LABEL: Record<string, string> = { agotado: "Sin stock", stock_bajo: "Stock bajo", disponible: "Disponible" };
const STOCK_VARIANT: Record<string, "success" | "warning" | "error"> = { agotado: "error", stock_bajo: "warning", disponible: "success" };
const STOCK_PRIORITY = ["agotado", "stock_bajo", "disponible", "no_controlado"];
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("");

export default async function ProductsAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; familia?: string }> }) {
  const { q, familia } = await searchParams;
  const db = await createClient();
  let productsQuery = db.from("products").select("*").order("display_order");
  if (q) productsQuery = productsQuery.ilike("name", `%${q}%`);
  if (familia) productsQuery = productsQuery.eq("family_id", familia);
  const [{ data: products }, { data: families }, { data: variants }, { data: images }, { data: stockRows }] = await Promise.all([
    productsQuery,
    db.from("product_families").select("*").order("display_order"),
    db.from("product_variants").select("product_id,price_cents,status"),
    db.from("product_images").select("product_id,storage_path,alt_text,is_primary").order("display_order"),
    (db as any).rpc("variant_stock_status"),
  ]);
  const familyById = new Map((families ?? []).map((f: { id: string }) => [f.id, f]));

  return (
    <>
      <AdminPageHeader
        title="Productos"
        description="Catálogo, familias, estado de publicación e inventario."
        actions={
          <div className="admin-action-group">
            <FamilyManager families={families ?? []} />
            <Link className="button button--secondary" href="/admin/productos/especial-semana">Especial de la semana</Link>
            <Link className="button button--primary" href="/admin/productos/nuevo">Nuevo producto</Link>
          </div>
        }
      />
      <form className="admin-toolbar">
        <label className="admin-toolbar__search">
          Buscar
          <input type="search" name="q" placeholder="Nombre del producto…" defaultValue={q} />
        </label>
        <label>
          Categoría
          <select name="familia" defaultValue={familia ?? ""}>
            <option value="">Todas</option>
            {(families ?? []).map((f: { id: string; name: string }) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
        <button type="submit" className="button button--secondary">Filtrar</button>
      </form>
      {products?.length ? (
        <div className="product-list">
          <div className="product-list__header" aria-hidden="true">
            <span>Producto</span>
            <span>Precio</span>
            <span>Disponibilidad</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          <ul className="product-list__body">
            {products.map((p) => {
              const family = familyById.get(p.family_id) as { name: string } | undefined;
              const productImages = (images ?? []).filter((i: { product_id: string }) => i.product_id === p.id);
              const image = productImages.find((i: { is_primary: boolean }) => i.is_primary) ?? productImages[0];
              const productVariants = (variants ?? []).filter((v: { product_id: string }) => v.product_id === p.id);
              const prices = productVariants.flatMap((v: { price_cents: number | null }) => (v.price_cents === null ? [] : [v.price_cents]));
              const hasActiveVariant = productVariants.some((v: { status: string; price_cents: number | null }) => v.status === "active" && v.price_cents !== null);
              const productStock = (stockRows ?? []).filter((s: any) => s.product_id === p.id);
              const summaryState = productStock.length ? STOCK_PRIORITY.find((state) => productStock.some((s: any) => s.stock_state === state)) ?? "no_controlado" : "no_controlado";
              const availability =
                summaryState !== "no_controlado"
                  ? {
                      label: STOCK_LABEL[summaryState],
                      variant: STOCK_VARIANT[summaryState],
                      qty: `${productStock.reduce((n: number, s: any) => n + s.available_quantity, 0)} disp. · ${productStock.reduce((n: number, s: any) => n + s.reserved_quantity, 0)} reserv.`,
                    }
                  : hasActiveVariant
                    ? { label: "En carta", variant: "success" as const, qty: null }
                    : { label: "No controlado", variant: "neutral" as const, qty: null };
              return (
                <li key={p.id} className="product-row">
                  <div className="product-row__product">
                    {image ? (
                      <Image className="admin-product-thumb" src={`/api/product-images/${image.storage_path}`} alt={image.alt_text ?? p.name} width={40} height={40} />
                    ) : (
                      <span className="admin-product-thumb admin-product-thumb--placeholder" aria-hidden="true">{initials(p.name)}</span>
                    )}
                    <div className="product-row__product-text">
                      <p className="admin-product-cell__name">{p.name}</p>
                      <p className="admin-product-cell__family">{family?.name ?? "Sin familia"}</p>
                    </div>
                  </div>
                  <div className="product-row__price">{prices.length ? formatPrice(Math.min(...prices)) : "—"}</div>
                  <div className="product-row__availability">
                    <Badge variant={availability.variant}>{availability.label}</Badge>
                    {availability.qty ? <span className="product-row__availability-qty">{availability.qty}</span> : null}
                  </div>
                  <div className="product-row__status">
                    <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </div>
                  <div className="product-row__actions">
                    <Link className="button button--secondary" href={`/admin/productos/${p.id}/editar`}>
                      Editar
                    </Link>
                    {p.status !== "discontinued" ? (
                      <ProductRowActions productId={p.id} productSlug={p.slug} productName={p.name} status={p.status} />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <EmptyState title="Todavía no hay productos" description="Crea una categoría y después registra el primer producto real." />
      )}
    </>
  );
}
