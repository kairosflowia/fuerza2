import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/catalog-forms";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { createClient } from "@/lib/supabase/server";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const [{ data: product }, { data: variants }, { data: families }, { data: allergens }, { data: links }, { data: days }, { data: ingredientLinks }] = await Promise.all([
    db.from("products").select("*").eq("id", id).maybeSingle(),
    db.from("product_variants").select("*").eq("product_id", id).order("display_order"),
    db.from("product_families").select("id,name").order("display_order"),
    db.from("allergens").select("id,name").order("display_order"),
    db.from("product_allergens").select("allergen_id,presence_type").eq("product_id", id),
    db.from("product_production_weekdays").select("weekday").eq("product_id", id),
    db.from("product_ingredients").select("ingredient_id,display_order").eq("product_id", id).order("display_order"),
  ]);
  if (!product) notFound();
  const ids = (ingredientLinks ?? []).map((row) => row.ingredient_id);
  const { data: ingredientRows } = ids.length ? await db.from("ingredients").select("id,name").in("id", ids) : { data: [] };
  const ingredients = (ingredientLinks ?? []).map((link) => ingredientRows?.find((row) => row.id === link.ingredient_id)?.name).filter(Boolean).join(", ");
  return <><AdminPageHeader title={`Editar ${product.name}`} description="Los cambios publicados invalidan el catálogo público."/><ProductForm families={families ?? []} allergens={allergens ?? []} defaults={{ ...product, ingredients }} variants={variants ?? []} contains={(links ?? []).filter((row) => row.presence_type === "contains").map((row) => row.allergen_id)} mayContain={(links ?? []).filter((row) => row.presence_type === "may_contain").map((row) => row.allergen_id)} weekdays={(days ?? []).map((row) => row.weekday)}/></>;
}
