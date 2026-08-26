"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { siteOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function authorized() {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "clientes")) throw new Error("forbidden");
  return createClient();
}

function refresh() {
  revalidatePath("/admin/clientes/suscritos");
}

export async function resendNewsletterConfirmationAction(formData: FormData) {
  const db = await authorized();
  const subscriberId = text(formData, "subscriber_id");
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const confirmUrl = `${await siteOrigin()}/newsletter/confirmar?token=${token}`;
  await db.rpc("admin_newsletter_resend_confirmation", {
    p_subscriber_id: subscriberId,
    p_confirm_token_hash: hashToken(token),
    p_token_expires_at: expiresAt,
    p_confirm_url: confirmUrl,
  });
  refresh();
}

export async function setNewsletterStatusAction(formData: FormData) {
  const db = await authorized();
  const subscriberId = text(formData, "subscriber_id");
  const status = text(formData, "status") as "baja" | "bloqueado" | "activo";
  await db.rpc("admin_newsletter_set_status", { p_subscriber_id: subscriberId, p_status: status, p_reason: null });
  refresh();
}
