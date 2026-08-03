import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { PageIntro } from "@/components/public/page-intro";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Plan de Pan",
  description:
    "Conoce la futura suscripción de pan de masa madre de FUERZA en Asturias.",
  path: "/plan-de-pan",
});

const benefits = [
  ["Tu pan, previsto", "La producción podrá reservarse con antelación para quienes quieran una rutina estable."],
  ["Control en tus manos", "Podrás pausar, retomar o cancelar desde tu cuenta cuando el servicio esté disponible."],
  ["Menos desperdicio", "Planificar la producción ayuda a hornear lo necesario y a trabajar con más cuidado."],
] as const;

export default function PlanDePanPage() {
  return (
    <main id="main-content">
      <PageIntro
        eyebrow="Próximamente"
        title="Plan de Pan"
        description="Una forma sencilla de tener tu pan previsto, sin tener que empezar de cero cada semana."
      />
      <Section>
        <Container>
          <div className="institutional-grid">
            <div className="prose-block">
              <Badge variant="warning">Próximamente</Badge>
              <h2>Una suscripción pensada para la vida real</h2>
              <p>
                El Plan de Pan estará dirigido a quienes recogen pan con regularidad y quieren contar con una parte de la producción reservada.
              </p>
              <p>
                Funcionará mediante pago recurrente. Antes de abrirlo explicaremos con claridad la frecuencia, las condiciones y cada cobro.
              </p>
            </div>
            <div className="editorial-grid editorial-grid--three">
              {benefits.map(([title, description]) => (
                <Card key={title} className="editorial-card">
                  <h3>{title}</h3>
                  <p>{description}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>
      <Section tone="inverse">
        <Container className="split-callout">
          <div>
            <p className="eyebrow">Cuando esté listo</p>
            <h2>Primero, un servicio estable</h2>
          </div>
          <div className="prose-block">
            <p>
              La suscripción llegará después de validar el sistema de reserva y recogida. No hay planes, precios ni frecuencias definitivas publicados todavía.
            </p>
            <Link className="text-link" href="/contacto">
              Conoce las formas de contacto
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
