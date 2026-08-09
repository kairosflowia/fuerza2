export function formatPrice(cents: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Debe coincidir con 'availability.low_stock_threshold' en app_settings
 * (20260808160000_stock_gated_availability.sql). A partir de este número de
 * unidades restantes se muestra el aviso de "últimas unidades".
 */
export const LOW_STOCK_THRESHOLD = 3;

export type StockState = "in_stock" | "low_stock" | "out_of_stock";

export function stockStateFor(variant: { stock_tracking: boolean; stock_quantity: number }): StockState | null {
  if (!variant.stock_tracking) return null;
  if (variant.stock_quantity <= 0) return "out_of_stock";
  if (variant.stock_quantity <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

/** Peor estado entre las variantes con seguimiento de un producto (null si ninguna tiene seguimiento). */
export function productStockState(variants: { stock_tracking: boolean; stock_quantity: number }[]): StockState | null {
  const tracked = variants.filter((v) => v.stock_tracking);
  if (!tracked.length) return null;
  if (tracked.every((v) => v.stock_quantity <= 0)) return "out_of_stock";
  if (tracked.some((v) => v.stock_quantity <= LOW_STOCK_THRESHOLD)) return "low_stock";
  return "in_stock";
}
