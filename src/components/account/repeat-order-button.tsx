"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui";

export type RepeatableItem = {
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  priceCents: number;
  image?: string;
};

/** Vuelve a añadir los artículos todavía disponibles de un pedido anterior a la cesta actual (sin tocarla si ya tenía algo) y lleva a /carrito para revisar punto y fecha antes de pagar. */
export function RepeatOrderButton({ items }: { items: RepeatableItem[] }) {
  const cart = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!items.length) return null;

  return (
    <Button
      variant="secondary"
      loading={busy}
      onClick={() => {
        setBusy(true);
        for (const item of items) cart.add(item);
        router.push("/carrito");
      }}
    >
      Repetir pedido
    </Button>
  );
}
