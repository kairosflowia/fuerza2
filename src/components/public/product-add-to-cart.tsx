"use client";

import { useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { formatPrice, stockStateFor } from "@/lib/catalog-domain";

type Variant = { id: string; name: string; priceCents: number; stockTracking: boolean; stockQuantity: number };

export function ProductAddToCart({ productName, variants, image }: { productName: string; variants: Variant[]; image?: string }) {
  const cart = useCart();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  if (!variant) return null;

  const quantity = cart.items.find((item) => item.variantId === variant.id)?.quantity ?? 0;
  const stockState = stockStateFor({ stock_tracking: variant.stockTracking, stock_quantity: variant.stockQuantity });
  const outOfStock = stockState === "out_of_stock";
  const maxQuantity = variant.stockTracking ? Math.max(0, Math.min(99, variant.stockQuantity)) : 99;

  return (
    <div className="product-add-to-cart">
      {variants.length > 1 ? (
        <div className="product-add-to-cart__variants" role="radiogroup" aria-label="Variante">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              className="product-add-to-cart__variant"
              aria-pressed={v.id === variantId}
              onClick={() => setVariantId(v.id)}
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

      <div className="product-add-to-cart__row">
        <span className="product-add-to-cart__price">{formatPrice(variant.priceCents)}</span>
        {!outOfStock ? (
          <div className="stepper">
            <button
              type="button"
              className="stepper__button"
              aria-label={`Quitar ${productName}`}
              onClick={() => cart.setQuantity(variant.id, quantity - 1)}
              disabled={quantity <= 0}
            >
              −
            </button>
            <span className="stepper__value" aria-live="polite">{quantity}</span>
            <button
              type="button"
              className="stepper__button"
              aria-label={`Añadir ${productName}`}
              onClick={() => cart.add({ variantId: variant.id, productName, variantName: variant.name, quantity: 1, priceCents: variant.priceCents, image })}
              disabled={quantity >= maxQuantity}
            >
              +
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
