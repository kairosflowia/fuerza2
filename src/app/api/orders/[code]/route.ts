import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
export const dynamic="force-dynamic";
export async function GET(req:Request,{params}:{params:Promise<{code:string}>}){const rate=await enforceRateLimit("orders.lookup",10,900);if(!rate.allowed)return NextResponse.json({error:"not_found"},{status:404});const token=new URL(req.url).searchParams.get("token")??"";if(token.length<32)return NextResponse.json({error:"not_found"},{status:404});const hash=createHash("sha256").update(token).digest("hex"),code=(await params).code;const db=createAdminClient()as any;const{data}=await db.from("orders").select("id,public_code,status,payment_status,customer_name,collection_date,total_cents,currency,requires_review,pickup_points(name),order_items(product_name_snapshot,variant_name_snapshot,quantity,line_total_cents)").eq("public_code",code).eq("lookup_token_hash",hash).maybeSingle();return data?NextResponse.json(data,{headers:{"cache-control":"private, no-store"}}):NextResponse.json({error:"not_found"},{status:404})}
