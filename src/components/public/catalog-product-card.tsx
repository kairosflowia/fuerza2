"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/cart/cart-provider";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { availabilityReasonLabel, type AvailabilityStatus } from "@/lib/availability-domain";
import { formatPrice } from "@/lib/catalog-domain";

type QuickAddVariant = { id: string; name: string; priceCents: number };
type Availability = { status: AvailabilityStatus; reason: string; quantityAvailable: number | null };

export function CatalogProductCard({
  href,
  familyName,
  name,
  description,
  imagePath,
  priceCents,
  isSeasonal,
  availability,
  maxQuantity: realMaxQuantity,
  variant,
  priority = false,
}: {
  href: string;
  familyName?: string | null;
  name: string;
  description?: string | null;
  imagePath: string | null;
  priceCents: number | null;
  isSeasonal?: boolean;
  availability?: Availability | null;
  maxQuantity?: number | null;
  variant: QuickAddVariant | null;
  priority?: boolean;
}) {
  const cart = useCart();
  const quantity = variant ? cart.items.find((item) => item.variantId === variant.id)?.quantity ?? 0 : 0;
  const soldOut = availability?.status === "sold_out";
  // El límite real (check_variant_order_limit) siempre respeta el estoque de
  // verdad; availability.quantityAvailable solo se rellena en low_stock (es
  // el aviso de marketing "últimas unidades", no el tope real).
  const maxQuantity = typeof realMaxQuantity === "number" ? realMaxQuantity : 99;
  const addOne = () =>
    variant &&
    cart.add({ variantId: variant.id, productName: name, variantName: variant.name, quantity: 1, priceCents: variant.priceCents, image: imagePath ?? undefined });

  const meta = familyName ?? (isSeasonal ? "De temporada" : null);
  const status = soldOut
    ? availabilityReasonLabel(availability!.reason)
    : availability?.status === "low_stock"
      ? availability.quantityAvailable === 1 ? "Última unidad" : availability.quantityAvailable !== null ? `Últimas ${availability.quantityAvailable} unidades` : "Últimas unidades"
      : null;

  return (
    <article className="fz-product" data-selected={quantity > 0 || undefined}>
      <div className="fz-product__media">
        {imagePath ? (
          <Image
            src={`/api/product-images/${imagePath}`}
            alt=""
            width={640}
            height={480}
            priority={priority}
            sizes="(min-width: 64rem) 25vw, 50vw"
          />
        ) : null}
      </div>
      <div className="fz-product__body">
        {meta ? <p className="fz-product__meta">{meta}</p> : null}
        <Link href={href} className="fz-product__name">{name}</Link>
        {description ? <p className="fz-product__desc">{description}</p> : null}
        {status ? <p className={`fz-product__status${soldOut ? "" : " fz-product__status--warning"}`}>{status}</p> : null}
        <div className="fz-product__foot">
          {priceCents !== null ? <p className="fz-product__price">{formatPrice(priceCents)}</p> : <span />}
          {variant && !soldOut ? (
            quantity > 0 ? (
              <div className="fz-qty" role="group" aria-label={`Cantidad de ${name}`}>
                <button type="button" aria-label={`Quitar ${name}`} onClick={() => cart.setQuantity(variant.id, quantity - 1)}>
                  <MinusIcon />
                </button>
                <output aria-live="polite">{quantity}</output>
                <button type="button" aria-label={`Añadir ${name}`} onClick={addOne} disabled={quantity >= maxQuantity}>
                  <PlusIcon />
                </button>
              </div>
            ) : (
              <button type="button" className="fz-add" aria-label={`Añadir ${name}`} onClick={addOne} disabled={quantity >= maxQuantity}>
                <PlusIcon />
              </button>
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}
