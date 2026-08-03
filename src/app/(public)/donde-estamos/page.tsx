import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { PageIntro } from "@/components/public/page-intro";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Dónde estamos",
  description:
    "Información sobre el obrador FUERZA en Avilés y sus futuros puntos de recogida.",
  path: "/donde-estamos",
});

export default function DondeEstamosPage() {
  return (
    <main id="main-content">
      <PageIntro
        eyebrow="Avilés, Asturias"
        title="Dónde estamos"
        description="Horneamos en Asturias y estamos preparando una red de recogida cercana y fácil de entender."
      />
      <Section>
        <Container>
          <div className="editorial-grid editorial-grid--two">
            <Card className="editorial-card editorial-card--ink">
              <p className="eyebrow">Obrador principal</p>
              <h2>FUERZA nace en Avilés</h2>
              <p>
                La ubicación exacta y las instrucciones de recogida se publicarán cuando estén confirmadas.
              </p>
              <p>Horario general del obrador: de 09:00 a 18:00.</p>
            </Card>
            <Card className="editorial-card">
              <p className="eyebrow">Puntos de recogida</p>
              <h2>Más cerca, sin perder el control</h2>
              <p>
                Muy pronto podrás consultar aquí todos nuestros puntos de recogida, sus días, horarios y productos disponibles.
              </p>
            </Card>
          </div>
        </Container>
      </Section>
      <Section tone="sunken">
        <Container className="split-callout">
          <div>
            <p className="eyebrow">Antes de venir</p>
            <h2>Cada punto tendrá sus propias reglas</h2>
          </div>
          <div className="prose-block">
            <p>
              La reserva indicará el lugar, el día y la ventana de recogida disponibles. No mostraremos un punto cerrado ni una opción incompatible con tu pan.
            </p>
            <Link className="text-link" href="/reserva-y-recoge">
              Cómo funcionará la recogida
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
