"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Textarea } from "@/components/ui/fields";
import { formatPrice, stockStateFor } from "@/lib/catalog-domain";

type Variant = { id: string; name: string; priceCents: number; stockTracking: boolean; stockQuantity: number };

export function ProductOrderForm({ productName, variants, image }: { productName: string; variants: Variant[]; image?: string }) {
  const cart = useCart();
  const router = useRouter();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const total = useMemo(() => (variant ? variant.priceCents * quantity : 0), [variant, quantity]);
  const stockState = variant ? stockStateFor({ stock_tracking: variant.stockTracking, stock_quantity: variant.stockQuantity }) : null;
  const outOfStock = stockState === "out_of_stock";
  const maxQuantity = variant?.stockTracking ? Math.max(0, Math.min(99, variant.stockQuantity)) : 99;

  if (!variant) return null;

  return (
    <div className="product-order-form">
      {variants.length > 1 ? (
        <div className="product-order-form__variants" role="radiogroup" aria-label="Variante">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              className="product-order-form__variant-option"
              aria-pressed={v.id === variantId}
              onClick={() => { setVariantId(v.id); setQuantity(1); setAdded(false); }}
            >
              {v.name}
            </button>
          ))}
        </div>
      ) : null}

      {stockState === "out_of_stock" ? (
        <p className="product-order-form__stock product-order-form__stock--out">Agotado</p>
      ) : stockState === "low_stock" ? (
        <p className="product-order-form__stock product-order-form__stock--low">¡Últimas unidades! Quedan {variant.stockQuantity}.</p>
      ) : null}

      <Textarea
        id="order-comment"
        label="¿Algún comentario?"
        optional
        maxLength={200}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ej: sin gluten, corte fino…"
      />

      {!outOfStock ? (
        <div className="product-order-form__quantity">
          <span className="product-order-form__quantity-label">Número de unidades</span>
          <div className="stepper">
            <button type="button" className="stepper__button" aria-label="Quitar una unidad" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
            <span className="stepper__value" aria-live="polite">{quantity}</span>
            <button type="button" className="stepper__button" aria-label="Añadir una unidad" onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))} disabled={quantity >= maxQuantity}>+</button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="product-order-form__submit"
        disabled={outOfStock}
        onClick={() => {
          if (outOfStock) return;
          cart.add({ variantId: variant.id, productName, variantName: variant.name, quantity, priceCents: variant.priceCents, image, note: note.trim() || undefined });
          setAdded(true);
          setQuantity(1);
          setNote("");
          setTimeout(() => router.push("/reserva-y-recoge"), 500);
        }}
      >
        <span>{outOfStock ? "Agotado" : added ? "Añadido ✓" : "Añadir a la cesta"}</span>
        {!outOfStock ? <span>{formatPrice(total)}</span> : null}
      </button>
    </div>
  );
}
