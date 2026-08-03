"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { canManagePickupOperations } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type PickupActionState = { ok: boolean; message?: string; errors?: Record<string, string> };
const text = (f: FormData, n: string) => String(f.get(n) ?? "").trim();
const optionalText = (f: FormData, n: string) => text(f, n) || null;
const integer = (f: FormData, n: string) => { const v = text(f, n); return v === "" ? null : Number.parseInt(v, 10); };
const decimal = (f: FormData, n: string) => { const v = text(f, n); return v === "" ? null : Number.parseFloat(v); };
const slugOk = (v: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

async function authorized() {
  const identity = await getCurrentIdentity();
  if (!identity || !canManagePickupOperations(identity.roles)) throw new Error("forbidden");
  return { db: await createClient(), userId: identity.user.id };
}

function refresh(id?: string) {
  revalidateTag("pickup-points", "max");
  revalidatePath("/donde-estamos");
  revalidatePath("/admin/puntos-de-recogida");
  if (id) revalidatePath(`/admin/puntos-de-recogida/${id}`);
}

// ---------------------------------------------------------------------------
// Identificación, localización, contacto y publicación.
// ---------------------------------------------------------------------------

type PickupPointStatus = Database["public"]["Tables"]["pickup_points"]["Row"]["status"];
const VALID_STATUSES: PickupPointStatus[] = ["draft", "active", "temporarily_unavailable", "coming_soon", "inactive"];

function pointPayload(f: FormData) {
  return {
    name: text(f, "name"),
    slug: text(f, "slug"),
    type: (text(f, "type") === "bakery" ? "bakery" : "external") as "bakery" | "external",
    is_main_bakery: f.get("is_main_bakery") === "on",
    accepts_all_products: f.get("accepts_all_products") === "on",
    address_line_1: optionalText(f, "address_line_1"),
    address_line_2: optionalText(f, "address_line_2"),
    postal_code: optionalText(f, "postal_code"),
    city: optionalText(f, "city"),
    province: optionalText(f, "province"),
    country_code: text(f, "country_code") || "ES",
    latitude: decimal(f, "latitude"),
    longitude: decimal(f, "longitude"),
    public_instructions: optionalText(f, "public_instructions"),
    internal_notes: optionalText(f, "internal_notes"),
    contact_name: optionalText(f, "contact_name"),
    contact_phone: optionalText(f, "contact_phone"),
    contact_email: optionalText(f, "contact_email"),
    display_order: integer(f, "display_order") ?? 0,
    is_public: f.get("is_public") === "on",
    status: (VALID_STATUSES.includes(text(f, "status") as PickupPointStatus) ? text(f, "status") : "draft") as PickupPointStatus,
  };
}

function validatePoint(p: ReturnType<typeof pointPayload>) {
  const errors: Record<string, string> = {};
  if (!p.name) errors.name = "El nombre es obligatorio.";
  if (!slugOk(p.slug)) errors.slug = "Usa minúsculas, números y guiones.";
  if (!/^[A-Z]{2}$/.test(p.country_code)) errors.country_code = "Usa el código ISO de 2 letras, por ejemplo ES.";
  if (p.latitude !== null && (p.latitude < -90 || p.latitude > 90)) errors.latitude = "La latitud debe estar entre -90 y 90.";
  if (p.longitude !== null && (p.longitude < -180 || p.longitude > 180)) errors.longitude = "La longitud debe estar entre -180 y 180.";
  if (p.contact_email && !emailOk(p.contact_email)) errors.contact_email = "Ese correo no parece completo.";
  if (p.is_main_bakery && p.type !== "bakery") errors.is_main_bakery = "El obrador principal debe ser de tipo Obrador.";
  return errors;
}

export async function savePickupPointAction(_s: PickupActionState, f: FormData): Promise<PickupActionState> {
  const p = pointPayload(f);
  const errors = validatePoint(p);
  if (Object.keys(errors).length) return { ok: false, errors };

  const { db } = await authorized();
  const id = text(f, "id");

  // La promoción a obrador principal no es atómica entre las dos sentencias,
  // pero es una acción administrativa infrecuente ejecutada por una única
  // persona de confianza, no una operación crítica de stock (Documento 04 §2.4).
  if (p.is_main_bakery) {
    await db.from("pickup_points").update({ is_main_bakery: false }).eq("is_main_bakery", true).neq("id", id || "00000000-0000-0000-0000-000000000000");
  }

  if (id) {
    const result = await db.from("pickup_points").update(p).eq("id", id);
    if (result.error) return { ok: false, message: "No se ha guardado. Comprueba que el slug no esté repetido." };
    refresh(id);
    return { ok: true, message: "Punto guardado." };
  }

  const result = await db.from("pickup_points").insert(p).select("id").single();
  if (result.error) return { ok: false, message: "No se ha creado. Comprueba que el slug no esté repetido." };
  refresh();
  redirect(`/admin/puntos-de-recogida/${result.data.id}`);
}

export async function quickSetStatusAction(f: FormData) {
  const { db } = await authorized();
  const id = text(f, "id");
  const status = text(f, "status") as PickupPointStatus;
  if (!VALID_STATUSES.includes(status)) return;
  await db.from("pickup_points").update({ status }).eq("id", id);
  refresh(id);
}

// ---------------------------------------------------------------------------
// Horario general de apertura (informativo).
// ---------------------------------------------------------------------------

export async function saveOpeningHoursAction(f: FormData) {
  const { db } = await authorized();
  const pointId = text(f, "pickup_point_id");
  await db.from("pickup_point_opening_hours").delete().eq("pickup_point_id", pointId);

  const rows = Array.from({ length: 7 }, (_, i) => {
    const weekday = i + 1;
    const isClosed = f.get(`hours_closed_${weekday}`) === "on";
    const opensAt = text(f, `hours_open_${weekday}`);
    const closesAt = text(f, `hours_close_${weekday}`);
    if (isClosed) return { pickup_point_id: pointId, weekday, is_closed: true, opens_at: null, closes_at: null };
    if (opensAt && closesAt) return { pickup_point_id: pointId, weekday, is_closed: false, opens_at: opensAt, closes_at: closesAt };
    return null;
  }).filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length) await db.from("pickup_point_opening_hours").insert(rows);
  refresh(pointId);
}

