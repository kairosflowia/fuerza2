"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { CartIcon } from "@/components/ui/icons";
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
  const [added, setAdded] = useState(false);
  const href = `/pan/${slug}`;

  return (
    <article className="catalog-product-card">
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
        <div className="catalog-product-card__footer">
          {priceCents !== null ? <span className="catalog-product-card__price">{formatPrice(priceCents)}</span> : null}
          {variant ? (
            <button
              type="button"
              className="catalog-product-card__add"
              aria-label={`Añadir ${name} a la cesta`}
              onClick={() => {
                cart.add({ variantId: variant.id, productName: name, variantName: variant.name, quantity: 1, priceCents: variant.priceCents, image: imagePath ?? undefined });
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1400);
              }}
            >
              {added ? <span aria-hidden="true">✓</span> : <CartIcon aria-hidden="true" />}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
