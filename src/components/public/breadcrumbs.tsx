import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Estás aquí">
      <ol>
        <li><Link href="/">Inicio</Link></li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            <span aria-hidden="true">/</span>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
