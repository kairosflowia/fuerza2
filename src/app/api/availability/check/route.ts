import { NextResponse } from "next/server";

import { getVariantAvailability, getVariantOrderLimit } from "@/lib/availability";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Disponibilidad de una lista de variantes para un punto y fecha, usada por
 * la cesta para no dejar subir la cantidad por encima de lo que de verdad
 * queda -- el checkout ya lo valida en el servidor al pagar, pero sin esto
 * el cliente podía subir el stepper del carrito hasta 99 sin ningún aviso
 * hasta el último paso. Combina las dos consultas públicas: el status
 * (para el aviso de "últimas unidades") y el límite real de unidades (que
 * check_variant_availability oculta a propósito salvo que ya esté en
 * low_stock).
 */
export async function POST(request: Request) {
  const rate = await enforceRateLimit("availability.check", 30, 60);
  if (!rate.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const variantIds: unknown = body?.variantIds;
  const pickupPointId = body?.pickupPointId;
  const collectionDate = body?.collectionDate;
  if (!Array.isArray(variantIds) || !variantIds.length || variantIds.length > 50 || typeof pickupPointId !== "string" || typeof collectionDate !== "string") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const results = await Promise.all(
    variantIds.filter((id) => typeof id === "string").map(async (variantId: string) => {
      const [availability, orderLimit] = await Promise.all([
        getVariantAvailability(variantId, pickupPointId, collectionDate),
        getVariantOrderLimit(variantId, pickupPointId, collectionDate),
      ]);
      return [
        variantId,
        {
          status: orderLimit?.isAvailable === false ? "sold_out" : (availability?.status ?? null),
          quantityAvailable: orderLimit?.isAvailable ? orderLimit.maxQuantity : (availability?.quantityAvailable ?? null),
        },
      ] as const;
    }),
  );

  return NextResponse.json({ availability: Object.fromEntries(results) }, { headers: { "cache-control": "private, no-store" } });
}
