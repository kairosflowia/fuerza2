import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowRightIcon } from "@/components/ui/icons";

/** Hero fotográfico con borde superior ondulado: la propia foto aporta la zona oscura bajo el texto. */
export function EditorialHero({
  eyebrow,
  title,
  lead,
  cta,
  image,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  cta: { label: string; href: string };
  image: { src: string; alt: string };
}) {
  return (
    <section className="fz-hero" aria-labelledby="hero-title">
      <div className="fz-hero__media">
        <Image src={image.src} alt={image.alt} fill priority sizes="100vw" />
      </div>
      <div className="fz-container">
        <div className="fz-hero__content">
          <p className="fz-hero__eyebrow">{eyebrow}</p>
          <h1 id="hero-title" className="fz-display">{title}</h1>
          <p className="fz-hero__lead">{lead}</p>
          <Link className="fz-btn" href={cta.href}>
            {cta.label}
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
