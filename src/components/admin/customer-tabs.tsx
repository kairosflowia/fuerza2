"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const customerTabs = [
  ["/admin/clientes", "Clientes"],
  ["/admin/clientes/suscritos", "Suscritos"],
] as const;

export function CustomerTabs() {
  const pathname = usePathname();
  return (
    <nav className="admin-tabs" aria-label="Vistas de clientes">
      {customerTabs.map(([href, label]) => (
        <Link href={href} key={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
