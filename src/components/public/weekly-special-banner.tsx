import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/catalog-domain";
import type { WeeklySpecial } from "@/lib/weekly-special";

function formatSaturday(date: string) {
  const formatted = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T00:00:00`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function WeeklySpecialBanner({ special }: { special: WeeklySpecial }) {
  const href = special.product.familySlug ? `/reserva-y-recoge/${special.product.familySlug}/${special.product.slug}` : `/pan/${special.product.slug}`;

  return (
    <Link href={href} className="weekly-special">
      <span className="weekly-special__image">
        {special.product.imagePath ? (
          <Image src={`/api/product-images/${special.product.imagePath}`} alt={special.product.imageAlt} width={640} height={480} priority />
        ) : (
          <span className="catalog-image-empty" aria-hidden="true" />
        )}
      </span>
      <span className="weekly-special__body">
        <Badge variant="primary">Especial de la semana</Badge>
        <span className="weekly-special__date">Para recoger el {formatSaturday(special.collectionDate)}</span>
        <h3>{special.headline || special.product.name}</h3>
        {special.headline ? <p className="weekly-special__product-name">{special.product.name}</p> : null}
        {special.product.shortDescription ? <p>{special.product.shortDescription}</p> : null}
        {special.product.priceCents !== null ? <span className="weekly-special__price">{formatPrice(special.product.priceCents)}</span> : null}
        <p className="weekly-special__priority">Con Fuerza Habitual, reservas el especial antes que el público general.</p>
        <span className="weekly-special__cta">Reservar →</span>
      </span>
    </Link>
  );
}
