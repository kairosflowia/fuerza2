"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const productionTabs = [
  ["/admin/produccion", "Productos"],
  ["/admin/produccion/puntos", "Puntos"],
  ["/admin/produccion/pedidos", "Pedidos"],
  ["/admin/produccion/incidencias", "Incidencias"],
] as const;

export function ProductionTabs({ date }: { date: string }) {
  const pathname = usePathname();
  return (
    <nav className="admin-tabs" aria-label="Vistas de producción">
      {productionTabs.map(([href, label]) => (
        <Link href={`${href}?fecha=${date}`} key={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
