"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CategoryBar({ families }: { families: { slug: string; name: string }[] }) {
  const pathname = usePathname();
  const items = [{ slug: "", name: "Todas" }, ...families];

  return (
    <nav className="fz-chips" aria-label="Categorías">
      {items.map((family) => {
        const href = family.slug ? `/reserva-y-recoge/${family.slug}` : "/reserva-y-recoge";
        return (
          <Link href={href} key={href} className="fz-chip-link" aria-current={pathname === href ? "page" : undefined}>
            {family.name}
          </Link>
        );
      })}
    </nav>
  );
}
