"use client";

import Link from "next/link";

import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/catalog-domain";

import { CutoffCountdown } from "./cutoff-countdown";
import { usePickupPoint } from "./pickup-point-provider";

export function OrderSummarySidebar() {
  const { selected } = usePickupPoint();
  const cart = useCart();

  return (
    <aside className="catalog-sidebar">
      <div className="catalog-sidebar__card">
        <p className="catalog-sidebar__heading">Punto de recogida</p>
        <p className="catalog-sidebar__pickup">{selected?.name ?? "Selecciona un punto"}</p>
        <CutoffCountdown />
      </div>

      <div className="catalog-sidebar__card">
        <p className="catalog-sidebar__heading">Tu reserva</p>
        {cart.items.length ? (
          <>
            <ul className="catalog-sidebar__items">
              {cart.items.map((item) => (
                <li key={item.variantId}>
                  <span>{item.quantity} × {item.productName}</span>
                  <span>{formatPrice(item.priceCents * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="catalog-sidebar__total">
              <span>Total</span>
              <span>{formatPrice(cart.total)}</span>
            </p>
            <Link href="/carrito" className="button button--primary button--full">Continuar reserva</Link>
          </>
        ) : (
          <p className="catalog-sidebar__empty">Todavía no has añadido productos.</p>
        )}
      </div>
    </aside>
  );
}
