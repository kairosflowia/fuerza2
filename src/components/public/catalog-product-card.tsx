"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { formatPrice, type StockState } from "@/lib/catalog-domain";

type QuickAddVariant = { id: string; name: string; priceCents: number; stockTracking?: boolean; stockQuantity?: number };

export function CatalogProductCard({
  href,
  familyName,
  name,
  imagePath,
  priceCents,
  isSeasonal,
  stockState,
  variant,
}: {
  href: string;
  familyName?: string | null;
  name: string;
  imagePath: string | null;
  priceCents: number | null;
  isSeasonal?: boolean;
  stockState?: StockState | null;
  variant: QuickAddVariant | null;
}) {
  const cart = useCart();
  const quantity = variant ? cart.items.find((item) => item.variantId === variant.id)?.quantity ?? 0 : 0;
  const outOfStock = stockState === "out_of_stock";
  const maxQuantity = variant?.stockTracking ? Math.max(0, Math.min(99, variant.stockQuantity ?? 0)) : 99;

  return (
    <article className="catalog-product-card" data-selected={quantity > 0 || undefined}>
      <Link href={href} className="catalog-product-card__media" tabIndex={-1} aria-hidden="true">
        {imagePath ? (
          <Image src={`/api/product-images/${imagePath}`} alt="" width={480} height={480} />
        ) : (
          <div className="catalog-image-empty" aria-hidden="true" />
        )}
      </Link>
      <div className="catalog-product-card__body">
        {familyName ? <p className="catalog-product-card__eyebrow">{familyName}</p> : null}
        {isSeasonal ? <Badge variant="information">De temporada</Badge> : null}
        {stockState === "out_of_stock" ? <Badge variant="neutral">Agotado</Badge> : null}
        {stockState === "low_stock" ? <Badge variant="warning">Últimas unidades</Badge> : null}
        <Link href={href} className="catalog-product-card__name">{name}</Link>
        {priceCents !== null ? <p className="catalog-product-card__price">{formatPrice(priceCents)}</p> : null}
        {variant && !outOfStock ? (
          <div className="stepper stepper--compact catalog-product-card__stepper">
            <button
              type="button"
              className="stepper__button"
              aria-label={`Quitar ${name}`}
              onClick={() => cart.setQuantity(variant.id, quantity - 1)}
              disabled={quantity <= 0}
            >
              −
            </button>
            <span className="stepper__value" aria-live="polite">{quantity}</span>
            <button
              type="button"
              className="stepper__button"
              aria-label={`Añadir ${name}`}
              onClick={() =>
                cart.add({ variantId: variant.id, productName: name, variantName: variant.name, quantity: 1, priceCents: variant.priceCents, image: imagePath ?? undefined })
              }
              disabled={quantity >= maxQuantity}
            >
              +
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
