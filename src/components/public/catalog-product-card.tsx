"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/catalog-domain";

type QuickAddVariant = { id: string; name: string; priceCents: number };

export function CatalogProductCard({
  slug,
  familyName,
  name,
  imagePath,
  priceCents,
  isSeasonal,
  variant,
}: {
  slug: string;
  familyName?: string | null;
  name: string;
  imagePath: string | null;
  priceCents: number | null;
  isSeasonal?: boolean;
  variant: QuickAddVariant | null;
}) {
  const cart = useCart();
  const href = `/pan/${slug}`;
  const quantity = variant ? cart.items.find((item) => item.variantId === variant.id)?.quantity ?? 0 : 0;

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
        <Link href={href} className="catalog-product-card__name">{name}</Link>
        {priceCents !== null ? <p className="catalog-product-card__price">{formatPrice(priceCents)}</p> : null}
        {variant ? (
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
            >
              +
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
