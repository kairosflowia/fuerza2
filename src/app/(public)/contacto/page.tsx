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
        description="Escríbenos para consultas generales, recogidas o colaboraciones. Te respondemos por correo."
      />
      <Section>
        <Container className="institutional-grid">
          <div className="prose-block">
            <h2>Una pregunta cada vez</h2>
            <p>
              Rellena el formulario con tu consulta y te contestaremos al correo que nos indiques. También puedes escribirnos directamente a{" "}
              <a href="mailto:hola@fuerza.com">hola@fuerza.com</a>.
            </p>
          </div>
          <ContactForm />
        </Container>
      </Section>
    </main>
  );
}
