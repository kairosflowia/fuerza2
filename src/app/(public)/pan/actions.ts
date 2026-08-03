"use server";
import { availabilityReasonLabel, getNextAvailableDate, getVariantAvailability } from "@/lib/availability";

export type AvailabilityCheckState = {
  checked: boolean;
  status?: "available" | "low_stock" | "sold_out";
  message?: string;
  quantityAvailable?: number | null;
  nextAvailableDate?: string | null;
};

const initial: AvailabilityCheckState = { checked: false };

/**
 * Solo consulta: nunca crea una reserva. El cálculo se hace siempre en el
 * servidor a través de la función pública segura; el cliente nunca envía
 * capacidad ni precio (Documento 06 §15).
 */
export async function checkAvailabilityAction(_state: AvailabilityCheckState, formData: FormData): Promise<AvailabilityCheckState> {
  const variantId = String(formData.get("variant_id") ?? "");
  const pointId = String(formData.get("pickup_point_id") ?? "");
  const date = String(formData.get("date") ?? "");

  if (!variantId || !pointId || !date) {
    return { ...initial, checked: true, message: "Indica un punto y una fecha." };
  }

  const availability = await getVariantAvailability(variantId, pointId, date);
  if (!availability) {
    return { ...initial, checked: true, message: "No hemos podido consultar la disponibilidad ahora mismo." };
  }

  if (availability.status === "sold_out") {
    const nextDate = await getNextAvailableDate(variantId, pointId, date);
    return {
      checked: true,
      status: "sold_out",
      message: availabilityReasonLabel(availability.reason),
      nextAvailableDate: nextDate,
    };
  }

  return {
    checked: true,
    status: availability.status,
    message: availability.status === "low_stock" ? `Quedan ${availability.quantityAvailable} para ese día.` : "Disponible para ese día.",
    quantityAvailable: availability.quantityAvailable,
  };
}
