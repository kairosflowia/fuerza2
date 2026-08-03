import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getSupabasePublicEnvironment, isSupabaseConfigured } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

export type CatalogProduct = Database["public"]["Tables"]["products"]["Row"] & {
  family: Database["public"]["Tables"]["product_families"]["Row"] | null;
  variants: Database["public"]["Tables"]["product_variants"]["Row"][];
  images: Database["public"]["Tables"]["product_images"]["Row"][];
};

function publicClient() {
  const { url, anonKey } = getSupabasePublicEnvironment();
  return createSupabaseClient<Database>(url, anonKey, { auth: { persistSession: false } });
}

async function loadCatalog(): Promise<CatalogProduct[]> {
  if (!isSupabaseConfigured()) return [];
  const db = publicClient();
  const [{ data: products }, { data: families }, { data: variants }, { data: images }] = await Promise.all([
    db.from("products").select("*").in("status", ["active", "seasonal"]).order("display_order"),
    db.from("product_families").select("*").eq("status", "active").order("display_order"),
    db.from("product_variants").select("*").eq("status", "active").order("display_order"),
    db.from("product_images").select("*").order("display_order"),
  ]);
  return (products ?? []).map((product) => ({ product, family: (families ?? []).find((f) => f.id === product.family_id) ?? null, variants: (variants ?? []).filter((v) => v.product_id === product.id), images: (images ?? []).filter((i) => i.product_id === product.id) })).map(({product,...related})=>({...product,...related}));
}

export const getPublicCatalog = unstable_cache(loadCatalog, ["public-catalog"], { revalidate: 60, tags: ["catalog"] });
export async function getPublicProduct(slug: string) { return (await getPublicCatalog()).find((product) => product.slug === slug) ?? null; }
export { formatPrice } from "./catalog-domain";
