"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type CutoffSettingsState = { ok: boolean; message?: string; errors?: Record<string, string> };

async function authorized() {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "configuracion")) throw new Error("forbidden");
  return { db: await createClient(), userId: identity.user.id };
}

export async function saveCutoffSettingsAction(_state: CutoffSettingsState, formData: FormData): Promise<CutoffSettingsState> {
  const daysBeforeRaw = String(formData.get("days_before") ?? "").trim();
  const timeRaw = String(formData.get("time") ?? "").trim();
  const daysBefore = Number.parseInt(daysBeforeRaw, 10);
  const errors: Record<string, string> = {};
  if (!Number.isInteger(daysBefore) || daysBefore < 0) errors.days_before = "Indica un número entero de días, 0 o más.";
  if (!/^\d{2}:\d{2}$/.test(timeRaw)) errors.time = "Indica una hora en formato HH:MM.";
  if (Object.keys(errors).length) return { ok: false, errors };

  const { db, userId } = await authorized();
  const results = await Promise.all([
    db.from("app_settings").update({ value: daysBefore, updated_by: userId }).eq("key", "availability.cutoff_days_before"),
    db.from("app_settings").update({ value: `${timeRaw}:00`, updated_by: userId }).eq("key", "availability.cutoff_time"),
  ]);
  if (results.some((r) => r.error)) return { ok: false, message: "No se ha podido guardar la configuración." };

  revalidateTag("cutoff-config", "max");
  revalidatePath("/admin/configuracion/reservas");
  revalidatePath("/reserva-y-recoge");
  return { ok: true, message: "Antelación mínima de reserva actualizada." };
}
