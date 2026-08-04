"use client";

import { useEffect, useState } from "react";

import { formatCountdown, nextCutoff, ORDER_CUTOFF_HOUR } from "@/lib/order-cutoff";

export function CutoffCountdown() {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(formatCountdown(nextCutoff().getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="catalog-cutoff">
      <span className="catalog-cutoff__label">Corte de pedidos {ORDER_CUTOFF_HOUR}:00h</span>
      <span className="catalog-cutoff__time">{remaining ?? "…"}</span>
    </p>
  );
}
