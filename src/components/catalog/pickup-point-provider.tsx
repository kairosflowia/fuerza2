"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { PICKUP_DATE_COOKIE, PICKUP_POINT_COOKIE } from "@/lib/pickup-selection";

export type PickupPointOption = { id: string; name: string };

type PickupPointState = {
  points: PickupPointOption[];
  selectedId: string;
  selected: PickupPointOption | null;
  select: (id: string) => void;
  date: string;
  minDate: string;
  setDate: (date: string) => void;
};

const Context = createContext<PickupPointState | null>(null);

function setCookie(name: string, value: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=15552000; SameSite=Lax${secure}`;
}

/**
 * El punto y la fecha de recogida se guardan en cookies (no solo
 * localStorage) para que las páginas de servidor puedan leer la misma
 * selección con cookies() y calcular disponibilidad real sin depender de un
 * fetch adicional en el cliente (Fase 3 del Plano Mestre UX/UI).
 */
export function PickupPointProvider({
  points,
  initialPointId,
  initialDate,
  minDate,
  children,
}: {
  points: PickupPointOption[];
  initialPointId: string;
  initialDate: string;
  minDate: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialPointId);
  const [date, setDateState] = useState(initialDate);

  const select = (id: string) => {
    setSelectedId(id);
    setCookie(PICKUP_POINT_COOKIE, id);
    router.refresh();
  };

  const setDate = (value: string) => {
    setDateState(value);
    setCookie(PICKUP_DATE_COOKIE, value);
    router.refresh();
  };

  const value = useMemo<PickupPointState>(() => ({
    points,
    selectedId,
    selected: points.find((p) => p.id === selectedId) ?? null,
    select,
    date,
    minDate,
    setDate,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- select/setDate son estables entre renders (no dependen de props/estado fuera de este cierre).
  }), [points, selectedId, date, minDate]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePickupPoint() {
  const context = useContext(Context);
  if (!context) throw new Error("PickupPointProvider missing");
  return context;
}
