"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CategoryBar({ families }: { families: { slug: string; name: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="catalog-category-bar" aria-label="Categorías">
      <Link href="/reserva-y-recoge" aria-current={pathname === "/reserva-y-recoge" ? "page" : undefined}>Todas</Link>
      {families.map((family) => {
        const href = `/reserva-y-recoge/${family.slug}`;
        return <Link href={href} key={family.slug} aria-current={pathname === href ? "page" : undefined}>{family.name}</Link>;
      })}
    </nav>
  );
}
