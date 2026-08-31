"use server";

import { revalidatePath } from "next/cache";

import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function setContactMessageStatus(form: FormData) {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "mensajes")) throw new Error("forbidden");

  const id = String(form.get("id"));
  const status = String(form.get("status"));
  if (!["nuevo", "atendido", "descartado"].includes(status)) throw new Error("invalid_status");

  const db = (await createClient()) as any;
  const { error } = await db.rpc("admin_set_contact_message_status", { p_id: id, p_status: status });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/mensajes");
}
