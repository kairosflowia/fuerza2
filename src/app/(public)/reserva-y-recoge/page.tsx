import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { Faq } from "@/components/public/faq";
import { PageIntro } from "@/components/public/page-intro";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Reserva y recoge",
  description:
    "Descubre cómo funcionará la reserva anticipada de pan FUERZA y su recogida en Asturias.",
  path: "/reserva-y-recoge",
});

const steps = [
  ["01", "Elige tu pan.", "Consulta lo que está disponible para una fecha concreta."],
  ["02", "Elige cuándo y dónde recogerlo.", "Selecciona una opción compatible con la producción y la capacidad del punto."],
  ["03", "Paga y recógelo.", "La reserva queda confirmada únicamente después del pago."],
] as const;

const questions = [
  {
    question: "¿Puedo pagar cuando recoja el pan?",
    answer: "No. El pago será siempre anticipado y la reserva solo quedará confirmada cuando se complete correctamente.",
  },
  {
    question: "¿Podré comprar sin crear una cuenta?",
    answer: "Sí. Podrás completar una compra como invitado cuando el servicio esté activo.",
  },
  {
    question: "¿Qué ocurre si quiero cancelar?",
    answer: "La política de cancelación se publicará antes de activar las reservas. No queremos presentar condiciones que aún no han sido validadas.",
  },
] as const;

export default function ReservaYRecogePage() {
  return (
    <main id="main-content">
      <PageIntro
        eyebrow="Servicio en preparación"
        title="Reserva y recoge"
        description="Tu pan estará ligado a una fecha y a un punto de recogida reales. Sin promesas de stock que no podamos cumplir."
      />
      <Section>
        <Container>
          <div className="process-list" aria-label="Cómo funcionará la reserva">
            {steps.map(([number, title, description]) => (
              <Card className="process-step" key={number}>
                <span aria-hidden="true">{number}</span>
                <h2>{title}</h2>
                <p>{description}</p>
              </Card>
            ))}
          </div>
          <Alert variant="information" title="Reservas todavía no disponibles">
            Esta página explica el servicio. Todavía no hay catálogo, disponibilidad, carrito ni pago activos.
          </Alert>
        </Container>
      </Section>
      <Section tone="sunken">
        <Container className="institutional-grid">
          <div className="prose-block">
            <Badge variant="warning">Próximamente</Badge>
            <h2>Disponibilidad real</h2>
            <p>
              Cuando abramos las reservas, cada opción dependerá de la producción disponible, la fecha y la capacidad del punto elegido.
            </p>
            <p>No aceptaremos más reservas de las que podamos preparar y entregar.</p>
          </div>
          <div>
            <h2>Preguntas frecuentes</h2>
            <Faq items={questions} />
          </div>
        </Container>
      </Section>
    </main>
  );
}
