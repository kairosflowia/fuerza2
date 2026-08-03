"use server";

import { revalidatePath } from "next/cache";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

async function context() {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "produccion")) throw new Error("forbidden");
  return { identity, db: await createClient() as any };
}

export async function generateProduction(form: FormData) {
  const { db } = await context();
  const date = String(form.get("date"));
  const { error } = await db.rpc("reconcile_production", { p_date: date });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/produccion");
}

export async function updateBatch(form: FormData) {
  const { db } = await context();
  const { error } = await db.rpc("update_production_batch", {
    p_batch_id: String(form.get("id")), p_produced: Number(form.get("produced")), p_packed: Number(form.get("packed")),
    p_status: String(form.get("status")), p_notes: String(form.get("notes") ?? ""), p_expected_updated_at: String(form.get("updatedAt")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/produccion");
}

export async function adjustBatch(form: FormData) {
  const { identity, db } = await context();
  if (!identity.roles.some((role) => role === "owner" || role === "admin")) throw new Error("forbidden");
  const { error } = await db.rpc("adjust_production_batch", { p_batch_id: String(form.get("id")), p_quantity: Number(form.get("quantity")), p_reason: String(form.get("reason")) });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/produccion");
}

export async function setItemStatus(form: FormData) {
  const { db } = await context();
  const { error } = await db.rpc("set_fulfillment_status", { p_order_item_id: String(form.get("orderItemId")), p_status: String(form.get("status")), p_quantity: form.get("quantity") ? Number(form.get("quantity")) : null, p_note: String(form.get("note") ?? "") });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/produccion");
}

export async function setOperationalOrderStatus(form: FormData) {
  const { db } = await context();
  const { error } = await db.rpc("set_order_fulfillment_status", { p_order_id: String(form.get("orderId")), p_status: String(form.get("status")), p_override_reason: String(form.get("reason") ?? "") });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/produccion");
}

export async function createIncident(form: FormData) {
  const { identity, db } = await context();
  const { error } = await db.from("production_incidents").insert({ production_date: String(form.get("date")), production_batch_id: form.get("batchId") || null, order_id: form.get("orderId") || null, pickup_point_id: form.get("pointId") || null, type: String(form.get("type") ?? "other"), severity: String(form.get("severity") ?? "medium"), description: String(form.get("description")), created_by: identity.user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/produccion");
}
