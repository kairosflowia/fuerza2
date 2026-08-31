"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import { MoreIcon } from "./icons";

/**
 * Menú de acciones secundarias ("•••") para no exponer más de una acción
 * primaria por fila de tabla o tarjeta (Fase 6 del Plano Mestre UX/UI).
 * Cada hijo debe ser un <button> o <Link> ya estilado como opción de menú
 * (className="menu__item"); onSelect cierra el menú al elegir una opción,
 * sin interferir con la navegación o el submit del propio elemento.
 */
export function ActionMenu({ label = "Más acciones", align = "end", children, className }: {
  label?: string;
  align?: "start" | "end";
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={cn("menu", className)} ref={ref}>
      <button type="button" className="menu__trigger" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <MoreIcon />
      </button>
      {open ? (
        <div className={cn("menu__body", align === "start" && "menu__body--start")} role="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
