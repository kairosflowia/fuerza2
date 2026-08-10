"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type CartItem = {
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  priceCents: number;
  image?: string;
  note?: string;
};

type Cart = {
  items: CartItem[];
  add: (item: CartItem) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  total: number;
  justAdded: CartItem | null;
  isMiniCartOpen: boolean;
  closeMiniCart: () => void;
};

const Context = createContext<Cart | null>(null);
const MINI_CART_AUTO_CLOSE_MS = 4000;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [justAdded, setJustAdded] = useState<CartItem | null>(null);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("fuerza-cart") ?? "[]"));
    } catch {
      // localStorage puede estar vacío o corrupto; se ignora y empieza con cesta vacía.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fuerza-cart", JSON.stringify(items));
  }, [items]);

  const closeMiniCart = useCallback(() => {
    setIsMiniCartOpen(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const add = useCallback((item: CartItem) => {
    setItems((old) => {
      const found = old.find((x) => x.variantId === item.variantId);
      return found
        ? old.map((x) =>
            x.variantId === item.variantId
              ? { ...x, quantity: Math.min(99, x.quantity + item.quantity), note: item.note || x.note, image: item.image || x.image }
              : x,
          )
        : [...old, item];
    });
    setJustAdded(item);
    setIsMiniCartOpen(true);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsMiniCartOpen(false), MINI_CART_AUTO_CLOSE_MS);
  }, []);

  const value = useMemo<Cart>(
    () => ({
      items,
      add,
      setQuantity: (id, quantity) =>
        setItems((old) =>
          quantity <= 0 ? old.filter((x) => x.variantId !== id) : old.map((x) => (x.variantId === id ? { ...x, quantity: Math.min(99, quantity) } : x)),
        ),
      remove: (id) => setItems((old) => old.filter((x) => x.variantId !== id)),
      clear: () => setItems([]),
      count: items.reduce((n, x) => n + x.quantity, 0),
      total: items.reduce((n, x) => n + (x.priceCents ?? 0) * x.quantity, 0),
      justAdded,
      isMiniCartOpen,
      closeMiniCart,
    }),
    [items, add, justAdded, isMiniCartOpen, closeMiniCart],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCart() {
  const c = useContext(Context);
  if (!c) throw new Error("CartProvider missing");
  return c;
}
