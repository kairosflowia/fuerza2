"use client";
import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { cn } from "@/lib/cn";

const HOTSPOTS = [
  { id: "masa-madre", x: 15, y: 62, tone: "green", title: "Masa Madre Viva", text: "Cultivo propio alimentado a diario con harinas locales de Asturias." },
  { id: "harina", x: 55, y: 30, tone: "yellow", title: "Harinas integrales molidas a la piedra", text: "100% grano entero sin aditivos ni conservantes." },
  { id: "corteza", x: 33, y: 40, tone: "yellow", title: "Corteza Crujiente", text: "Caramelización natural y horneado a la piedra." },
  { id: "miga", x: 78, y: 55, tone: "green", title: "Miga Alveolada", text: "Fermentación lenta de 24 a 48 horas para una digestión ligera." },
] as const;

function popoverAlign(x: number): "left" | "center" | "right" {
  if (x < 25) return "left";
  if (x > 75) return "right";
  return "center";
}

/**
 * Abre con hover o clic (para pantallas táctiles); cierra al quitar el
 * cursor, con Escape o al hacer clic fuera (Documento de la petición).
 */
export function BreadAnatomy() {
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpenId(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="bread-anatomy" ref={rootRef}>
      <Image
        src="https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1600&q=80"
        alt="Hogaza de pan de masa madre cortada en rebanadas sobre una tabla de madera, espolvoreada con harina."
        fill
        sizes="(max-width: 767px) 100vw, 60rem"
        style={{ objectFit: "cover" }}
      />
      {HOTSPOTS.map((hotspot) => (
        <div key={hotspot.id} className="bread-anatomy__marker" style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}>
          <button
            type="button"
            className={cn("bread-anatomy__hotspot", `bread-anatomy__hotspot--${hotspot.tone}`)}
            aria-expanded={openId === hotspot.id}
            aria-controls={`bread-anatomy-popover-${hotspot.id}`}
            onMouseEnter={() => setOpenId(hotspot.id)}
            onMouseLeave={() => setOpenId((current) => (current === hotspot.id ? null : current))}
            onFocus={() => setOpenId(hotspot.id)}
            onClick={() => setOpenId((current) => (current === hotspot.id ? null : hotspot.id))}
          >
            <span className="sr-only">{hotspot.title}</span>
          </button>
          {openId === hotspot.id ? (
            <div id={`bread-anatomy-popover-${hotspot.id}`} className={cn("bread-anatomy__popover", `bread-anatomy__popover--${popoverAlign(hotspot.x)}`)} role="tooltip">
              <h3>{hotspot.title}</h3>
              <p>{hotspot.text}</p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
