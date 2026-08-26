import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/catalog-domain";

import { cn } from "@/lib/cn";

import { Badge } from "../ui/badge";

export function EditorialGrid({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return <div className={cn("editorial-grid", `editorial-grid--${columns}`)}>{children}</div>;
}

export type PillarIcon = "tradicion" | "ingredientes" | "tiempo" | "comunidad";

export function ValueCard({ number, icon, image, title, children, tone = "plain" }: { number?: string; icon?: PillarIcon; image?: string; title: string; children: ReactNode; tone?: "plain" | "yellow" | "green" | "blue" | "terracotta" }) {
  return (
    <article className={cn("value-card", `value-card--${tone}`, image && "value-card--image")}>
      {image ? (
        <>
          <span className="value-card__illustration">
            <Image src={image} alt={title} width={320} height={320} />
          </span>
          <h3 className="sr-only">{title}</h3>
        </>
      ) : (
        <>
          {number ? <span className="value-card__number" aria-hidden="true">{number}</span> : null}
          {icon ? <span className={cn("value-card__icon", `value-card__icon--${icon}`)} aria-hidden="true" /> : null}
          <h3>{title}</h3>
        </>
      )}
      <p>{children}</p>
    </article>
  );
}

export function EditorialProductCard({ index }: { index: number }) {
  return (
    <article className="editorial-product">
      <div className="editorial-product__placeholder" aria-hidden="true">
        <span>{String(index).padStart(2, "0")}</span>
      </div>
      <Badge variant="information">Contenido provisional</Badge>
      <h3>Producto pendiente de alta</h3>
      <p>Este espacio recibirá nombre, ingredientes y fotografía cuando el catálogo esté aprobado.</p>
      <span className="editorial-product__pending">Sin precio ni disponibilidad</span>
    </article>
  );
}

export function EditorialProductPreview({ slug, name, description, imagePath, imageAlt, priceCents }: { slug: string; name: string; description: string | null; imagePath: string | null; imageAlt: string; priceCents: number | null }) {
  return (
    <Link href={`/pan/${slug}`} className="editorial-product">
      {imagePath ? (
        <span className="editorial-product__image">
          <Image src={`/api/product-images/${imagePath}`} alt={imageAlt} width={480} height={360} />
        </span>
      ) : (
        <div className="editorial-product__placeholder" aria-hidden="true"><span>?</span></div>
      )}
      <h3>{name}</h3>
      {description ? <p>{description}</p> : null}
      {priceCents !== null ? <span className="editorial-product__price">Desde {formatPrice(priceCents)}</span> : null}
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </header>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="text-link" href={href}>{children}</Link>;
}
