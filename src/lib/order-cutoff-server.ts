import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { getSupabasePublicEnvironment, isSupabaseConfigured } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";
import type { CutoffConfig } from "@/lib/order-cutoff";

function publicClient() {
  const { url, anonKey } = getSupabasePublicEnvironment();
  return createSupabaseClient<Database>(url, anonKey, { auth: { persistSession: false } });
}

async function loadCutoffConfig(): Promise<CutoffConfig> {
  if (!isSupabaseConfigured()) return null;
  const db = publicClient();
  const { data } = await db.from("app_settings").select("key,value").in("key", ["availability.cutoff_days_before", "availability.cutoff_time"]);
  const daysBefore = data?.find((row) => row.key === "availability.cutoff_days_before")?.value;
  const time = data?.find((row) => row.key === "availability.cutoff_time")?.value;
  if (typeof daysBefore !== "number" || typeof time !== "string") return null;
  return { daysBefore, time };
}

export const getCutoffConfig = unstable_cache(loadCutoffConfig, ["cutoff-config"], {
  revalidate: 60,
  tags: ["cutoff-config"],
});
