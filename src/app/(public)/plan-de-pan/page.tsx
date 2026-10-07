import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageIntro } from "@/components/public/page-intro";
import { PlanFrequencyPicker } from "@/components/subscriptions/plan-frequency-picker";
import { ArrowRightIcon, CalendarIcon, PackageIcon, WheatIcon } from "@/components/ui/icons";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Plan de Pan",
  description: "Suscríbete y recibe tu pan de masa madre con la frecuencia que elijas, sin tener que reservar cada vez.",
  path: "/plan-de-pan",
});

const STEPS = [
  { Icon: WheatIcon, title: "Elige tu pan", description: "Monta tu cesta con el pan de masa madre que quieras recibir." },
  { Icon: CalendarIcon, title: "Define tu frecuencia", description: "Escoge la frecuencia que mejor se adapte a tu rutina: semanal, quincenal, cada 3 semanas o mensual." },
  { Icon: PackageIcon, title: "Recíbelo sin volver a pedir", description: "Tu pan queda reservado automáticamente según tu suscripción. Lo recoges en tu punto habitual, sin complicaciones." },
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
            description="Suscríbete a la calidad artesanal. Recibe tu pan favorito con la frecuencia que decidas, sin complicaciones ni pedidos de último minuto."
          />
          <Link className="fz-btn" href="/plan-de-pan/membresias">
            Configurar suscripción
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      <div className="fz-container">
        <section className="fz-plan-section" aria-labelledby="steps-title">
          <p className="fz-eyebrow">Así de simple</p>
          <h2 id="steps-title" className="fz-display">El proceso artesanal</h2>
          <ol className="fz-plan-steps">
            {STEPS.map(({ Icon, title, description }, index) => (
              <li key={title} className="fz-plan-step">
                <span className="fz-plan-step__icon" aria-hidden="true"><Icon /></span>
                <div>
                  <h3><span className="fz-plan-step__number">{String(index + 1).padStart(2, "0")}.</span> {title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <PlanFrequencyPicker />
      </div>
    </main>
  );
}
