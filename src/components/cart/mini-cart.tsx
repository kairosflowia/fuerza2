"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { formatPrice } from "@/lib/catalog-domain";

import { useCart } from "./cart-provider";

export function MiniCart() {
  const { items, justAdded, isMiniCartOpen, closeMiniCart, total, count } = useCart();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMiniCartOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) closeMiniCart();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMiniCart();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMiniCartOpen, closeMiniCart]);

  if (!isMiniCartOpen || !items.length) return null;

  return (
    <div className="mini-cart" ref={ref} role="dialog" aria-label="Cesta actualizada">
      <div className="mini-cart__header">
        <p className="mini-cart__title">{justAdded ? "Añadido a la cesta" : "Tu cesta"}</p>
        <button type="button" className="mini-cart__close" aria-label="Cerrar" onClick={closeMiniCart}>
          ×
        </button>
      </div>

      {justAdded ? (
        <div className="mini-cart__added">
          <div className="mini-cart__added-media">
            {justAdded.image ? (
              <Image src={`/api/product-images/${justAdded.image}`} alt="" width={56} height={56} />
            ) : (
              <div className="catalog-image-empty" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="mini-cart__added-name">{justAdded.productName}</p>
            <p className="mini-cart__added-meta">
              {justAdded.variantName} · {formatPrice(justAdded.priceCents)}
            </p>
          </div>
        </div>
      ) : null}

      <ul className="mini-cart__items">
        {items.map((item) => (
          <li key={item.variantId}>
            <span>
              {item.quantity} × {item.productName}
              {item.variantName && item.variantName !== "Única" ? ` — ${item.variantName}` : ""}
            </span>
            <span>{formatPrice(item.priceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <p className="mini-cart__total">
        <span>
          {count} artículo{count === 1 ? "" : "s"}
        </span>
        <span>{formatPrice(total)}</span>
      </p>

      <Link href="/carrito" className="button button--primary" onClick={closeMiniCart}>
        Ver cesta
      </Link>
    </div>
  );
}
