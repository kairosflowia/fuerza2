"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { canManageAvailability } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ProductionDateStatus } from "@/lib/supabase/database.types";

export type AvailabilityActionState = { ok: boolean; message?: string; errors?: Record<string, string> };
const text = (f: FormData, n: string) => String(f.get(n) ?? "").trim();
const integer = (f: FormData, n: string) => { const v = text(f, n); return v === "" ? null : Number.parseInt(v, 10); };

async function authorized() {
  const identity = await getCurrentIdentity();
  if (!identity || !canManageAvailability(identity.roles)) throw new Error("forbidden");
  return { db: await createClient(), userId: identity.user.id };
}

function refresh(date?: string) {
  revalidateTag("catalog", "max");
  revalidatePath("/admin/disponibilidad");
  revalidatePath("/pan");
  if (date) revalidatePath(`/admin/disponibilidad/${date}`);
}

export async function createProductionDateAction(_s: AvailabilityActionState, f: FormData): Promise<AvailabilityActionState> {
  const { db, userId } = await authorized();
  const variantId = text(f, "product_variant_id");
  const productionDate = text(f, "production_date");
  const totalCapacity = integer(f, "total_capacity");
  const reservedForSubscriptions = integer(f, "reserved_for_subscriptions") ?? 0;

  if (!variantId) return { ok: false, errors: { product_variant_id: "Selecciona una variante." } };
  if (!productionDate) return { ok: false, errors: { production_date: "Indica una fecha." } };
  if (totalCapacity === null || totalCapacity < 0) return { ok: false, errors: { total_capacity: "Indica una capacidad de 0 o más." } };
  if (reservedForSubscriptions > totalCapacity) return { ok: false, errors: { reserved_for_subscriptions: "No puede superar la capacidad total." } };

  const result = await db.from("production_dates").insert({
    product_variant_id: variantId,
    production_date: productionDate,
    total_capacity: totalCapacity,
    reserved_for_subscriptions: reservedForSubscriptions,
    status: "draft",
    notes: text(f, "notes") || null,
    created_by: userId,
  });
  if (result.error) return { ok: false, message: "No se ha creado. Comprueba que no exista ya una fecha de producción para esta variante." };
  refresh(productionDate);
  return { ok: true, message: "Fecha de producción creada en borrador." };
}

export async function updateProductionCapacityAction(_s: AvailabilityActionState, f: FormData): Promise<AvailabilityActionState> {
  const { db } = await authorized();
  const id = text(f, "id");
  const totalCapacity = integer(f, "total_capacity");
  const reservedForSubscriptions = integer(f, "reserved_for_subscriptions") ?? 0;

  if (totalCapacity === null || totalCapacity < 0) return { ok: false, errors: { total_capacity: "Indica una capacidad de 0 o más." } };
  if (reservedForSubscriptions > totalCapacity) return { ok: false, errors: { reserved_for_subscriptions: "No puede superar la capacidad total." } };

  const result = await db
    .from("production_dates")
    .update({ total_capacity: totalCapacity, reserved_for_subscriptions: reservedForSubscriptions })
    .eq("id", id);
  if (result.error) {
    return { ok: false, message: "No se puede reducir la capacidad por debajo de lo ya reservado o confirmado para esa fecha." };
  }
  refresh();
  return { ok: true, message: "Capacidad actualizada." };
}

const STATUS_ACTION_REASONS: Record<string, string> = {
  operator_status_limited: "Tu rol solo puede abrir o cerrar fechas, no cancelarlas.",
  not_found: "Esta fecha de producción ya no existe.",
};

export async function setProductionDateStatusAction(_s: AvailabilityActionState, f: FormData): Promise<AvailabilityActionState> {
  // La restricción fina (operator solo abre/cierra, nunca cancela) vive en
  // la función set_production_date_status, no aquí: así no hay dos lugares
  // que puedan quedar desincronizados sobre lo que cada rol puede hacer.
  const identity = await getCurrentIdentity();
  if (!identity) throw new Error("forbidden");
  const db = await createClient();
  const id = text(f, "id");
  const status = text(f, "status") as ProductionDateStatus;
  const { data, error } = await db.rpc("set_production_date_status", { p_id: id, p_status: status });
  if (error) return { ok: false, message: "No se ha podido actualizar el estado." };
  const result = data?.[0];
  if (!result?.ok) return { ok: false, message: STATUS_ACTION_REASONS[result?.reason ?? ""] ?? "No se ha podido actualizar el estado." };
  refresh();
  return { ok: true, message: "Estado actualizado." };
}

export async function createAvailabilityOverrideAction(_s: AvailabilityActionState, f: FormData): Promise<AvailabilityActionState> {
  const { db, userId } = await authorized();
  const variantId = text(f, "product_variant_id");
  const pointId = text(f, "pickup_point_id");
  const availabilityDate = text(f, "availability_date");
  const capacityOverride = integer(f, "capacity_override");

  if (!variantId || !availabilityDate) return { ok: false, errors: { availability_date: "Indica variante y fecha." } };
  if (capacityOverride === null || capacityOverride < 0) return { ok: false, errors: { capacity_override: "Indica una capacidad de 0 o más." } };

  const result = await db.from("availability_overrides").insert({
    product_variant_id: variantId,
    pickup_point_id: pointId || null,
    availability_date: availabilityDate,
    capacity_override: capacityOverride,
    reason: text(f, "reason") || null,
    created_by: userId,
  });
  if (result.error) return { ok: false, message: "No se ha guardado. Comprueba que no exista ya un ajuste para esa combinación." };
  refresh(availabilityDate);
  return { ok: true, message: "Ajuste de capacidad guardado." };
}

export async function deleteAvailabilityOverrideAction(f: FormData) {
  const { db } = await authorized();
  await db.from("availability_overrides").delete().eq("id", text(f, "id"));
  refresh();
}
