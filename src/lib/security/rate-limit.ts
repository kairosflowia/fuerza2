import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function enforceRateLimit(resource: string, limit: number, windowSeconds: number, userId?: string | null) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = `${userId ?? "guest"}:${forwarded ?? requestHeaders.get("x-real-ip") ?? "unknown"}`;
  const db = createAdminClient() as any;
  const { data, error } = await db.rpc("consume_rate_limit", { p_key:key,p_resource:resource,p_limit:limit,p_window_seconds:windowSeconds });
  if (error) return { allowed: process.env.NODE_ENV !== "production", retryAfter: 0 };
  const result = data?.[0] ?? { allowed:false,retry_after_seconds:windowSeconds };
  return { allowed:Boolean(result.allowed),retryAfter:Number(result.retry_after_seconds) };
}
