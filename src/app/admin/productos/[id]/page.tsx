import Link from "next/link";
import { notFound } from "next/navigation";
import { discontinueProductAction, removeProductImageAction, uploadProductImageAction } from "../actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Button, Card, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export default async function ProductAdminDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const [{ data: product }, { data: variants }, { data: images }] = await Promise.all([
    db.from("products").select("*").eq("id", id).maybeSingle(),
    db.from("product_variants").select("*").eq("product_id", id).order("display_order"),
    db.from("product_images").select("*").eq("product_id", id).order("display_order"),
  ]);
  if (!product) notFound();
  return <><AdminPageHeader title={product.name} description={product.short_description ?? "Borrador sin descripción"}/><div className="admin-actions"><Badge>{product.status}</Badge><Link className="button button--primary" href={`/admin/productos/${id}/editar`}>Editar</Link></div><Card><h2>Variantes</h2>{variants?.map((variant)=><p key={variant.id}>{variant.name}: {variant.price_cents ?? "sin precio"} céntimos · IVA {variant.vat_rate}%</p>)}</Card><Card><h2>Imágenes</h2>{images?.map((image)=><div key={image.id}><p>{image.storage_path} · {image.alt_text}</p><form action={removeProductImageAction}><input type="hidden" name="image_id" value={image.id}/><input type="hidden" name="storage_path" value={image.storage_path}/><input type="hidden" name="slug" value={product.slug}/><Button type="submit" variant="destructive">Eliminar imagen</Button></form></div>)}<form action={uploadProductImageAction} className="admin-form"><input type="hidden" name="product_id" value={id}/><input type="hidden" name="slug" value={product.slug}/><Input id="image-alt" name="alt_text" label="Texto alternativo" required/><Input id="product-image" name="image" label="Imagen" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required/><label><input type="checkbox" name="is_primary"/> Imagen principal</label><Button type="submit">Subir imagen</Button></form></Card><form action={discontinueProductAction}><input type="hidden" name="id" value={id}/><input type="hidden" name="slug" value={product.slug}/><Button type="submit" variant="destructive">Retirar producto</Button></form></>;
}
