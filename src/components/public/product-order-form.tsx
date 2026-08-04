"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Textarea } from "@/components/ui/fields";
import { formatPrice } from "@/lib/catalog-domain";

type Variant = { id: string; name: string; priceCents: number };

export function ProductOrderForm({ productName, variants, image }: { productName: string; variants: Variant[]; image?: string }) {
  const cart = useCart();
  const router = useRouter();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const total = useMemo(() => (variant ? variant.priceCents * quantity : 0), [variant, quantity]);

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
              onClick={() => { setVariantId(v.id); setAdded(false); }}
            >
              {v.name}
            </button>
          ))}
        </div>
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

      <div className="product-order-form__quantity">
        <span className="product-order-form__quantity-label">Número de unidades</span>
        <div className="stepper">
          <button type="button" className="stepper__button" aria-label="Quitar una unidad" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
          <span className="stepper__value" aria-live="polite">{quantity}</span>
          <button type="button" className="stepper__button" aria-label="Añadir una unidad" onClick={() => setQuantity((q) => Math.min(99, q + 1))}>+</button>
        </div>
      </div>

      <button
        type="button"
        className="product-order-form__submit"
        onClick={() => {
          cart.add({ variantId: variant.id, productName, variantName: variant.name, quantity, priceCents: variant.priceCents, image, note: note.trim() || undefined });
          setAdded(true);
          setQuantity(1);
          setNote("");
          setTimeout(() => router.push("/reserva-y-recoge"), 500);
        }}
      >
        <span>{added ? "Añadido ✓" : "Añadir a la cesta"}</span>
        <span>{formatPrice(total)}</span>
      </button>
    </div>
  );
}
