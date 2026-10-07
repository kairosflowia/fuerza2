/* eslint-disable @next/next/no-img-element -- ilustración vectorial de marca. */
import type { ReactNode } from "react";

import Link from "next/link";

import { ArrowRightIcon } from "@/components/ui/icons";

/** Rejilla editorial de panes: título con espiga, enlace secundario y tarjetas. */
export function ProductGrid({ title, link, children }: { title: string; link?: { label: string; href: string }; children: ReactNode }) {
  return (
    <section className="fz-section" aria-labelledby="products-title">
      <div className="fz-section__head">
        <h2 id="products-title" className="fz-section__title fz-display">
          {title}
          <img src="/illustrations/sprig.svg" alt="" width={44} height={25} aria-hidden="true" />
        </h2>
        {link ? (
          <Link className="fz-link" href={link.href}>
            {link.label}
            <ArrowRightIcon />
          </Link>
        ) : null}
      </div>
      <div className="fz-products">{children}</div>
    </section>
  );
}
