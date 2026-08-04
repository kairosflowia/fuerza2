"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/cart/cart-provider";
import { CartIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/catalog-domain";

import { usePickupPoint } from "./pickup-point-provider";

export function CatalogTopBar() {
  const { points, selectedId, select } = usePickupPoint();
  const cart = useCart();

  return (
    <header className="catalog-topbar">
      <Link href="/" className="catalog-topbar__logo" aria-label="FUERZA, volver al inicio">
        <Image src="/logo_fuerza_principal.png" alt="FUERZA" width={496} height={438} priority />
      </Link>

      {points.length ? (
        <label className="catalog-topbar__pickup">
          <span className="sr-only">Punto de recogida</span>
          <select value={selectedId} onChange={(event) => select(event.target.value)}>
            {points.map((point) => <option key={point.id} value={point.id}>{point.name}</option>)}
          </select>
        </label>
      ) : null}

      <Link href="/carrito" className="catalog-topbar__cart" aria-label={`Carrito, ${cart.count} artículos, ${formatPrice(cart.total)}`}>
        <CartIcon />
        <span className="catalog-topbar__cart-total">{formatPrice(cart.total)}</span>
        {cart.count > 0 ? <span className="catalog-topbar__cart-count" aria-hidden="true">{cart.count}</span> : null}
      </Link>
    </header>
  );
}
