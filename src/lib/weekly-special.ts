import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getSupabasePublicEnvironment, isSupabaseConfigured } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";
import { getPublicCatalog } from "@/lib/catalog";

export type WeeklySpecial = {
  collectionDate: string;
  headline: string | null;
  product: {
    slug: string;
    familySlug: string | null;
    name: string;
    shortDescription: string | null;
    imagePath: string | null;
    imageAlt: string;
    priceCents: number | null;
  };
};

function publicClient() {
  const { url, anonKey } = getSupabasePublicEnvironment();
  return createSupabaseClient<Database>(url, anonKey, { auth: { persistSession: false } });
}

async function loadWeeklySpecial(): Promise<WeeklySpecial | null> {
  if (!isSupabaseConfigured()) return null;
  const db = publicClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await db
    .from("weekly_specials")
    .select("product_id,collection_date,headline")
    .gte("collection_date", today)
    .order("collection_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  const catalog = await getPublicCatalog();
  const product = catalog.find((p) => p.id === data.product_id);
  if (!product) return null;
  const prices = product.variants.flatMap((v) => (v.price_cents === null ? [] : [v.price_cents]));
  const image = product.images.find((i) => i.is_primary) ?? product.images[0];

  return {
    collectionDate: data.collection_date,
    headline: data.headline,
    product: {
      slug: product.slug,
      familySlug: product.family?.slug ?? null,
      name: product.name,
      shortDescription: product.short_description,
      imagePath: image?.storage_path ?? null,
      imageAlt: image?.alt_text ?? "",
      priceCents: prices.length ? Math.min(...prices) : null,
    },
  };
}

export const getCurrentWeeklySpecial = unstable_cache(loadWeeklySpecial, ["weekly-special"], { revalidate: 60, tags: ["weekly-special", "catalog"] });
