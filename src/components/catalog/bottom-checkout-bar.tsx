"use client";

import Link from "next/link";

import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/catalog-domain";

export function BottomCheckoutBar() {
  const cart = useCart();
  if (!cart.count) return null;

  return (
    <div className="catalog-bottom-bar">
      <span className="catalog-bottom-bar__summary">
        {cart.count} producto{cart.count === 1 ? "" : "s"} · {formatPrice(cart.total)}
      </span>
      <Link href="/carrito" className="button button--primary">Ver cesta</Link>
    </div>
  );
}
