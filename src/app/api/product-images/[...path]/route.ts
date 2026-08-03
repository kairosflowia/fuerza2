import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabasePublicEnvironment, isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!isSupabaseConfigured()) return new NextResponse(null, { status: 404 });
  const path = (await params).path.join("/");
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpe?g|png|webp|avif)$/.test(path)) return new NextResponse(null, { status: 400 });
  const { url, anonKey } = getSupabasePublicEnvironment();
  const db = createSupabaseClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await db.storage.from("product-images").download(path);
  if (error || !data) return new NextResponse(null, { status: 404 });
  return new NextResponse(data, { headers: { "Content-Type": data.type || "application/octet-stream", "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
