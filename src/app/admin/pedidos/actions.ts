"use server";import {revalidatePath} from "next/cache";import {canAccessAdminSection} from "@/lib/auth/permissions";import {getCurrentIdentity} from "@/lib/auth/session";import {createAdminClient} from "@/lib/supabase/admin";import {availabilityReasonLabel} from "@/lib/availability-domain";

export async function updateOrderStatus(form:FormData){const identity=await getCurrentIdentity();if(!identity||!canAccessAdminSection(identity.roles,"pedidos"))throw new Error("forbidden");const id=String(form.get("id")),status=String(form.get("status"));if(!["ready","collected","cancelled","paid_manual"].includes(status))throw new Error("invalid_status");if((status==="cancelled"||status==="paid_manual")&&!identity.roles.some(r=>r==="owner"||r==="admin"))throw new Error("forbidden");const db=createAdminClient() as any;
  if(status==="cancelled"){await db.rpc("cancel_order",{p_order_id:id,p_reason:String(form.get("reason")??"Cancelación operativa")});revalidatePath(`/admin/pedidos/${id}`);return}
  if(status==="paid_manual"){await db.rpc("mark_order_paid_manually",{p_order_id:id,p_reason:String(form.get("reason")??"")||null});revalidatePath(`/admin/pedidos/${id}`);return}
  const{data:old}=await db.from("orders").select("status").eq("id",id).single();await db.from("orders").update({status}).eq("id",id);await db.from("order_status_history").insert({order_id:id,previous_status:old?.status,new_status:status,actor_id:identity.user.id,source:identity.roles.includes("operator")?"operator":"admin",reason:String(form.get("reason")??"")});await db.from("audit_logs").insert({actor_id:identity.user.id,action:`order.${status}`,entity_type:"orders",entity_id:id});revalidatePath(`/admin/pedidos/${id}`)}

export type StaffOrderState = { ok: boolean; message?: string };

export async function createStaffOrderAction(_state: StaffOrderState, form: FormData): Promise<StaffOrderState> {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "pedidos")) throw new Error("forbidden");

  let items: { variant_id: string; quantity: number }[] = [];
  try {
    items = JSON.parse(String(form.get("items") ?? "[]"));
  } catch {
    return { ok: false, message: "No hemos podido leer los artículos del pedido." };
  }
  if (!items.length) return { ok: false, message: "Añade al menos un artículo." };

  const db = createAdminClient() as any;
  const { data, error } = await db.rpc("create_staff_order", {
    p_items: items,
    p_pickup_point_id: String(form.get("pickup_point_id") ?? ""),
    p_collection_date: String(form.get("collection_date") ?? ""),
    p_customer_name: String(form.get("customer_name") ?? ""),
    p_customer_phone: String(form.get("customer_phone") ?? ""),
    p_customer_email: String(form.get("customer_email") ?? "") || null,
    p_channel: String(form.get("channel") ?? "phone"),
    p_payment_status: String(form.get("payment_status") ?? "paid"),
    p_notes: String(form.get("notes") ?? "") || null,
  });
  const result = data?.[0];
  if (error || !result?.ok) {
    return { ok: false, message: availabilityReasonLabel(result?.reason ?? "checkout_invalid") };
  }

  revalidatePath("/admin/pedidos");
  return { ok: true, message: `Pedido ${result.public_code} registrado.` };
}
