"use server";
import { revalidatePath } from "next/cache";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type StockActionState = { ok: boolean; message?: string; errors?: Record<string, string> };
const text = (f: FormData, n: string) => String(f.get(n) ?? "").trim();

async function authorized() {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "inventario")) throw new Error("forbidden");
  return createClient();
}

function refresh() {
  revalidatePath("/admin/inventario");
}

export async function toggleStockTrackingAction(formData: FormData) {
  const db = await authorized();
  const variantId = text(formData, "variant_id");
  const enabled = text(formData, "enabled") === "true";
  await db.from("product_variants").update({ stock_tracking: enabled }).eq("id", variantId);
  refresh();
}

export async function registerStockMovementAction(_state: StockActionState, formData: FormData): Promise<StockActionState> {
  const variantId = text(formData, "variant_id");
  const type = text(formData, "type") as "entrada" | "merma" | "ajuste";
  const quantityRaw = text(formData, "quantity");
  const notes = text(formData, "notes") || null;
  const quantity = Number.parseInt(quantityRaw, 10);

  if (!Number.isInteger(quantity) || quantity === 0) {
    return { ok: false, errors: { quantity: "Indica una cantidad distinta de 0." } };
  }
  const signedQuantity = type === "merma" ? -Math.abs(quantity) : type === "entrada" ? Math.abs(quantity) : quantity;

  const db = await authorized();
  const { error } = await db.rpc("register_stock_movement", {
    p_product_variant_id: variantId,
    p_type: type,
    p_quantity: signedQuantity,
    p_notes: notes,
  });
  if (error) return { ok: false, message: "No se ha podido registrar el movimiento." };

  refresh();
  return { ok: true, message: "Movimiento registrado." };
}
