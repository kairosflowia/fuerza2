import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { getSupabasePublicEnvironment, isSupabaseConfigured } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

export * from "@/lib/pickup-points-domain";

function publicClient() {
  const { url, anonKey } = getSupabasePublicEnvironment();
  return createSupabaseClient<Database>(url, anonKey, { auth: { persistSession: false } });
}

export type PublicPickupPoint = Database["public"]["Views"]["pickup_points_public"]["Row"] & {
  openingHours: Database["public"]["Views"]["pickup_point_opening_hours_public"]["Row"][];
  collectionWindows: Database["public"]["Views"]["pickup_point_collection_windows_public"]["Row"][];
  upcomingException: Database["public"]["Views"]["pickup_point_exceptions_public"]["Row"] | null;
};

async function loadPublicPickupPoints(): Promise<{ points: PublicPickupPoint[]; closures: Database["public"]["Views"]["global_closures_public"]["Row"][] }> {
  if (!isSupabaseConfigured()) return { points: [], closures: [] };
  const db = publicClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: points }, { data: hours }, { data: windows }, { data: exceptions }, { data: closures }] = await Promise.all([
    db.from("pickup_points_public").select("*").order("display_order"),
    db.from("pickup_point_opening_hours_public").select("*"),
    db.from("pickup_point_collection_windows_public").select("*"),
    db.from("pickup_point_exceptions_public").select("*").gte("exception_date", today).order("exception_date"),
    db.from("global_closures_public").select("*").gte("ends_on", today).order("starts_on"),
  ]);

  const merged = (points ?? []).map((point) => ({
    ...point,
    openingHours: (hours ?? []).filter((h) => h.pickup_point_id === point.id),
    collectionWindows: (windows ?? []).filter((w) => w.pickup_point_id === point.id),
    upcomingException: (exceptions ?? []).find((e) => e.pickup_point_id === point.id) ?? null,
  }));

  return { points: merged, closures: closures ?? [] };
}

export const getPublicPickupPoints = unstable_cache(loadPublicPickupPoints, ["public-pickup-points"], {
  revalidate: 60,
  tags: ["pickup-points"],
});
