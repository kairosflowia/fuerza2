import Image from "next/image";
import Link from "next/link";
import { toggleProductStatusAction } from "./actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FamilyManager } from "@/components/admin/family-manager";
import { Badge, Button, EmptyState } from "@/components/ui";
import { EditIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = { draft: "Borrador", active: "Activo", seasonal: "De temporada", unavailable: "No disponible", discontinued: "Retirado" };
const STATUS_VARIANT: Record<string, "neutral" | "success" | "warning" | "error" | "information"> = { draft: "neutral", active: "success", seasonal: "information", unavailable: "warning", discontinued: "error" };
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("");

export default async function ProductsAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; familia?: string }> }) {
  const { q, familia } = await searchParams;
  const db = await createClient();
  let productsQuery = db.from("products").select("*").order("display_order");
  if (q) productsQuery = productsQuery.ilike("name", `%${q}%`);
  if (familia) productsQuery = productsQuery.eq("family_id", familia);
  const [{ data: products }, { data: families }, { data: variants }, { data: images }] = await Promise.all([
    productsQuery,
    db.from("product_families").select("*").order("display_order"),
    db.from("product_variants").select("product_id,price_cents,status"),
    db.from("product_images").select("product_id,storage_path,alt_text,is_primary").order("display_order"),
  ]);
  const familyById = new Map((families ?? []).map((f: { id: string }) => [f.id, f]));

  return (
    <>
      <AdminPageHeader
        title="Productos"
        description="Catálogo, familias y estado de publicación."
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
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Producto</th><th>Precio</th><th>Disponibilidad</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const family = familyById.get(p.family_id) as { name: string } | undefined;
                const productImages = (images ?? []).filter((i: { product_id: string }) => i.product_id === p.id);
                const image = productImages.find((i: { is_primary: boolean }) => i.is_primary) ?? productImages[0];
                const productVariants = (variants ?? []).filter((v: { product_id: string }) => v.product_id === p.id);
                const prices = productVariants.flatMap((v: { price_cents: number | null }) => (v.price_cents === null ? [] : [v.price_cents]));
                const hasActiveVariant = productVariants.some((v: { status: string; price_cents: number | null }) => v.status === "active" && v.price_cents !== null);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-product-cell">
                        {image ? (
                          <Image className="admin-product-thumb" src={`/api/product-images/${image.storage_path}`} alt={image.alt_text ?? p.name} width={48} height={48} />
                        ) : (
                          <span className="admin-product-thumb admin-product-thumb--placeholder" aria-hidden="true">{initials(p.name)}</span>
                        )}
                        <div>
                          <p className="admin-product-cell__name">{p.name}</p>
                          <p className="admin-product-cell__family">{family?.name ?? "Sin familia"}</p>
                        </div>
                      </div>
                    </td>
                    <td>{prices.length ? formatPrice(Math.min(...prices)) : "—"}</td>
                    <td><span className={`admin-stock admin-stock--${hasActiveVariant ? "available" : "out"}`}>{hasActiveVariant ? "En carta" : "Agotado"}</span></td>
                    <td><Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge></td>
                    <td className="admin-table__actions">
                      <Link className="button button--icon" href={`/admin/productos/${p.id}/editar`} aria-label={`Editar ${p.name}`}><EditIcon /></Link>
                      {p.status === "active" || p.status === "draft" ? (
                        <form action={toggleProductStatusAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="slug" value={p.slug} />
                          <input type="hidden" name="next" value={p.status === "active" ? "draft" : "active"} />
                          <Button type="submit" variant="icon" aria-label={p.status === "active" ? `Pasar ${p.name} a borrador` : `Publicar ${p.name}`}>
                            {p.status === "active" ? <EyeOffIcon /> : <EyeIcon />}
                          </Button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Todavía no hay productos" description="Crea una categoría y después registra el primer producto real." />
      )}
    </>
  );
}
