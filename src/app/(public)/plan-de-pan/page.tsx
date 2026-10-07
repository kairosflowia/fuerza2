import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageIntro } from "@/components/public/page-intro";
import { ArrowRightIcon, CalendarIcon, PackageIcon, WheatIcon } from "@/components/ui/icons";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Plan de Pan",
  description: "Elige tus panes, cuándo quieres recogerlos y nosotros nos encargamos del resto.",
  path: "/plan-de-pan",
});

const BENEFITS = [
  { Icon: WheatIcon, title: "Elige tus panes", description: "Combina los panes de masa madre que quieras recibir y en qué cantidad." },
  { Icon: CalendarIcon, title: "Decide tu ritmo", description: "Cada semana, cada 2 o 3 semanas o cada mes, en uno o varios días." },
  { Icon: PackageIcon, title: "Nosotros los reservamos", description: "Tu pan queda reservado automáticamente y lo recoges en tu punto habitual." },
] as const;

export default function PlanDePanPage() {
  return (
    <main id="main-content" className="fz-plan-page">
      <section className="fz-plan-hero">
        <div className="fz-plan-hero__media">
          <Image src="/images/plan/plan-hero.jpg" alt="Pan de masa madre recién horneado sobre una tabla de madera, junto a espigas de trigo" fill priority sizes="(min-width: 64rem) 60vw, 100vw" />
        </div>
        <div className="fz-container fz-plan-hero__content">
          <PageIntro
            variant="editorial"
            eyebrow="Plan de Pan"
            title={"Tu pan,\na tu ritmo."}
            description="Elige tus panes, cuándo quieres recogerlos y nosotros nos encargamos del resto."
          />
          <Link className="fz-btn" href="/plan-de-pan/membresias">
            Crear mi Plan de Pan
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      <div className="fz-container">
        <section className="fz-plan-section" aria-labelledby="benefits-title">
          <p className="fz-eyebrow">Así de simple</p>
          <h2 id="benefits-title" className="fz-display">Tu pan, sin pensarlo</h2>
          <ol className="fz-plan-steps">
            {BENEFITS.map(({ Icon, title, description }, index) => (
              <li key={title} className="fz-plan-step">
                <span className="fz-plan-step__icon" aria-hidden="true"><Icon /></span>
                <div>
                  <h3><span className="fz-plan-step__number">{String(index + 1).padStart(2, "0")}.</span> {title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link className="fz-btn fz-plan-section__cta" href="/plan-de-pan/membresias">
            Crear mi Plan de Pan
            <ArrowRightIcon />
          </Link>
        </section>
      </div>
    </main>
  );
}
