import type { Metadata } from "next";
import Link from "next/link";

import { EditorialGrid, SectionHeading, ValueCard } from "@/components/public/editorial";
import { PageIntro } from "@/components/public/page-intro";
import { Card, Container, Section } from "@/components/ui";
import { FREQUENCY_DESCRIPTIONS_ES, FREQUENCY_LABELS_ES, type SubscriptionFrequency } from "@/lib/subscriptions-domain";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Fuerza Habitual",
  description: "Suscríbete y recibe tu pan de masa madre sin tener que reservar cada vez.",
  path: "/plan-de-pan",
});

const FREQUENCIES: SubscriptionFrequency[] = ["weekly", "biweekly", "every_3_weeks", "monthly"];

export default function FuerzaHabitualLanding() {
  return (
    <main id="main-content">
      <PageIntro
        eyebrow="Pan fresco en casa, cada semana"
        title="Fuerza Habitual"
        description="Suscríbete y recibe pan de masa madre recién horneado, sin tener que reservar cada vez. Simple, cómodo y con un 5% de descuento cuando eliges 4 unidades o más."
      />

      <Section>
        <Container size="wide">
          <div className="component-row">
            <Link className="button button--primary" href="/plan-de-pan/membresias">Conocer membresías</Link>
          </div>
        </Container>
      </Section>

      <Section tone="sunken">
        <Container size="wide">
          <SectionHeading eyebrow="Así de simple" title="¿Cómo funciona Fuerza Habitual?" />
          <EditorialGrid columns={3}>
            <ValueCard number="01" title="Elige tu pan">
              Monta tu cesta con el pan de masa madre que quieras recibir dentro de Fuerza Habitual.
            </ValueCard>
            <ValueCard number="02" title="Define tu frecuencia">
              Escoge la frecuencia que mejor se adapte a tu rutina: semanal, quincenal, cada 3 semanas o mensual.
            </ValueCard>
            <ValueCard number="03" title="Recíbelo sin volver a pedir">
              Tu pan queda reservado automáticamente según tu suscripción. Lo recoges en tu punto habitual, sin tener que reservar cada vez.
            </ValueCard>
          </EditorialGrid>
          <p>
            <Link href="/donde-estamos">Ver puntos de recogida</Link>
          </p>
        </Container>
      </Section>

      <Section>
        <Container size="wide">
          <SectionHeading eyebrow="A tu ritmo" title="Elige tu frecuencia ideal" />
          <EditorialGrid columns={4}>
            {FREQUENCIES.map((frequency) => (
              <Card key={frequency}>
                <h3>{FREQUENCY_LABELS_ES[frequency]}</h3>
                <p>{FREQUENCY_DESCRIPTIONS_ES[frequency]}</p>
              </Card>
            ))}
          </EditorialGrid>
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
