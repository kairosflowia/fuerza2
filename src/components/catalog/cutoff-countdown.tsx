"use client";

import { useEffect, useState } from "react";

import { earliestBookableDate, formatEarliestDate, formatLeadTimeLabel, type CutoffConfig } from "@/lib/order-cutoff";

export function CutoffCountdown({ config }: { config: CutoffConfig }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(formatEarliestDate(earliestBookableDate(config)));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [config]);

  return (
    <p className="catalog-cutoff">
      <span className="catalog-cutoff__label">{formatLeadTimeLabel(config)}</span>
      <span className="catalog-cutoff__time">{label ?? "…"}</span>
    </p>
  );
}
