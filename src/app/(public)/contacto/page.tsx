import { Container, Section } from "@/components/ui/layout";
import { ContactForm } from "@/components/public/contact-form";
import { PageIntro } from "@/components/public/page-intro";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Contacto",
  description: "Información de contacto del obrador FUERZA en Asturias.",
  path: "/contacto",
});

export default function ContactoPage() {
  return (
    <main id="main-content">
      <PageIntro
        eyebrow="Hablemos"
        title="Contacto"
        description="Estamos preparando una vía de contacto que nos permita responder con atención y cuidar tus datos."
      />
      <Section>
        <Container className="institutional-grid">
          <div className="prose-block">
            <h2>Una pregunta cada vez</h2>
            <p>
              El formulario aún no envía mensajes. Cuando esté activo, podrás utilizarlo para consultas generales, recogidas y colaboraciones.
            </p>
            <p>No publicaremos datos de contacto hasta que estén confirmados.</p>
          </div>
          <ContactForm />
        </Container>
      </Section>
    </main>
  );
}
