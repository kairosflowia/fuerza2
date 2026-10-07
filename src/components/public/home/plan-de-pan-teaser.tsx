import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/ui/icons";

export function PlanDePanTeaser() {
  return (
    <section className="fz-plan" aria-labelledby="plan-title">
      <div className="fz-plan__copy">
        <p className="fz-eyebrow">Plan de Pan</p>
        <h2 id="plan-title" className="fz-display">Pan de verdad, cada semana.</h2>
        <p>Suscríbete a nuestro Plan de Pan y recibe tus panes favoritos de forma regular. Sin complicaciones, solo pan bueno.</p>
        <Link className="fz-btn" href="/plan-de-pan">
          Descubrir el Plan de Pan
          <ArrowRightIcon />
        </Link>
      </div>
      <div className="fz-plan__media">
        <Image src="/bolsa-fuerza.png" alt="Bolsa de tela FUERZA con hogazas de masa madre" fill sizes="(min-width: 64rem) 30vw, 100vw" />
      </div>
    </section>
  );
}
