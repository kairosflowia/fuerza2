"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PickupPointOption = { id: string; name: string };

type PickupPointState = {
  points: PickupPointOption[];
  selectedId: string;
  selected: PickupPointOption | null;
  select: (id: string) => void;
};

const Context = createContext<PickupPointState | null>(null);

export function PickupPointProvider({ points, children }: { points: PickupPointOption[]; children: ReactNode }) {
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    // Same mount-time hydration from localStorage as CartProvider: reads a
    // browser-only API, so it cannot run during the initial (server) render.
    const stored = localStorage.getItem("fuerza-pickup-point") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a client-only external source (localStorage), not deriving from props/state.
    setSelectedId(points.some((p) => p.id === stored) ? stored : (points[0]?.id ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- points is a static server-fetched prop; only the mount-time localStorage read matters here.
  }, []);

  useEffect(() => {
    if (selectedId) localStorage.setItem("fuerza-pickup-point", selectedId);
  }, [selectedId]);

  const value = useMemo<PickupPointState>(() => ({
    points,
    selectedId,
    selected: points.find((p) => p.id === selectedId) ?? null,
    select: setSelectedId,
  }), [points, selectedId]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePickupPoint() {
  const context = useContext(Context);
  if (!context) throw new Error("PickupPointProvider missing");
  return context;
}