// ---------------------------------------------------------------------------
// Ventanas de recogida FUERZA. Permite varias por día.
// ---------------------------------------------------------------------------

const MAX_WINDOW_ROWS = 14;

export async function saveCollectionWindowsAction(_s: PickupActionState, f: FormData): Promise<PickupActionState> {
  const { db } = await authorized();
  const pointId = text(f, "pickup_point_id");

  const rows = Array.from({ length: MAX_WINDOW_ROWS }, (_, i) => {
    const weekday = integer(f, `window_weekday_${i}`);
    const startsAt = text(f, `window_start_${i}`);
    const endsAt = text(f, `window_end_${i}`);
    if (!weekday || !startsAt || !endsAt) return null;
    return { pickup_point_id: pointId, weekday, starts_at: startsAt, ends_at: endsAt, is_active: f.get(`window_active_${i}`) !== "off" };
  }).filter((row): row is NonNullable<typeof row> => row !== null);

  await db.from("pickup_point_collection_windows").delete().eq("pickup_point_id", pointId);
  if (rows.length) {
    const result = await db.from("pickup_point_collection_windows").insert(rows);
    if (result.error) return { ok: false, message: "No se han guardado las ventanas: revisa que no se solapen y que el inicio sea anterior al fin." };
  }
  refresh(pointId);
  return { ok: true, message: "Ventanas de recogida guardadas." };
}

// ---------------------------------------------------------------------------
// Capacidad habitual por día de la semana. Ausencia de fila = no configurado.
// ---------------------------------------------------------------------------

export async function saveCapacityDefaultsAction(f: FormData) {
  const { db } = await authorized();
  const pointId = text(f, "pickup_point_id");
  await db.from("pickup_point_capacity_defaults").delete().eq("pickup_point_id", pointId);

  const rows = Array.from({ length: 7 }, (_, i) => {
    const weekday = i + 1;
    const configured = f.get(`capacity_configured_${weekday}`) === "on";
    if (!configured) return null;
    const maxUnits = integer(f, `capacity_${weekday}`);
    if (maxUnits === null || maxUnits < 0) return null;
    return { pickup_point_id: pointId, weekday, max_units: maxUnits };
  }).filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length) await db.from("pickup_point_capacity_defaults").insert(rows);
  refresh(pointId);
}

