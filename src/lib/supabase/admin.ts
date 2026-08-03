import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabasePublicEnvironment, getSupabaseServiceRoleKey } from "./env";

export function createAdminClient() {
  const { url } = getSupabasePublicEnvironment();
  return createClient<Database>(url, getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
