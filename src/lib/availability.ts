import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnvironment, isSupabaseConfigured } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

import type { PickupPointAvailability, VariantAvailability } from "./availability-domain";

export { AVAILABILITY_REASON_LABELS_ES, availabilityReasonLabel } from "./availability-domain";
export type { AvailabilityStatus, PickupPointAvailability, VariantAvailability } from "./availability-domain";

function publicClient() {
  const { url, anonKey } = getSupabasePublicEnvironment();
  return createSupabaseClient<Database>(url, anonKey, { auth: { persistSession: false } });
}

/**
 * Consulta pública de disponibilidad. Nunca expone total_capacity,
 * reserved_for_subscriptions ni identificadores operativos: solo lo que
 * define el contrato público (Documento 06 §11).
 */
export async function getVariantAvailability(
  productVariantId: string,
  pickupPointId: string,
  collectionDate: string,
): Promise<VariantAvailability | null> {
  if (!isSupabaseConfigured()) return null;
  const db = publicClient();
  const { data, error } = await db.rpc("check_variant_availability", {
    p_product_variant_id: productVariantId,
    p_pickup_point_id: pickupPointId,
    p_collection_date: collectionDate,
  });
  if (error || !data?.[0]) return null;
  const row = data[0];
  return { status: row.status, reason: row.reason, quantityAvailable: row.quantity_available };
}

/**
 * Límite real de unidades que se pueden pedir (a diferencia de
 * getVariantAvailability, que oculta la cantidad exacta salvo que ya esté
 * en low_stock, por motivos de marketing). Este número es el que debe
 * limitar cualquier stepper de cantidad: sin él, un cliente podía añadir a
 * la cesta más unidades de las que de verdad quedan mientras el estoque no
 * bajara del umbral de "últimas unidades".
 */
export async function getVariantOrderLimit(
  productVariantId: string,
  pickupPointId: string,
  collectionDate: string,
): Promise<{ isAvailable: boolean; reason: string; maxQuantity: number } | null> {
  if (!isSupabaseConfigured()) return null;
  const db = publicClient();
  const { data, error } = await db.rpc("check_variant_order_limit", {
    p_product_variant_id: productVariantId,
    p_pickup_point_id: pickupPointId,
    p_collection_date: collectionDate,
  });
  if (error || !data?.[0]) return null;
  const row = data[0];
  return { isAvailable: row.is_available, reason: row.reason, maxQuantity: row.max_quantity };
}

export async function getNextAvailableDate(
  productVariantId: string,
  pickupPointId: string,
  fromDate?: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const db = publicClient();
  const { data, error } = await db.rpc("next_available_date", {
    p_product_variant_id: productVariantId,
    p_pickup_point_id: pickupPointId,
    ...(fromDate ? { p_from_date: fromDate } : {}),
  });
  if (error) return null;
  return data;
}

export async function getAvailablePickupPointsForVariant(
  productVariantId: string,
  collectionDate: string,
): Promise<PickupPointAvailability[]> {
  if (!isSupabaseConfigured()) return [];
  const db = publicClient();
  const { data, error } = await db.rpc("available_pickup_points_for_variant", {
    p_product_variant_id: productVariantId,
    p_collection_date: collectionDate,
  });
  if (error || !data) return [];
  return data.map((row) => ({
    pickupPointId: row.pickup_point_id,
    status: row.status,
    reason: row.reason,
    quantityAvailable: row.quantity_available,
  }));
}
