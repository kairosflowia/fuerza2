import { Badge } from "@/components/ui";
import { InventoryRowActions } from "./inventory-row-actions";
import { StockMovementButton } from "./stock-movement-form";

type Variant = { id: string; name: string; stock_tracking: boolean; low_stock_threshold: number | null };
type StockStatus = { variant_id: string; stock_quantity: number; reserved_quantity: number; available_quantity: number; stock_state: string };

const STOCK_LABEL: Record<string, string> = { agotado: "Sin stock", stock_bajo: "Stock bajo", disponible: "Disponible", no_controlado: "No controlado" };
const STOCK_VARIANT: Record<string, "success" | "warning" | "error" | "neutral"> = { agotado: "error", stock_bajo: "warning", disponible: "success", no_controlado: "neutral" };

export function ProductInventoryPanel({ productId, productName, variants, stockStatus }: { productId: string; productName: string; variants: Variant[]; stockStatus: StockStatus[] }) {
  if (!variants.length) return null;

  return (
    <section className="admin-subsection">
      <h2>Inventario</h2>
      <p className="field__help">El stock actual solo se lee aquí — cámbialo siempre con &ldquo;Actualizar stock&rdquo;, nunca a mano.</p>
      <ul className="inventory-list">
        {variants.map((variant) => {
          const status = stockStatus.find((s) => s.variant_id === variant.id);
          return (
            <li key={variant.id} className="inventory-row">
              <div className="inventory-row__main">
                <p className="inventory-row__product">{variant.name}</p>
                {status ? (
                  <p className="inventory-row__variant">
                    Stock {status.stock_quantity} · Reservado {status.reserved_quantity} · Disponible {status.available_quantity}
                  </p>
                ) : null}
              </div>
              <div className="inventory-row__stock">
                {status ? <Badge variant={STOCK_VARIANT[status.stock_state]}>{STOCK_LABEL[status.stock_state]}</Badge> : null}
                <span className="inventory-row__qty">mín. {variant.low_stock_threshold ?? "global"}</span>
              </div>
              <div className="inventory-row__actions">
                <StockMovementButton variantId={variant.id} productName={productName} variantName={variant.name} productId={productId} />
                <InventoryRowActions variantId={variant.id} variantName={variant.name} productId={productId} enabled={variant.stock_tracking} threshold={variant.low_stock_threshold} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
