"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnvironment } from "./env";
import type { Database } from "./database.types";

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnvironment();
  return createBrowserClient<Database>(url, anonKey);
}
