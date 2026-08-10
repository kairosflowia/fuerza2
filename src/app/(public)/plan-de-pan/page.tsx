import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/public/editorial";
import { PageIntro } from "@/components/public/page-intro";
import { CalendarIcon, PackageIcon, WheatIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui";
import { FREQUENCY_DESCRIPTIONS_ES, FREQUENCY_LABELS_ES, type SubscriptionFrequency } from "@/lib/subscriptions-domain";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Fuerza Habitual",
  description: "Suscríbete y recibe tu pan de masa madre sin tener que reservar cada vez.",
  path: "/plan-de-pan",
});

const STEPS = [
  { icon: WheatIcon, title: "Elige tu pan", description: "Monta tu cesta con el pan de masa madre que quieras recibir dentro de Fuerza Habitual." },
  { icon: CalendarIcon, title: "Define tu frecuencia", description: "Escoge la frecuencia que mejor se adapte a tu rutina: semanal, quincenal, cada 3 semanas o mensual." },
  { icon: PackageIcon, title: "Recíbelo sin volver a pedir", description: "Tu pan queda reservado automáticamente según tu suscripción. Lo recoges en tu punto habitual, sin tener que reservar cada vez." },
] as const;

const FREQUENCIES: SubscriptionFrequency[] = ["weekly", "biweekly", "every_3_weeks", "monthly"];
const FEATURED_FREQUENCY: SubscriptionFrequency = "biweekly";

export default function FuerzaHabitualLanding() {
  return (
    <main id="main-content">
      <Section>
        <Container size="wide">
          <div className="plan-hero">
            <div className="plan-hero__copy">
              <PageIntro
                eyebrow="Fuerza Habitual"
                title="¿Cómo funciona Fuerza Habitual?"
                description="Suscríbete a la calidad artesanal. Recibe tu pan favorito con la frecuencia que decidas, sin complicaciones ni pedidos de último minuto."
              />
              <Link className="button button--primary plan-hero__cta" href="/plan-de-pan/membresias">Configurar suscripción</Link>
            </div>
            <div className="plan-hero__media">
              <Image
                src="https://images.unsplash.com/photo-1757606406505-8f7dfe834719?auto=format&fit=crop&w=1280&q=75"
                alt="Panes de masa madre recién horneados junto a espigas de trigo"
                width={1280}
                height={960}
                priority
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="sunken">
        <Container size="wide">
          <SectionHeading eyebrow="Así de simple" title="El proceso artesanal" />
          <div className="plan-steps">
            {STEPS.map(({ icon: Icon, title, description }) => (
              <article key={title} className="plan-step">
                <span className="plan-step__icon" aria-hidden="true"><Icon /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <p>
            <Link href="/donde-estamos">Ver puntos de recogida</Link>
          </p>
        </Container>
      </Section>

      <Section>
        <Container size="wide">
          <SectionHeading eyebrow="A tu ritmo" title="Elige tu frecuencia ideal" />
          <div className="plan-frequency-grid">
            {FREQUENCIES.map((frequency) => {
              const featured = frequency === FEATURED_FREQUENCY;
              return (
                <Link
                  key={frequency}
                  href={`/plan-de-pan/membresias?frecuencia=${frequency}`}
                  className={`plan-frequency-card${featured ? " plan-frequency-card--featured" : ""}${frequency === "monthly" ? " plan-frequency-card--wide" : ""}`}
                >
                  {featured ? <span className="plan-frequency-card__popular">Popular</span> : null}
                  <span className="plan-frequency-card__content">
                    <span className="plan-frequency-card__number" aria-hidden="true">{String(FREQUENCIES.indexOf(frequency) + 1).padStart(2, "0")}</span>
                    <span className="plan-frequency-card__title">{FREQUENCY_LABELS_ES[frequency]}</span>
                    <span className="plan-frequency-card__description">{FREQUENCY_DESCRIPTIONS_ES[frequency]}</span>
                  </span>
                  <span className="plan-frequency-card__action">Seleccionar</span>
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section tone="sunken">
        <Container size="wide">
          <SectionHeading
            eyebrow="Tu cesta, tu pan"
            title="Conoce los panes disponibles en membresía"
            description="Explora los panes disponibles en formato Fuerza Habitual y elige los que mejor se adapten a tu rutina. Con 4 unidades o más en tu cesta, el 5% de descuento se aplica automáticamente."
          />
          <Link className="button button--primary" href="/plan-de-pan/membresias">Ver membresías</Link>
        </Container>
      </Section>
    </main>
  );
}
