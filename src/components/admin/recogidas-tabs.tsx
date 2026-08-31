"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const recogidasTabs = [
  ["/admin/puntos-de-recogida", "Puntos"],
  ["/admin/puntos-de-recogida/calendario", "Calendario"],
] as const;

/**
 * Puntos de recogida y su calendario de cierres/excepciones son la misma
 * área de "Recogidas" (Fase 12 del Plano Mestre) -- antes vivían en
 * secciones de navegación distintas (Operaciones vs. Configuración).
 */
export function RecogidasTabs() {
  const pathname = usePathname();
  return (
    <nav className="admin-tabs" aria-label="Vistas de recogidas">
      {recogidasTabs.map(([href, label]) => (
        <Link href={href} key={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