// ---------------------------------------------------------------------------
// Excepciones por fecha concreta.
// ---------------------------------------------------------------------------

export async function createExceptionAction(_s: PickupActionState, f: FormData): Promise<PickupActionState> {
  const { db, userId } = await authorized();
  const pointId = text(f, "pickup_point_id");
  const type = text(f, "type") as Database["public"]["Tables"]["pickup_point_exceptions"]["Row"]["type"];
  const exceptionDate = text(f, "exception_date");
  if (!exceptionDate) return { ok: false, errors: { exception_date: "Indica una fecha." } };

  const payload = {
    pickup_point_id: pointId,
    exception_date: exceptionDate,
    type,
    collection_starts_at: optionalText(f, "collection_starts_at"),
    collection_ends_at: optionalText(f, "collection_ends_at"),
    capacity_override: integer(f, "capacity_override"),
    public_message: optionalText(f, "public_message"),
    internal_reason: optionalText(f, "internal_reason"),
    created_by: userId,
  };

  const result = await db.from("pickup_point_exceptions").insert(payload);
  if (result.error) return { ok: false, message: "No se ha guardado. Comprueba que no exista ya una excepción para esa fecha y que los campos requeridos por el tipo estén completos." };
  refresh(pointId);
  return { ok: true, message: "Excepción guardada." };
}

export async function deleteExceptionAction(f: FormData) {
  const { db } = await authorized();
  const id = text(f, "id");
  const pointId = text(f, "pickup_point_id");
  await db.from("pickup_point_exceptions").delete().eq("id", id);
  refresh(pointId);
}

// ---------------------------------------------------------------------------
// Cierres globales.
// ---------------------------------------------------------------------------

export async function createGlobalClosureAction(_s: PickupActionState, f: FormData): Promise<PickupActionState> {
  const { db, userId } = await authorized();
  const startsOn = text(f, "starts_on");
  const endsOn = text(f, "ends_on") || startsOn;
  if (!startsOn) return { ok: false, errors: { starts_on: "Indica una fecha de inicio." } };
  if (endsOn < startsOn) return { ok: false, errors: { ends_on: "La fecha de fin debe ser igual o posterior a la de inicio." } };

  const result = await db.from("global_closures").insert({
    starts_on: startsOn,
    ends_on: endsOn,
    public_message: optionalText(f, "public_message"),
    internal_reason: optionalText(f, "internal_reason"),
    created_by: userId,
  });
  if (result.error) return { ok: false, message: "No se ha guardado el cierre." };
  revalidateTag("pickup-points", "max");
  revalidatePath("/donde-estamos");
  revalidatePath("/admin/configuracion/calendario");
  return { ok: true, message: "Cierre global guardado." };
}

export async function deleteGlobalClosureAction(f: FormData) {
  const { db } = await authorized();
  await db.from("global_closures").delete().eq("id", text(f, "id"));
  revalidateTag("pickup-points", "max");
  revalidatePath("/donde-estamos");
  revalidatePath("/admin/configuracion/calendario");
}

// ---------------------------------------------------------------------------
// Productos aceptados por punto.
// ---------------------------------------------------------------------------

export async function saveAcceptedProductsAction(f: FormData) {
  const { db } = await authorized();
  const pointId = text(f, "pickup_point_id");
  const acceptsAll = f.get("accepts_all_products") === "on";

  await db.from("pickup_points").update({ accepts_all_products: acceptsAll }).eq("id", pointId);
  await db.from("product_pickup_points").delete().eq("pickup_point_id", pointId);

  if (!acceptsAll) {
    const productIds = f.getAll("product_id").map(String);
    if (productIds.length) {
      await db.from("product_pickup_points").insert(productIds.map((product_id) => ({ product_id, pickup_point_id: pointId, is_available: true })));
    }
  }
  refresh(pointId);
}
